import { fileUrl } from "@/lib/files";
import { GET as downloadFile } from "@/app/api/files/[key]/route";

export async function GET(request: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  const source = fileUrl(key);
  if (!source) return new Response("Invalid file", { status: 400 });

  if (new URL(request.url).searchParams.get("download") === "1") {
    // A missing or unreachable file gets the styled page, not bare text.
    const res = await downloadFile(request, context);
    return res.status === 404 || res.status === 502 ? Response.redirect(new URL(`/view/${encodeURIComponent(key)}`, request.url), 307) : res;
  }
  return Response.redirect(source, 307);
}
