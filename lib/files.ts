// Public origins for this uploader and its UploadThing app.
export const SITE_ORIGIN = "https://upload.pcstyle.dev";
export const FILE_ORIGIN = "https://8jtw7yklci.ufs.sh";

export function fileUrl(key: string): string | null {
  if (!/^[a-zA-Z0-9_-][a-zA-Z0-9_.-]{0,255}$/.test(key)) return null;
  return `${FILE_ORIGIN}/f/${key}`;
}

export function previewUrl(file: { key: string; name: string }): string {
  const url = new URL(`/view/${encodeURIComponent(file.key)}`, SITE_ORIGIN);
  url.searchParams.set("name", file.name);
  return url.href;
}

export function previewKind(name: string, type: string) {
  type = type.split(";")[0].trim().toLowerCase();
  if (/\.html?$/i.test(name) || type === "text/html") return "html";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type === "application/pdf") return "pdf";
  if (!type || type === "application/octet-stream") {
    if (/\.(png|jpe?g|gif|webp|avif|svg|bmp|ico)$/i.test(name)) return "image";
    if (/\.(mp4|webm|ogv|mov)$/i.test(name)) return "video";
    if (/\.(mp3|wav|ogg|m4a|aac|flac|opus)$/i.test(name)) return "audio";
    if (/\.pdf$/i.test(name)) return "pdf";
  }
  return "other";
}

export function directUrl(file: { key: string; name: string }, download = false): string {
  const url = new URL(`/f/${encodeURIComponent(file.key)}`, SITE_ORIGIN);
  if (download) {
    url.searchParams.set("download", "1");
    url.searchParams.set("name", file.name);
  }
  return url.href;
}
