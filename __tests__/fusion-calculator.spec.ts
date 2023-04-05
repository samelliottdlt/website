import {
  createCardMap,
  findFusionPaths,
  createHandWithIds,
} from "../pages/fusion-calculator";
import json from "../pages/fusion-calculator/card.json";

const cardMap = createCardMap(json);

test("should return the path to fusions", () => {
  const hand = createHandWithIds([15, 236, 522], cardMap);
  const result = findFusionPaths(hand, json, cardMap);
  console.log(result);
});
