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

export type PreviewKind = "html" | "image" | "video" | "audio" | "pdf" | "text" | "other";

export function previewKind(name: string, type: string): PreviewKind {
  type = type.split(";")[0].trim().toLowerCase();
  if (/\.html?$/i.test(name) || type === "text/html") return "html";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type === "application/pdf") return "pdf";
  if (type.startsWith("text/") || /^application\/(json|xml|javascript|x-yaml|yaml|toml|x-sh)$/.test(type)) return "text";
  if (!type || type === "application/octet-stream") {
    if (/\.(png|jpe?g|gif|webp|avif|svg|bmp|ico)$/i.test(name)) return "image";
    if (/\.(mp4|webm|ogv|mov)$/i.test(name)) return "video";
    if (/\.(mp3|wav|ogg|m4a|aac|flac|opus)$/i.test(name)) return "audio";
    if (/\.pdf$/i.test(name)) return "pdf";
    if (/\.(txt|md|json|csv|tsv|log|ya?ml|toml|ini|xml|js|mjs|ts|tsx|jsx|css|py|rb|go|rs|sh|sql|env)$/i.test(name)) return "text";
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

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " b";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " kb";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " mb";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " gb";
}

// The uploaded name from a Content-Disposition header, preferring filename*.
export function dispositionName(header: string | null): string {
  if (!header) return "";
  const star = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (star) try { return decodeURIComponent(star[1].trim()); } catch {}
  return /filename="([^"]*)"/i.exec(header)?.[1] || "";
}
