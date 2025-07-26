export function utf8ByteCount(str: string): number {
  return new TextEncoder().encode(str).length;
}

export function formatByteSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  }
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${kb.toFixed(getDecimalPlaces(kb))} KB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(getDecimalPlaces(mb))} MB`;
}

function getDecimalPlaces(value: number): number {
  return value >= 100 ? 0 : value >= 10 ? 1 : 2;
}
export function formatUtf8ByteSize(str: string): string {
  return formatByteSize(utf8ByteCount(str));
}
