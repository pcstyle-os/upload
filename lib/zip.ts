// Lists a zip archive from its central directory, using ranged reads only:
// the tail (end record), and the directory itself when it isn't in the tail.
// Nothing is decompressed.

export type ZipEntry = { name: string; size: number; dir: boolean };
export type ZipListing = { entries: ZipEntry[]; unpacked: number; truncated: boolean };

type Read = (start: number, end: number) => Promise<Uint8Array>;

const MAX_DIRECTORY = 1024 * 1024;
const MAX_ENTRIES = 1000;
const view = (b: Uint8Array) => new DataView(b.buffer, b.byteOffset, b.byteLength);

export async function listZip(size: number, read: Read): Promise<ZipListing | null> {
  if (size < 22) return null;
  // room for the longest comment plus the zip64 locator before the end record
  const tailStart = Math.max(0, size - 22 - 0xffff - 20);
  const tail = await read(tailStart, size - 1);
  const t = view(tail);

  // The end record is the last signature whose comment runs exactly to EOF,
  // so a comment that happens to contain the signature can't fool it.
  let end = -1;
  for (let i = tail.length - 22; i >= 0; i--) {
    if (t.getUint32(i, true) === 0x06054b50 && i + 22 + t.getUint16(i + 20, true) === tail.length) { end = i; break; }
  }
  if (end < 0) return null;
  let total = t.getUint16(end + 10, true);
  let dirSize = t.getUint32(end + 12, true);
  let dirOffset = t.getUint32(end + 16, true);

  if (total === 0xffff || dirSize === 0xffffffff || dirOffset === 0xffffffff) {
    const locator = end - 20;
    if (locator < 0 || t.getUint32(locator, true) !== 0x07064b50) return null;
    const at = Number(t.getBigUint64(locator + 8, true));
    const z = view(await read(at, at + 55));
    if (z.byteLength < 56 || z.getUint32(0, true) !== 0x06064b50) return null;
    total = Number(z.getBigUint64(32, true));
    dirSize = Number(z.getBigUint64(40, true));
    dirOffset = Number(z.getBigUint64(48, true));
  }

  const want = Math.min(dirSize, MAX_DIRECTORY);
  if (dirOffset + want > size) return null;
  const dir = dirOffset >= tailStart
    ? tail.subarray(dirOffset - tailStart, dirOffset - tailStart + want)
    : await read(dirOffset, dirOffset + want - 1);
  const d = view(dir);
  const decode = new TextDecoder();

  const entries: ZipEntry[] = [];
  let unpacked = 0, records = 0, listed = 0, p = 0;
  while (p + 46 <= dir.length && d.getUint32(p, true) === 0x02014b50) {
    const nameLength = d.getUint16(p + 28, true), extraLength = d.getUint16(p + 30, true), commentLength = d.getUint16(p + 32, true);
    if (p + 46 + nameLength > dir.length) break;
    const name = decode.decode(dir.subarray(p + 46, p + 46 + nameLength));
    let bytes = d.getUint32(p + 24, true);
    if (bytes === 0xffffffff) {
      // zip64: the real size is the first field of extra block 0x0001
      for (let e = p + 46 + nameLength, stop = Math.min(e + extraLength, dir.length); e + 4 <= stop;) {
        const id = d.getUint16(e, true), length = d.getUint16(e + 2, true);
        if (id === 1 && e + 12 <= stop) { bytes = Number(d.getBigUint64(e + 4, true)); break; }
        e += 4 + length;
      }
    }
    records++;
    p += 46 + nameLength + extraLength + commentLength;
    if (name.startsWith("__MACOSX/") || /(^|\/)\.DS_Store$/.test(name)) continue;
    const isDir = name.endsWith("/");
    if (!isDir) unpacked += bytes;
    if (++listed <= MAX_ENTRIES) entries.push({ name, size: bytes, dir: isDir });
  }
  return { entries, unpacked, truncated: records < total || listed > MAX_ENTRIES };
}
