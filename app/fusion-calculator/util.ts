interface Fusion {
  _card1: number;
  _card2: number;
  _result: number;
}

export interface Card {
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
  Equip: unknown;
  Fusions: Fusion[];
  // will only exist on New Instances of Cards. Useful for cards
  idCounter?: number;
}

export type Node = {
  value: Card;
  edges: Edges;
};
export type NodeMap = Map<Card, Node>;
// fusion material to fusion destination
export type Edges = Map<Card, Card>;

export type CardsMappedById = Map<number, Card>;

function findPathsFromNode(
  node: Node,
  availableHand: Card[],
  nodeMap: NodeMap,
  cardMap: CardsMappedById,
  memo: Map<number, Card[][]>,
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
        memo,
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

function findCardById(id: number, map: CardsMappedById): Card {
  return map.get(id)!;
}

let idCounter = 0;
export function findNewInstanceOfCardById(
  id: number,
  map: CardsMappedById,
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
  nodeMap: NodeMap = createFusionGraph(cardsData, cardMap),
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
      memo,
    );
    for (const path of paths) {
      result.push([handCard, ...path]);
    }
  }

  return result;
}
