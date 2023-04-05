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
  return ids.map(id => findNewInstanceOfCardById(id, cardMap));
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

function calculator() {}

export default calculator;
