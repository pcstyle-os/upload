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
  if (/\.html?$/i.test(name) || type.split(";")[0] === "text/html") return "html";
  if (type.startsWith("image/")) return "image";
  return "other";
}
