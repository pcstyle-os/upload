import { collectionUrl } from "@/lib/files";
import { b2File, MAX_BATCH_FILES, MAX_FILE_SIZE } from "@/lib/retention";
import { createShareLink } from "@/lib/share";
import { prepareUpload, uploadedFile, writeCollection } from "@/lib/storage";

export async function POST(request: Request) {
  // Vercel and the local preview proxy forward the public host over an internal URL.
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || new URL(request.url).host;
  const origin = request.headers.get("origin");
  if (!origin || !["https://", "http://"].some(protocol => origin === `${protocol}${host}`)) {
    return Response.json({ error: "Invalid upload origin" }, { status: 403 });
  }
  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid upload request" }, { status: 400 });
  }
  if (!body || typeof body !== "object") return Response.json({ error: "Invalid upload request" }, { status: 400 });
  try {
    if (body.action === "prepare") {
      const { name, size, type } = body;
      if (typeof name !== "string" || !name.trim() || name.length > 255 ||
          typeof size !== "number" || !Number.isSafeInteger(size) || size < 0 || size > MAX_FILE_SIZE ||
          typeof type !== "string" || type.length > 255 || /[\r\n]/.test(type)) {
        return Response.json({ error: "Invalid file; maximum size is 1 GiB" }, { status: 400 });
      }
      return Response.json(await prepareUpload({ name, size, type }));
    }
    if (body.action === "complete") {
      const keys = body.keys ?? (typeof body.key === "string" ? [body.key] : null);
      if (!Array.isArray(keys) || !keys.length || keys.length > MAX_BATCH_FILES ||
          keys.some(key => typeof key !== "string" || !b2File(key)) || new Set(keys).size !== keys.length) {
        return Response.json({ error: "Choose between 1 and 100 distinct uploaded files" }, { status: 400 });
      }
      const checked = await Promise.all(keys.map(key => uploadedFile(key)));
      if (checked.some(file => !file)) return Response.json({ error: "File missing, expired or invalid" }, { status: 404 });
      const files = checked.filter(file => file !== null);
      if (files.length === 1) return Response.json({ ...files[0], ...await createShareLink(files[0]) });
      const collection = await writeCollection(files);
      const name = `${files.length} files`;
      return Response.json({ ...collection, name, count: files.length, type: "collection",
        size: files.reduce((total, file) => total + file.size, 0),
        ...await createShareLink({ key: collection.key, name }, collectionUrl(collection.key)) });
    }
    return Response.json({ error: "Invalid upload action" }, { status: 400 });
  } catch {
    return Response.json({ error: "Storage unavailable. Please try again." }, { status: 502 });
  }
}
