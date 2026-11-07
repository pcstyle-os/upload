import { test } from "node:test";
import assert from "node:assert/strict";
import { directUrl, fileUrl, previewKind, previewUrl } from "./files";
import { createShareLink } from "./share";
import { listZip } from "./zip";
import { GET } from "../app/api/files/[key]/route";
import { GET as directFile } from "../app/f/[key]/route";
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
  assert.equal(previewKind("report.pdf", "application/pdf"), "pdf");
  for (const [name, type, expected] of [
    ["clip", "video/mp4", "video"],
    ["song", "audio/mpeg", "audio"],
    ["scan.PDF", "application/octet-stream", "pdf"],
    ["photo.webp", "", "image"],
    ["clip.mp4", "application/octet-stream", "video"],
    ["song.mp3", "", "audio"],
    ["notes.txt", "text/plain;charset=utf-8", "text"],
    ["data", "application/json", "text"],
    ["main.rs", "application/octet-stream", "text"],
    ["archive.zip", "application/zip", "archive"],
    ["backup.ZIP", "application/octet-stream", "archive"],
    ["document.docx", "application/octet-stream", "other"],
  ]) assert.equal(previewKind(name, type), expected, name);
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

test("domain links redirect without fetching, or download exact bytes with a safe filename", async () => {
  const original = globalThis.fetch;
  const file = { key: "abc123", name: "a & b#?.pdf" };
  const params = Promise.resolve({ key: file.key });
  try {
    globalThis.fetch = (async () => { assert.fail("redirect must not fetch"); }) as typeof fetch;
    assert.equal(directUrl(file), "https://upload.pcstyle.dev/f/abc123");
    const redirect = await directFile(new Request(directUrl(file)), { params });
    assert.equal(redirect.status, 307);
    assert.equal(redirect.headers.get("location"), "https://8jtw7yklci.ufs.sh/f/abc123");
    assert.equal((await directFile(new Request(directUrl(file)), { params: Promise.resolve({ key: "../escape" }) })).status, 400);

    const bytes = new Uint8Array([0, 255, 42, 13, 10]);
    globalThis.fetch = (async (url) => {
      assert.equal(url, "https://8jtw7yklci.ufs.sh/f/abc123");
      return new Response(bytes);
    }) as typeof fetch;
    const url = directUrl(file, true);
    assert.equal(new URL(url).searchParams.get("name"), file.name);
    const download = await directFile(new Request(url), { params });
    assert.equal(download.status, 200);
    assert.equal(download.headers.get("content-disposition"), "attachment; filename*=UTF-8''a%20%26%20b%23%3F.pdf");
    assert.deepEqual(new Uint8Array(await download.arrayBuffer()), bytes);

    // a resumed download asks for a range and gets exactly that part back
    globalThis.fetch = (async (_url, init) => {
      const range = new Headers(init?.headers).get("range");
      assert.equal(range, "bytes=2-3");
      return new Response(bytes.slice(2, 4), { status: 206, headers: { "Content-Range": "bytes 2-3/5", "Content-Length": "2" } });
    }) as typeof fetch;
    const part = await directFile(new Request(url, { headers: { Range: "bytes=2-3" } }), { params });
    assert.equal(part.status, 206);
    assert.equal(part.headers.get("content-range"), "bytes 2-3/5");
    assert.equal(part.headers.get("content-disposition"), "attachment; filename*=UTF-8''a%20%26%20b%23%3F.pdf");
    assert.deepEqual(new Uint8Array(await part.arrayBuffer()), bytes.slice(2, 4));
    // the uploaded name from the CDN wins over a relabelled link
    globalThis.fetch = (async () => new Response(bytes, { headers: { "Content-Disposition": "inline; filename=\"x\"; filename*=UTF-8''real%20name.png" } })) as typeof fetch;
    assert.equal((await directFile(new Request(directUrl({ key: "abc123", name: "evil.html" }, true)), { params })).headers.get("content-disposition"), "attachment; filename*=UTF-8''real%20name.png");

    globalThis.fetch = (async () => new Response(null, { status: 404 })) as typeof fetch;
    const missing = await directFile(new Request(url), { params });
    assert.equal(missing.status, 307);
    assert.equal(new URL(missing.headers.get("location")!).pathname, "/view/abc123");
  } finally { globalThis.fetch = original; }
});

test("zip listings come from the central directory, ignoring junk and decoy signatures", async () => {
  const enc = new TextEncoder();
  const files: [string, string][] = [["site/", ""], ["site/index.html", "<h1>hi</h1>"], ["site/img/łódź.png", "x".repeat(300)], ["__MACOSX/site/._index.html", "junk"], ["site/.DS_Store", "junk"]];
  const local: Uint8Array[] = [], central: Uint8Array[] = [];
  let offset = 0;
  for (const [name, body] of files) {
    const n = enc.encode(name), data = enc.encode(body);
    const lh = new Uint8Array(30 + n.length), l = new DataView(lh.buffer);
    l.setUint32(0, 0x04034b50, true); l.setUint16(6, 0x800, true); l.setUint32(18, data.length, true); l.setUint32(22, data.length, true); l.setUint16(26, n.length, true); lh.set(n, 30);
    const ch = new Uint8Array(46 + n.length), c = new DataView(ch.buffer);
    c.setUint32(0, 0x02014b50, true); c.setUint16(8, 0x800, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, n.length, true); c.setUint32(42, offset, true); ch.set(n, 46);
    local.push(lh, data); central.push(ch); offset += lh.length + data.length;
  }
  // an archive comment that itself contains an end-record signature
  const comment = new Uint8Array([0x50, 0x4b, 0x05, 0x06, ...new Uint8Array(30)]);
  const dirSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22), e = new DataView(end.buffer);
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, dirSize, true); e.setUint32(16, offset, true); e.setUint16(20, comment.length, true);
  const all = new Uint8Array([...local.flatMap(part => [...part]), ...central.flatMap(part => [...part]), ...end, ...comment]);

  const reads: string[] = [];
  const zip = await listZip(all.length, async (start, stop) => { reads.push(`${start}-${stop}`); return all.slice(start, stop + 1); });
  assert.deepEqual(zip, {
    entries: [{ name: "site/", size: 0, dir: true }, { name: "site/index.html", size: 11, dir: false }, { name: "site/img/łódź.png", size: 300, dir: false }],
    unpacked: 311,
    truncated: false,
  });
  assert.deepEqual(reads, [`0-${all.length - 1}`], "a small archive needs only the tail read");
  assert.equal(await listZip(all.length - 1, async (start, stop) => all.slice(start, stop + 1)), null, "a cut-off archive is not a zip");
});
