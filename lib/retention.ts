export const MAX_FILE_SIZE = 1024 ** 3;
export const MAX_BATCH_FILES = 100;

export function retentionDays(size: number): 7 | 30 | 90 {
  return size <= 10 * 1024 ** 2 ? 90 : size <= 100 * 1024 ** 2 ? 30 : 7;
}

export function b2File(key: string, now = Date.now()) {
  const match = /^b2_(7|30|90)_(\d{13})_([a-f0-9]{32})$/.exec(key);
  if (!match) return null;
  const expiresAt = Number(match[2]);
  return { path: `uploads/${match[1]}d/${key}`, expiresAt, expired: expiresAt <= now };
}
