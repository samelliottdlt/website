function YoutubeEmbed({ url }: { url?: string }) {
  const videoId = url?.split('v=')[1];
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    // Wrapper Div: The div around the iframe is given relative and overflow-hidden classes.
    // The paddingTop style is set to 56.25% to maintain a 16:9 aspect ratio.
    // This percentage is calculated as (9 / 16) * 100.
    <div className="relative overflow-hidden" style={{ paddingTop: '56.25%' }}>
      {/* Iframe: The iframe is absolutely positioned to cover the entire div using the classes
          absolute top-0 left-0 w-full h-full. */}
      <iframe
        src={embedUrl}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full"
      ></iframe>
    </div>
  );
};

export default YoutubeEmbed;
