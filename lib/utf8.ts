export function utf8ByteCount(str: string): number {
  return new TextEncoder().encode(str).length;
}

export function formatByteSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  }
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${kb.toFixed(kb >= 100 ? 0 : kb >= 10 ? 1 : 2)} KB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(mb >= 100 ? 0 : mb >= 10 ? 1 : 2)} MB`;
}

export function formatUtf8ByteSize(str: string): string {
  return formatByteSize(utf8ByteCount(str));
}
