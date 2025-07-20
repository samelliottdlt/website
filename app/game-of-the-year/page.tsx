import { redirect } from "next/navigation";
import data from "./goty.json";

interface Entry {
  year: number;
  title: string;
}

export default function GameOfTheYear() {
  const gotyData: Entry[] = data as Entry[];
  
  // Redirect to the first (most recent) year
  const firstYear = gotyData[0].year;
  redirect(`/game-of-the-year/${firstYear}`);
}
