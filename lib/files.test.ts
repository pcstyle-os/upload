import { test } from "node:test";
import assert from "node:assert/strict";
import { fileUrl, previewKind, previewUrl } from "./files";
import { createShareLink } from "./share";
import { GET } from "../app/api/files/[key]/route";
import { ourFileRouter } from "../app/api/uploadthing/core";
import { fileSizeToBytes, isValidSize, matchFileType } from "@uploadthing/shared";
import * as Micro from "effect/Micro";

test("HTML maps to the blob rule and all routes retain the 1 GB boundary", () => {
  for (const name of ["page.html", "page.htm"]) {
    assert.equal(Micro.runSync(matchFileType({ name, type: "text/html", size: 42 }, ["image", "video", "pdf", "blob"])), "blob");
  }
  for (const route of Object.values(ourFileRouter)) {
    for (const config of Object.values(route.routerConfig)) {
      const limit = Micro.runSync(fileSizeToBytes(config.maxFileSize));
      assert.equal(limit, 1073741824);
      assert.equal(isValidSize({ size: 1073741824 } as File, 0, limit), true);
      assert.equal(isValidSize({ size: 1073741825 } as File, 0, limit), false);
    }
  }
});

test("file keys cannot escape the app CDN or inject URL components", () => {
  assert.equal(fileUrl("file-123_image.png"), "https://8jtw7yklci.ufs.sh/f/file-123_image.png");
  for (const key of ["", "..", "../admin", "%2fadmin", "//evil.test", "https://evil.test", "foo?bar", "foo#bar", "a".repeat(257)]) {
    assert.equal(fileUrl(key), null, key);
  }
});

test("HTML extension fallback, MIME detection, and preview URL encoding", () => {
  assert.equal(previewKind("report.HTM", "application/octet-stream"), "html");
  assert.equal(previewKind("report", "text/html; charset=utf-8"), "html");
  assert.equal(previewKind("report.html.png", "image/png"), "image");
  assert.equal(previewKind("report.pdf", "application/pdf"), "other");
  const url = new URL(previewUrl({ key: "abc123", name: "a & b#?.html" }));
  assert.equal(url.origin, "https://upload.pcstyle.dev");
  assert.equal(url.pathname, "/view/abc123");
  assert.equal(url.searchParams.get("name"), "a & b#?.html");
  assert.equal(url.searchParams.size, 1);
});

test("shortener receives the preview URL, and failures retain a working link", async () => {
  const original = globalThis.fetch;
  const file = { key: "abc123", name: "test.html" };
  try {
    globalThis.fetch = (async (url, options) => {
      assert.equal(url, "https://small-horse-338.convex.cloud/api/mutation");
      assert.equal(options?.method, "POST");
      assert.deepEqual(JSON.parse(String(options?.body)), {
        path: "links:createLink", args: { url: "https://upload.pcstyle.dev/view/abc123?name=test.html" }, format: "json",
      });
      return Response.json({ status: "success", value: { shortUrl: "https://s.pcstyle.dev/aB12cd" } });
    }) as typeof fetch;
    assert.deepEqual(await createShareLink(file), {
      shareUrl: "https://s.pcstyle.dev/aB12cd", previewUrl: "https://upload.pcstyle.dev/view/abc123?name=test.html", shortened: true,
    });
    for (const response of [
      new Response("unavailable", { status: 503 }),
      Response.json({ status: "error", errorMessage: "unavailable" }),
      Response.json({ status: "success", value: { shortUrl: "https://s.pcstyle.dev.evil.test/foo" } }),
      new Response("not json"),
    ]) {
      globalThis.fetch = (async () => response) as typeof fetch;
      const result = await createShareLink(file);
      assert.equal(result.shortened, false);
      assert.equal(result.shareUrl, "https://upload.pcstyle.dev/view/abc123?name=test.html");
    }
    globalThis.fetch = (async () => { throw new Error("timeout"); }) as typeof fetch;
    assert.equal((await createShareLink(file)).shortened, false);
  } finally { globalThis.fetch = original; }
});

test("HTML streams inline with a response-level sandbox; downloads preserve bytes", async () => {
  const original = globalThis.fetch;
  const bytes = new TextEncoder().encode("<h1>preview</h1><script>window.test=1</script>");
  try {
    globalThis.fetch = (async (url, options) => {
      assert.equal(url, "https://8jtw7yklci.ufs.sh/f/abc123");
      assert.equal(options?.redirect, "error");
      return new Response(bytes, { headers: { "Content-Disposition": "attachment", "Set-Cookie": "bad=1" } });
    }) as typeof fetch;
    const params = Promise.resolve({ key: "abc123" });
    const response = await GET(new Request("https://upload.pcstyle.dev/api/files/abc123"), { params });
    assert.equal(response.headers.get("content-disposition"), "inline");
    assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
    const csp = response.headers.get("content-security-policy")!;
    assert.match(csp, /sandbox allow-scripts;/);
    assert.doesNotMatch(csp, /allow-same-origin|allow-top-navigation|allow-popups/);
    assert.match(csp, /frame-ancestors 'self'/);
    assert.equal(response.headers.get("set-cookie"), null);
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);

    const download = await GET(new Request("https://upload.pcstyle.dev/api/files/abc123?download=1&name=a%0D%0Ab.html"), { params });
    assert.equal(download.headers.get("content-type"), "application/octet-stream");
    assert.equal(download.headers.get("content-disposition"), "attachment; filename*=UTF-8''a%0D%0Ab.html");
    assert.deepEqual(new Uint8Array(await download.arrayBuffer()), bytes);
  } finally { globalThis.fetch = original; }
});

test("invalid keys never fetch, and missing/upstream failures stay errors", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = (async () => { assert.fail("must not fetch"); }) as typeof fetch;
    const request = new Request("https://upload.pcstyle.dev/api/files/invalid");
    assert.equal((await GET(request, { params: Promise.resolve({ key: "../admin" }) })).status, 400);
    for (const [upstream, expected] of [[404, 404], [403, 502], [500, 502]]) {
      globalThis.fetch = (async () => new Response("failure", { status: upstream })) as typeof fetch;
      assert.equal((await GET(request, { params: Promise.resolve({ key: "missing" }) })).status, expected);
    }
    globalThis.fetch = (async () => { throw new Error("network"); }) as typeof fetch;
    assert.equal((await GET(request, { params: Promise.resolve({ key: "missing" }) })).status, 502);
  } finally { globalThis.fetch = original; }
});
