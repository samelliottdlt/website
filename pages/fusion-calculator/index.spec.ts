import {
  createCardMap,
  findFusionPaths,
  createHandWithIds,
} from "./";
import json from "./card.json";

const cardMap = createCardMap(json);

test("should return the optimal fusion", () => {
  const hand = createHandWithIds([15, 236, 522], cardMap);
  const result = findFusionPaths(hand, json, cardMap);
  console.log(result);
});
