import { fileUrl } from "@/lib/files";

export async function GET(request: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  const source = fileUrl(key);
  if (!source) return new Response("Invalid file", { status: 400 });

  let upstream: Response;
  try {
    upstream = await fetch(source, {
      redirect: "error",
      cache: "no-store",
      signal: request.signal,
    });
  } catch {
    return new Response("File unavailable. Please try again.", { status: 502 });
  }
  if (!upstream.ok) {
    await upstream.body?.cancel();
    return new Response("File unavailable", { status: upstream.status === 404 ? 404 : 502 });
  }

  const search = new URL(request.url).searchParams;
  const download = search.get("download") === "1";
  const name = Array.from(search.get("name") || key).slice(0, 255).join("");
  const filename = encodeURIComponent(name).replace(/['()*]/g, c => `%${c.charCodeAt(0).toString(16)}`);

  // Both the iframe and this response enforce an opaque origin. The response
  // sandbox also protects users who navigate to the HTML endpoint directly.
  return new Response(upstream.body, {
    headers: {
      "Content-Type": download ? "application/octet-stream" : "text/html; charset=utf-8",
      "Content-Disposition": download ? `attachment; filename*=UTF-8''${filename}` : "inline",
      "Content-Security-Policy": "sandbox allow-scripts; default-src 'none'; script-src https: 'unsafe-inline'; style-src https: 'unsafe-inline'; img-src https: data: blob:; font-src https: data:; connect-src https:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "no-store",
    },
  });
}
