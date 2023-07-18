import {
  createCardMap,
  findFusionPaths,
  createHandWithIds,
} from "../app/fusion-calculator/util";
import json from "../app/fusion-calculator/card.json";

const cardMap = createCardMap(json);

test("should return the path to fusions", () => {
  const hand = createHandWithIds([15, 236, 522], cardMap);
  findFusionPaths(hand, json, cardMap);
});
