import { describe, expect, test } from "@jest/globals";
import {
  booleanParam,
  buildQueryString,
  numberParam,
  stringParam,
  toQueryParamEntry,
  type QueryParamConfig,
} from "../hooks/useQueryParams";

function roundTrip<T extends string | number | boolean>(
  config: QueryParamConfig<T>,
  value: T,
): T {
  const query = buildQueryString(new URLSearchParams(), [
    toQueryParamEntry(config, value),
  ]);
  return config.deserialize(new URLSearchParams(query).get(config.key));
}

describe("stringParam", () => {
  const param = stringParam("text", "héllo ✅");

  test("uses the default only when the parameter is missing", () => {
    expect(param.deserialize(null)).toBe("héllo ✅");
    expect(param.deserialize("")).toBe("");
    expect(param.deserialize("abc")).toBe("abc");
  });

  test("round-trips empty and unicode values", () => {
    expect(roundTrip(param, "")).toBe("");
    expect(roundTrip(param, "a&b=c ✅")).toBe("a&b=c ✅");
    expect(roundTrip(param, "héllo ✅")).toBe("héllo ✅");
  });
});

describe("numberParam", () => {
  const param = numberParam("length", 32);

  test("parses zero, negatives, and decimals", () => {
    expect(param.deserialize("0")).toBe(0);
    expect(param.deserialize("-5")).toBe(-5);
    expect(param.deserialize("1.5")).toBe(1.5);
  });

  test("falls back to the default for missing or invalid values", () => {
    expect(param.deserialize(null)).toBe(32);
    expect(param.deserialize("")).toBe(32);
    expect(param.deserialize("  ")).toBe(32);
    expect(param.deserialize("abc")).toBe(32);
    expect(param.deserialize("Infinity")).toBe(32);
  });

  test("round-trips zero", () => {
    expect(roundTrip(param, 0)).toBe(0);
    expect(roundTrip(param, 1000000)).toBe(1000000);
  });
});

describe("booleanParam", () => {
  test("respects the default for missing or invalid values", () => {
    const param = booleanParam("flag", true);
    expect(param.deserialize(null)).toBe(true);
    expect(param.deserialize("nope")).toBe(true);
    expect(param.deserialize("false")).toBe(false);
    expect(roundTrip(param, false)).toBe(false);
  });
});

describe("buildQueryString", () => {
  const length = numberParam("length", 32);
  const allowOverLimit = booleanParam("allowOverLimit", false);

  test("omits defaults and preserves unrelated parameters", () => {
    const current = new URLSearchParams("length=10&other=x");
    expect(
      buildQueryString(current, [
        toQueryParamEntry(length, 32),
        toQueryParamEntry(allowOverLimit, true),
      ]),
    ).toBe("other=x&allowOverLimit=true");
  });

  test("is stable once the URL reflects the state", () => {
    const current = new URLSearchParams("length=0");
    expect(buildQueryString(current, [toQueryParamEntry(length, 0)])).toBe(
      current.toString(),
    );
  });

  test("keeps an explicitly empty string distinct from the default", () => {
    const text = stringParam("text", "héllo ✅");
    expect(
      buildQueryString(new URLSearchParams(), [toQueryParamEntry(text, "")]),
    ).toBe("text=");
  });
});
