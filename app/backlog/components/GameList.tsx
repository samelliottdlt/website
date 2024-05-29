import GameCard from "./GameCard";
import { Game } from "./games";

const GameList: React.FC<{ games: Game[]; title?: string }> = ({
  games,
  title = "",
}) => (
  <div className="col-span-1 lg:col-span-1">
    <h2 className="text-2xl font-semibold mb-4">{title}</h2>
    <ul role="list" className="space-y-4">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </ul>
  </div>
);

export default GameList;
