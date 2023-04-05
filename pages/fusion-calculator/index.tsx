import { useMemo } from "react";
import cards from "./card.json";
import { useState } from "react";
import Fuse from "fuse.js";

interface Fusion {
  _card1: number;
  _card2: number;
  _result: number;
}

interface Card {
  Name: string;
  Description: string;
  Id: number;
  GuardianStarA: number;
  GuardianStarB: number;
  Level: number;
  Type: number;
  Attack: number;
  Defense: number;
  Stars: number;
  CardCode: string;
  Equip: any;
  Fusions: Fusion[];
}

type Node = {
  value: Card;
  edges: Edges;
};
type NodeMap = Map<Card, Node>;
// fusion material to fusion destination
type Edges = Map<Card, Card>;

type CardsMappedById = Map<number, Card>;

type StackItem = {
  node: Node;
  path: Card[];
};

function findCardById(id: number, map: CardsMappedById): Card {
  return map.get(id)!;
}

export function findNewInstanceOfCardById(
  id: number,
  map: CardsMappedById
): Card {
  const card = map.get(id)!;
  return {
    ...card,
  };
}

export function createHandWithIds(ids: number[], cardMap: CardsMappedById) {
  return ids.map((id) => findNewInstanceOfCardById(id, cardMap));
}

export function createCardMap(cards: Card[]): CardsMappedById {
  const map = new Map<number, Card>();

  cards.forEach((card) => {
    map.set(card.Id, card);
  });

  return map;
}

export function createFusionGraph(cards: Card[], cardMap: CardsMappedById) {
  const graph = new Set<Node>();
  const nodeMap: NodeMap = new Map();

  cards.forEach((card) => {
    const edges: Edges = new Map();
    const node: Node = {
      value: findCardById(card.Id, cardMap),
      edges,
    };

    graph.add(node);
    nodeMap.set(card, node);
  });

  cards.forEach((c) => {
    const card = findCardById(c.Id, cardMap);
    card.Fusions.forEach((fusion) => {
      const currentNode = nodeMap.get(card)!;
      // edge from _card1 to destination
      const fusionMaterial = findCardById(fusion._card2, cardMap!);
      const destination = findCardById(fusion._result, cardMap!);
      currentNode.edges.set(fusionMaterial, destination);

      // edge from _card2 to destination
      const otherNode = nodeMap.get(fusionMaterial)!;
      otherNode.edges.set(findCardById(card.Id, cardMap), destination);
    });
  });

  return nodeMap;
}

export function findFusionPaths(
  // objects in hand are not instances of objects found in cardsData or cardMap
  hand: Card[],
  cardsData: Card[],
  // map of cards in cardsData by id for quick lookup
  cardMap: CardsMappedById
) {
  const nodeMap = createFusionGraph(cardsData, cardMap);
  // Array of arrays of paths
  // [CardA, CardB, Fusion of CardA and CardB, CardC, Fusion of CardA and CardB + CardC, ...]
  const result: Array<Card[]> = [];

  for (const handCard of hand) {
    const card = findCardById(handCard.Id, cardMap);
    const node = nodeMap.get(card)!;

    const stack: StackItem[] = [
      {
        node,
        path: [handCard],
      },
    ];

    while (stack.length > 0) {
      const { node: current, path } = stack.pop()!;
      result.push(path);
      const { edges } = current;
      const availableHand = [...hand]
        // remove cards already in path
        .filter((c) => !path.includes(c));
      for (const nextCardHand of availableHand) {
        const nextCard = findCardById(nextCardHand.Id, cardMap);
        if (edges.has(nextCard)) {
          const fusion = edges.get(nextCard)!;
          const nextNode = nodeMap.get(fusion)!;
          const nextPath = [...path, nextCardHand, nextNode.value];
          stack.push({
            node: nextNode,
            path: nextPath,
          });
        }
      }
    }
  }
  return result;
}

function Calculator() {
  // const graph = useMemo(() => {
  //   const cardMap = createCardMap(cards);
  //   createFusionGraph(cards, cardMap)
  // }, []);

  const [results, setResults] = useState<Card[]>([cards[0]]);
  const [hand, setHand] = useState<Card[]>([
    cards[0],
    cards[1],
    cards[2],
    cards[3],
    cards[4],
  ]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="m-5">
        <label
          htmlFor="email"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Search
        </label>
        <div className="mt-2">
          <input
            type="search"
            name="search"
            id="search"
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Celtic Guardian"
            onChange={(e) => {
              const search = e.target.value;
              const fuse = new Fuse(cards, {
                keys: ["Name"],
              });
              const results = fuse
                .search(search, { limit: 5 })
                .map((r) => r.item);
              setResults(results);
            }}
          />
        </div>
        <ul role="list" className="divide-y divide-gray-200">
          {results.length > 0 ? (
            results.map((result) => (
              <li
                key={result.Id}
                className="flex py-4 hover:bg-gray-200 transition-colors duration-200"
              >
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {result.Name}
                  </p>
                  <p className="text-sm text-gray-500">{result.Description}</p>
                </div>
              </li>
            ))
          ) : (
            <li className="flex py-4 items-center justify-center">
              <p className="text-sm text-gray-500">
                No results found. Please try a different search.
              </p>
            </li>
          )}
        </ul>
      </div>
      <div className="m-5">
        <div>
          <div className="mt-6 flow-root">
            <ul role="list" className="-my-5 divide-y divide-gray-200">
              {hand.map((card) => (
                <li key={card.Id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {card.Name}
                      </p>
                      <p className="truncate text-sm text-gray-500">
                        {card.Description}
                      </p>
                    </div>
                    <div>
                      <a className="cursor-pointer hover:bg-red-500 inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300">
                        Remove
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Calculator;
