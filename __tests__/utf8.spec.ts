import { utf8ByteCount, formatByteSize } from "../lib/utf8";

describe("utf8 utilities", () => {
  test("counts bytes correctly", () => {
    expect(utf8ByteCount("a")).toBe(1);
    expect(utf8ByteCount("é")).toBe(2);
    expect(utf8ByteCount("😀")).toBe(4);
  });

  test("formats bytes", () => {
    expect(formatByteSize(10)).toBe("10 bytes");
    expect(formatByteSize(2048)).toBe("2.00 KB");
    expect(formatByteSize(1048576)).toBe("1.00 MB");
  });
});
