import { Game } from "./games";

const GameCard: React.FC<{ game: Game }> = ({ game }) => (
  <li
    key={game.id}
    className="overflow-hidden rounded-xl border border-gray-200"
  >
    <div className="flex items-center gap-x-4 border-b border-gray-900/5 bg-gray-50 p-6">
      <div className="text-sm font-medium leading-6 text-gray-900">
        {game.title}
      </div>
    </div>
    <dl className="-my-3 divide-y divide-gray-100 px-6 py-4 text-sm leading-6">
      <div className="flex justify-between gap-x-4 py-3">
        <dt className="text-gray-500">Platform</dt>
        <dd className="text-gray-700">{game.platform}</dd>
      </div>
    </dl>
  </li>
);

export default GameCard;
