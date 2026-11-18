const VIDEO_ID_PATTERN = /^[\w-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

/** Extracts the video ID from common YouTube URL formats. */
export function getYoutubeVideoId(url: string | undefined): string | null {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  let id: string | null = null;
  if (parsed.hostname === "youtu.be") {
    id = parsed.pathname.split("/")[1] ?? null;
  } else if (YOUTUBE_HOSTS.has(parsed.hostname)) {
    const [, kind, pathId] = parsed.pathname.split("/");
    id =
      kind === "embed" || kind === "shorts" || kind === "live"
        ? (pathId ?? null)
        : parsed.searchParams.get("v");
  }

  return id && VIDEO_ID_PATTERN.test(id) ? id : null;
}

function YoutubeEmbed({
  url,
  title = "YouTube video player",
}: {
  url?: string;
  title?: string;
}) {
  const videoId = getYoutubeVideoId(url);
  if (!videoId) return null;

  return (
    // The 56.25% top padding ((9 / 16) * 100) keeps a 16:9 aspect ratio while
    // the iframe is absolutely positioned to fill the wrapper.
    <div className="relative overflow-hidden" style={{ paddingTop: "56.25%" }}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full border-0"
      ></iframe>
    </div>
  );
}

export default YoutubeEmbed;
