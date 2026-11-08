import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client, S3ServiceException } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { dispositionName, fileUrl } from "./files";
import { b2File, MAX_FILE_SIZE, retentionDays } from "./retention";

export type StoredFile = { key: string; name: string; size: number; type: string; expiresAt: string };

function storage() {
  const { B2_ENDPOINT, B2_REGION, B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET } = process.env;
  if (!B2_ENDPOINT || !B2_REGION || !B2_KEY_ID || !B2_APPLICATION_KEY || !B2_BUCKET) {
    throw new Error("Backblaze storage is not configured");
  }
  return {
    bucket: B2_BUCKET,
    client: new S3Client({
      endpoint: B2_ENDPOINT.startsWith("https://") ? B2_ENDPOINT : `https://${B2_ENDPOINT}`,
      region: B2_REGION,
      credentials: { accessKeyId: B2_KEY_ID, secretAccessKey: B2_APPLICATION_KEY },
      forcePathStyle: true,
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    }),
  };
}

export async function prepareUpload(input: { name: string; size: number; type: string }) {
  const days = retentionDays(input.size);
  const expiresAt = Date.now() + days * 86400_000;
  const key = `b2_${days}_${expiresAt}_${randomUUID().replaceAll("-", "")}`;
  const { client, bucket } = storage();
  const name = encodeURIComponent(input.name).replace(/['()*]/g, c => `%${c.charCodeAt(0).toString(16)}`);
  const type = input.type || "application/octet-stream";
  const command = new PutObjectCommand({
    Bucket: bucket, Key: b2File(key)!.path,
    ContentLength: input.size, ContentType: type,
    ContentDisposition: `inline; filename*=UTF-8''${name}`,
    CacheControl: "private, no-store",
  });
  const url = await getSignedUrl(client, command, {
    expiresIn: 900,
    signableHeaders: new Set(["content-type", "content-length", "content-disposition", "cache-control"]),
  });
  return { key, url, expiresAt: new Date(expiresAt).toISOString(), days, headers: {
    "Content-Type": type, "Content-Disposition": command.input.ContentDisposition!, "Cache-Control": "private, no-store",
  } };
}

export async function uploadedFile(key: string) {
  const file = b2File(key);
  if (!file || file.expired) return null;
  const { client, bucket } = storage();
  let head;
  try {
    head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: file.path }));
  } catch (error) {
    if (error instanceof S3ServiceException && error.$metadata.httpStatusCode === 404) return null;
    throw error;
  }
  const size = head.ContentLength ?? 0;
  // Completion only accepts real objects in the correct size-based retention folder.
  if (head.Metadata?.collection || size > MAX_FILE_SIZE || !file.path.startsWith(`uploads/${retentionDays(size)}d/`)) return null;
  return { key, name: dispositionName(head.ContentDisposition ?? null) || key,
    size, type: head.ContentType || "application/octet-stream", expiresAt: new Date(file.expiresAt).toISOString() };
}

export async function writeCollection(files: StoredFile[]) {
  const expiresAt = Math.max(...files.map(file => Date.parse(file.expiresAt)));
  const key = `b2_90_${expiresAt}_${randomUUID().replaceAll("-", "")}`;
  const { client, bucket } = storage();
  await client.send(new PutObjectCommand({
    Bucket: bucket, Key: b2File(key)!.path, Body: JSON.stringify({ files }),
    ContentType: "application/json", CacheControl: "private, no-store", Metadata: { collection: "1" },
  }));
  return { key, expiresAt: new Date(expiresAt).toISOString() };
}

export async function readCollection(key: string): Promise<{ files: StoredFile[]; expiresAt: number; loadedAt: number } | null> {
  const file = b2File(key);
  if (!file || file.expired) return null;
  const { client, bucket } = storage();
  try {
    const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: file.path }));
    // Ordinary uploads cannot masquerade as manifests or make us parse a huge file.
    if (object.Metadata?.collection !== "1" || (object.ContentLength ?? 0) > 256 * 1024) {
      await object.Body?.transformToWebStream().cancel();
      return null;
    }
    const manifest = JSON.parse(await object.Body!.transformToString()) as { files: StoredFile[] };
    return { files: manifest.files, expiresAt: file.expiresAt, loadedAt: Date.now() };
  } catch (error) {
    if (error instanceof S3ServiceException && error.$metadata.httpStatusCode === 404) return null;
    throw error;
  }
}

export async function fileSource(key: string, download = false): Promise<string | null> {
  if (!key.startsWith("b2_")) return fileUrl(key);
  const file = b2File(key);
  if (!file || file.expiresAt - Date.now() < 1000) return null;
  const { client, bucket } = storage();
  const uploaded = download ? await uploadedFile(key) : null;
  if (download && !uploaded) return null;
  return getSignedUrl(client, new GetObjectCommand({
    Bucket: bucket, Key: file.path,
    ...(uploaded ? { ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(uploaded.name).replace(/['()*]/g, c => `%${c.charCodeAt(0).toString(16)}`)}` } : {}),
  }), { expiresIn: Math.min(3600, Math.floor((file.expiresAt - Date.now()) / 1000)) });
}
