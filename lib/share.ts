import { previewUrl } from "./files";

export async function createShareLink(file: { key: string; name: string }) {
  const url = previewUrl(file);

  try {
    const response = await fetch("https://small-horse-338.convex.cloud/api/mutation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "links:createLink",
        args: { url },
        format: "json",
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Shortener request failed");
    const result = await response.json();
    const shortUrl = result?.value?.shortUrl;
    if (result.status !== "success" || typeof shortUrl !== "string" ||
        !/^https:\/\/s\.pcstyle\.dev\/[a-zA-Z0-9_-]+$/.test(shortUrl)) {
      throw new Error("Invalid shortener response");
    }
    return { shareUrl: shortUrl, previewUrl: url, shortened: true };
  } catch {
    // The file is already uploaded. Never turn a shortener outage into a failed upload.
    console.warn("Short link unavailable; returning the preview URL");
    return { shareUrl: url, previewUrl: url, shortened: false };
  }
}
