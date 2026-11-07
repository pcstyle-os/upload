import { fileUrl } from "@/lib/files";
import { GET as downloadFile } from "@/app/api/files/[key]/route";

export async function GET(request: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  const source = fileUrl(key);
  if (!source) return new Response("Invalid file", { status: 400 });

  if (new URL(request.url).searchParams.get("download") === "1") {
    return downloadFile(request, context);
  }
  return Response.redirect(source, 307);
}
