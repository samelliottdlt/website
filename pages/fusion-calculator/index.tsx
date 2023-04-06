import { useMemo, Fragment, useEffect } from "react";
import { useState } from "react";
import Fuse from "fuse.js";
import { Transition } from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/20/solid";
import cards from "./card.json";
import Alert from "../../components/Alert";

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
  // will only exist on New Instances of Cards. Useful for cards
  idCounter?: number;
}

type Node = {
  value: Card;
  edges: Edges;
};
type NodeMap = Map<Card, Node>;
// fusion material to fusion destination
type Edges = Map<Card, Card>;

type CardsMappedById = Map<number, Card>;

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

function findCardById(id: number, map: CardsMappedById): Card {
  return map.get(id)!;
}

let idCounter = 0;
export function findNewInstanceOfCardById(
  id: number,
  map: CardsMappedById
): Card {
  const card = map.get(id)!;
  return {
    ...card,
    idCounter: idCounter++,
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
  hand: Card[],
  cardsData: Card[],
  cardMap: CardsMappedById,
  nodeMap: NodeMap = createFusionGraph(cardsData, cardMap)
) {
  const result: Array<Card[]> = [];
  const memo: Map<number, Card[][]> = new Map();

  for (const handCard of hand) {
    const card = findCardById(handCard.Id, cardMap);
    const node = nodeMap.get(card)!;
    const paths = findPathsFromNode(
      node,
      hand.filter((c) => c !== handCard),
      nodeMap,
      cardMap,
      memo
    );
    for (const path of paths) {
      result.push([handCard, ...path]);
    }
  }

  return result;
}

let pathCounter = 0
function formatPath(path: Card[]) {
  const colors = ['bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'];

  const getColor = (index: number) => {
    return colors[index % colors.length];
  };

  const result: JSX.Element[] = [
    <span key={pathCounter++}>
      <span className="inline-flex items-center space-x-2 ml-2 mr-4">
        <span className="text-indigo-500">Attack:</span>
        <span className="font-bold text-indigo-800">{path[path.length - 1].Attack}</span>
      </span>
      <span className="inline-flex items-center space-x-2 mr-4">
        <span className="text-green-500">Defense:</span>
        <span className="font-bold text-green-800">{path[path.length - 1].Defense}</span>
      </span>
      {path[0].Name}
      <span
        className={`inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white rounded-full ${getColor(0)} ml-1`}
        style={{ verticalAlign: 'super', lineHeight: 1 }}>
        1
      </span>
    </span>,
  ];
  let cardCount = 2;
  for (let i = 1; i < path.length; i++) {
    if (i % 2 === 0) {
      result.push(
        <span key={pathCounter++}>
          {`-> ${path[i].Name}`}
        </span>
      );
    } else {
      result.push(
        <span key={pathCounter++}>
          {`+ ${path[i].Name}`}
          <span
            className={`inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white rounded-full ${getColor(i)} ml-1`}
            style={{ verticalAlign: 'super', lineHeight: 1 }}>
            {cardCount++}
          </span>
        </span>
      );
    }
  }
  return result;
}

function findPathsFromNode(
  node: Node,
  availableHand: Card[],
  nodeMap: NodeMap,
  cardMap: CardsMappedById,
  memo: Map<number, Card[][]>
): Card[][] {
  if (memo.has(node.value.Id)) {
    return memo.get(node.value.Id)!;
  }

  const result: Card[][] = [];
  const { edges } = node;

  for (const nextCardHand of availableHand) {
    const nextCard = findCardById(nextCardHand.Id, cardMap);
    if (edges.has(nextCard)) {
      const fusion = edges.get(nextCard)!;
      const nextNode = nodeMap.get(fusion)!;
      const nextAvailableHand = availableHand.filter((c) => c !== nextCardHand);
      const paths = findPathsFromNode(
        nextNode,
        nextAvailableHand,
        nodeMap,
        cardMap,
        memo
      );

      for (const path of paths) {
        result.push([nextCardHand, fusion, ...path]);
      }
    }
  }

  if (result.length === 0) {
    result.push([]);
  }

  memo.set(node.value.Id, result);
  return result;
}

function Calculator() {
  const cardMap = useMemo(() => {
    return createCardMap(cards);
  }, []);
  const graph = useMemo(() => {
    return createFusionGraph(cards, cardMap);
  }, [cardMap]);
  const [hand, setHand] = useState<Card[]>(
    createHandWithIds([1, 2, 3, 4, 5], cardMap)
  );
  const paths = useMemo(() => {
    return findFusionPaths(hand, cards, cardMap, graph)
      .map((path) => {
        return path.map((card) => {
          return findNewInstanceOfCardById(card.Id, cardMap)
        });
      })
      .sort((a, b) => {
        return b[b.length - 1].Attack - a[a.length - 1].Attack;
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hand]);
  const [results, setResults] = useState<Card[]>([
    cards[0],
    cards[1],
    cards[2],
    cards[3],
  ]);
  const [removingCards, setRemovingCards] = useState<Card[]>([]);
  const [showAlert, setShowAlert] = useState<boolean>(false);

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="m-5">
          <div className="grid grid-cols-2 gap-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Search
            </label>
            <button
              type="button"
              className="rounded bg-indigo-600 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              onClick={() => {
                setHand([]);
              }}
            >
              Clear hand
            </button>
          </div>
          <div className="mt-2">
            <input
              type="search"
              name="search"
              id="search"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 p-2"
              placeholder="Celtic Guardian"
              onChange={(e) => {
                const search = e.target.value;
                const fuse = new Fuse(cards, {
                  keys: ["Name"],
                });
                const results = fuse
                  .search(search, { limit: 4 })
                  .map((r) => r.item);
                setResults(results);
              }}
            />
          </div>
          <ul role="list" className="divide-y divide-gray-200">
            {results.length > 0 ? (
              results.map((result) => (
                <li
                  // key can be Id here because Results will always be unique
                  key={result.Id}
                  className="select-none cursor-pointer flex py-4 hover:bg-gray-200 transition-colors duration-200"
                  onClick={() => {
                    if (hand.length > 4) {
                      setShowAlert(true);
                      setTimeout(() => {
                        setShowAlert(false);
                      }, 3000);
                      return;
                    }
                    const card = findNewInstanceOfCardById(result.Id, cardMap);
                    setHand((hand) => [...hand, card]);
                  }}
                >
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {result.Name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {result.Description}
                    </p>
                  </div>
                </li>
              ))
            ) : (
              <li className="flex py-4 items-center justify-center">
                <p className="text-sm text-gray-500">No results found.</p>
              </li>
            )}
          </ul>
          <Alert
            showAlert={showAlert}
            message={{
              title: "Hand size full",
              items: [
                "You can only have 5 cards in your hand. Remove a card to add another.",
              ],
            }}
          />
        </div>
        <div className="m-5">
          <div>
            <div className="mt-6 flow-root">
              <ul
                role="list"
                className="-my-5 divide-y divide-gray-200 transition-height duration-500"
              >
                {hand.length > 0 ? (
                  hand.map((card) => (
                    <Transition
                      // use idCounter because the same card can appear multiple times in hand
                      key={card.idCounter}
                      as={Fragment}
                      show={!removingCards.includes(card)}
                      leave="transform transition-all duration-250 ease-in-out"
                      leaveFrom="translate-x-0 opacity-100"
                      leaveTo="translate-x-full opacity-0"
                    >
                      <li className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {card.Name}
                            </p>
                            <div className="space-y-2">
                            {card.Fusions
                              .filter((_i, index) => index < 4)
                              .map(fusion => findNewInstanceOfCardById(fusion._card2, cardMap))
                              .map((otherMaterial) => (
                                <button
                                  disabled={hand.length > 4}
                                  key={otherMaterial.idCounter}
                                  onClick={() => {
                                      setHand((prevHand) => [
                                        ...prevHand,
                                        otherMaterial,
                                      ]);
                                  }}
                                  className="truncate text-sm text-gray-500 hover:bg-blue-200 px-2 py-1 rounded"
                                >
                                  {otherMaterial.Name}
                                </button>
                              ))}
                              </div>
                          </div>
                          <div>
                            <a
                              onClick={() => {
                                setRemovingCards((prev) => [...prev, card]);
                                setTimeout(() => {
                                  setHand((hand) =>
                                    hand.filter(
                                      (cardToRemove) => card !== cardToRemove
                                    )
                                  );
                                  setRemovingCards((prev) =>
                                    prev.filter(
                                      (cardToRemove) => card !== cardToRemove
                                    )
                                  );
                                }, 250);
                              }}
                              className="cursor-pointer hover:bg-red-500 inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300"
                            >
                              Remove
                            </a>
                          </div>
                        </div>
                      </li>
                    </Transition>
                  ))
                ) : (
                  <li className="flex py-4 items-center justify-center">
                    <p className="text-sm text-gray-500">
                      Your hand is empty. Add cards to your hand.
                    </p>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <ul role="list" className="space-y-3">
      {paths.map((path) => (
        <li key={pathCounter++} className="overflow-hidden rounded-md bg-white px-6 py-4 shadow">
          <span className="text-sm font-medium text-gray-900">
            {formatPath(path)}
            {path[path.length - 1].Fusions
              .filter((_i, index) => index < 4)
              .map(fusion => findNewInstanceOfCardById(fusion._card2, cardMap))
              .map((otherMaterial) => (
                <button
                  disabled={hand.length > 4}
                  key={otherMaterial.idCounter}
                  onClick={() => {
                      setHand((prevHand) => [
                        ...prevHand,
                        otherMaterial,
                      ]);
                  }}
                  className="m-1 truncate text-sm text-gray-500 hover:bg-blue-200 px-2 py-1 rounded"
                >
                  {otherMaterial.Name}
                </button>
              ))}
          </span>
        </li>
      ))}
    </ul>
    </>
  );
}

export default Calculator;
