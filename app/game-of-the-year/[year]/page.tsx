import data from "../goty.json";
import GameDisplay from "../GameDisplay";
import InfoTooltip from "../../../components/InfoTooltip";
import { notFound } from "next/navigation";

// Route segment config - cache this route statically
// See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
export const dynamic = "force-static"; // Force static generation
export const revalidate = false; // Never revalidate (cache indefinitely)

interface HonorableMention {
  title: string;
  description: string;
}

interface Entry {
  year: number;
  title: string;
  description: string;
  honorableMentions?: HonorableMention[];
}

interface GameData {
  background_image?: string;
  name?: string;
}

async function fetchGameImage(
  gameTitle: string,
  apiKey: string,
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(gameTitle)}&page_size=1`,
      {
        // Cache indefinitely - won't revalidate until next deployment
        // See: https://nextjs.org/docs/app/api-reference/functions/fetch#optionscache
        cache: "force-cache",
      },
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const game: GameData = data.results[0];
      return game.background_image || null;
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch image for ${gameTitle}:`, error);
    return null;
  }
}

interface PageProps {
  params: Promise<{
    year: string;
  }>;
}

export default async function GameOfTheYearPage({ params }: PageProps) {
  const gotyData: Entry[] = data as Entry[];
  const { year: yearString } = await params;
  const year = parseInt(yearString);

  // Find the game for this specific year
  const game = gotyData.find((g) => g.year === year);

  if (!game) {
    notFound();
  }

  const apiKey = process.env.RAWG_API_KEY;
  let imageUrl: string | null = null;

  if (apiKey) {
    // Fetch only the image for this specific game
    imageUrl = await fetchGameImage(game.title, apiKey);
  } else {
    console.warn("RAWG_API_KEY is not set; skipping image fetch.");
  }

  const gameWithImage = {
    ...game,
    imageUrl,
  };

  return (
    <div className="p-5 text-center">
      <h1 className="text-3xl mb-4 font-bold text-indigo-600 flex items-center justify-center gap-2">
        Game of the Year
        <InfoTooltip>
          <p className="text-left">
            This page bookmarks my Game of the Year picks and was really built
            to try implementing lazy loading of images from a remote API with
            prefetching. Images are fetched server-side with an aggressive cache
            so the API key remains secret and requests stay within rate limits.
            A placeholder container is displayed while each image loads.
          </p>
        </InfoTooltip>
      </h1>
      <GameDisplay game={gameWithImage} allGames={gotyData} />
    </div>
  );
}

// Generate static params for all available years
export async function generateStaticParams() {
  const gotyData: Entry[] = data as Entry[];

  return gotyData.map((game) => ({
    year: game.year.toString(),
  }));
}
