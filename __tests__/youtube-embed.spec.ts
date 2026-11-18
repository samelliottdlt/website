import { describe, expect, test } from "@jest/globals";
import { getYoutubeVideoId } from "../components/YoutubeEmbed";

describe("getYoutubeVideoId", () => {
  test.each([
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s",
    "https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ",
    "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ?si=abc&t=10",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "https://www.youtube.com/shorts/dQw4w9WgXcQ",
  ])("parses %s", (url) => {
    expect(getYoutubeVideoId(url)).toBe("dQw4w9WgXcQ");
  });

  test.each([
    undefined,
    "",
    "not a url",
    "https://example.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch",
    "https://www.youtube.com/watch?v=short",
    "https://youtu.be/dQw4w9WgXcQ/../../evil",
  ])("rejects %s", (url) => {
    expect(getYoutubeVideoId(url)).toBeNull();
  });
});
