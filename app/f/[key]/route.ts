import { fileUrl } from "@/lib/files";
import { GET as downloadFile } from "@/app/api/files/[key]/route";

export async function GET(request: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  const source = fileUrl(key);
  if (!source) return new Response("Invalid file", { status: 400 });

  if (new URL(request.url).searchParams.get("download") === "1") {
    // A missing file gets the styled not-found page, not a bare 404.
    const res = await downloadFile(request, context);
    return res.status === 404 ? Response.redirect(new URL(`/view/${encodeURIComponent(key)}`, request.url), 307) : res;
  }
  return Response.redirect(source, 307);
}
