import { fileSource } from "@/lib/storage";
import { GET as downloadFile } from "@/app/api/files/[key]/route";

export async function GET(request: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  const download = new URL(request.url).searchParams.get("download") === "1";
  const source = await fileSource(key, download);
  if (!source) return new Response("File missing or expired", { status: key.startsWith("b2_") ? 404 : 400 });

  // B2 serves large downloads directly; never stream a 1 GiB file through Vercel.
  if (key.startsWith("b2_")) return Response.redirect(source, 307);

  if (download) {
    // A missing or unreachable file gets the styled page, not bare text.
    const res = await downloadFile(request, context);
    return res.status === 404 || res.status === 502 ? Response.redirect(new URL(`/view/${encodeURIComponent(key)}`, request.url), 307) : res;
  }
  return Response.redirect(source, 307);
}
