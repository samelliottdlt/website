"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Disclosure } from "@headlessui/react";
import { layout, prepare, type PreparedText } from "@chenglou/pretext";
import { categories } from "../lib/navigation";
import { classNames } from "../lib/util";

/**
 * Runtime-measured style facts for the mobile panel. All values come from a
 * single pass of getComputedStyle + getBoundingClientRect performed behind a
 * `visibility: hidden` probe — the *only* DOM read in this component. Every
 * subsequent open/close collapse uses pure pretext arithmetic.
 */
type StyleFacts = {
  headerFont: string;
  headerLineHeight: number;
  headerPaddingY: number;
  headerContentWidth: number;
  itemFont: string;
  itemLineHeight: number;
  itemPaddingY: number;
  itemContentWidth: number;
  categoryMarginTop: number;
  panelPaddingTop: number;
  panelPaddingBottom: number;
  itemGap: number;
};

type PreparedBundle = {
  preparedHeaders: PreparedText[];
  preparedItems: PreparedText[][];
};

function parsePx(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function fontFromStyles(styles: CSSStyleDeclaration): string {
  if (styles.font && styles.font.length > 0) return styles.font;
  return `${styles.fontStyle} ${styles.fontVariant} ${styles.fontWeight} ${styles.fontSize} / ${styles.lineHeight} ${styles.fontFamily}`;
}

type Props = {
  open: boolean;
  pathName: string | null;
};

export default function MobileNavPanel({ open, pathName }: Props) {
  const probeRef = useRef<HTMLDivElement | null>(null);
  const probeHeaderRef = useRef<HTMLParagraphElement | null>(null);
  const probeItemRef = useRef<HTMLAnchorElement | null>(null);
  const probeCategoryRef = useRef<HTMLDivElement | null>(null);

  const [facts, setFacts] = useState<StyleFacts | null>(null);

  const measure = useCallback(() => {
    const header = probeHeaderRef.current;
    const item = probeItemRef.current;
    const category = probeCategoryRef.current;
    const panel = probeRef.current;
    if (!header || !item || !category || !panel) return;

    const headerStyles = getComputedStyle(header);
    const itemStyles = getComputedStyle(item);
    const categoryStyles = getComputedStyle(category);
    const panelStyles = getComputedStyle(panel);

    const headerRect = header.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();

    // `space-y-1` on the panel inserts margin-top on every non-first child.
    // Each "category" div is such a child; the gap between category wrappers
    // is encoded in the category's own margin-top.
    const categoryMarginTop = parsePx(categoryStyles.marginTop);
    // The category body stacks a header <p> + N item <a>s with no explicit
    // gap class — so we assume siblings butt together (gap = 0) apart from
    // the category's own `pt-2` which is part of its padding below.
    setFacts({
      headerFont: fontFromStyles(headerStyles),
      headerLineHeight: parsePx(headerStyles.lineHeight),
      headerPaddingY:
        parsePx(headerStyles.paddingTop) + parsePx(headerStyles.paddingBottom),
      headerContentWidth:
        headerRect.width -
        parsePx(headerStyles.paddingLeft) -
        parsePx(headerStyles.paddingRight),
      itemFont: fontFromStyles(itemStyles),
      itemLineHeight: parsePx(itemStyles.lineHeight),
      itemPaddingY:
        parsePx(itemStyles.paddingTop) + parsePx(itemStyles.paddingBottom),
      itemContentWidth:
        itemRect.width -
        parsePx(itemStyles.paddingLeft) -
        parsePx(itemStyles.paddingRight),
      categoryMarginTop,
      panelPaddingTop: parsePx(panelStyles.paddingTop),
      panelPaddingBottom: parsePx(panelStyles.paddingBottom),
      // category `pt-2` between header row and first item row
      itemGap: parsePx(categoryStyles.paddingTop),
    });
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const probe = probeRef.current;
    if (!probe) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(probe);
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(() => measure()).catch(() => {});
    }
    return () => ro.disconnect();
  }, [measure]);

  // Prepare pretext handles whenever the measured font changes. `prepare()`
  // is the one-time expensive step; `layout()` below is the cheap hot path.
  const prepared = useMemo<PreparedBundle | null>(() => {
    if (!facts) return null;
    const preparedHeaders = categories.map((c) =>
      prepare(c.title, facts.headerFont),
    );
    const preparedItems = categories.map((c) =>
      c.items.map((it) => prepare(it.name, facts.itemFont)),
    );
    return { preparedHeaders, preparedItems };
  }, [facts]);

  // Pure arithmetic: derive the expanded panel height from cached handles.
  // Runs synchronously on every render without touching the DOM.
  const expandedHeight = useMemo(() => {
    if (!facts || !prepared) return 0;
    let total = facts.panelPaddingTop + facts.panelPaddingBottom;
    for (let i = 0; i < categories.length; i++) {
      if (i > 0) total += facts.categoryMarginTop;
      total += facts.itemGap; // category's own pt-2
      const headerMetrics = layout(
        prepared.preparedHeaders[i]!,
        facts.headerContentWidth,
        facts.headerLineHeight,
      );
      total += Math.ceil(headerMetrics.height) + facts.headerPaddingY;
      const items = categories[i]!.items;
      for (let j = 0; j < items.length; j++) {
        const itemMetrics = layout(
          prepared.preparedItems[i]![j]!,
          facts.itemContentWidth,
          facts.itemLineHeight,
        );
        total += Math.ceil(itemMetrics.height) + facts.itemPaddingY;
      }
    }
    return total;
  }, [facts, prepared]);

  const targetHeight = open ? expandedHeight : 0;
  // Until first measurement completes, fall back to `auto` so the menu is
  // usable even if JS is slow to initialize.
  const style: React.CSSProperties = facts
    ? {
        height: `${targetHeight}px`,
        overflow: "hidden",
        transitionProperty: "height",
        transitionDuration: "220ms",
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      }
    : { display: open ? "block" : "none" };

  return (
    <>
      {/* Off-screen probe used exactly once for style measurements. It mirrors
          the real panel's class structure so computed styles match. */}
      <div
        ref={probeRef}
        aria-hidden="true"
        className="sm:hidden space-y-1 px-2 pt-2 pb-3"
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          left: 0,
          right: 0,
          top: 0,
        }}
      >
        <div ref={probeCategoryRef} className="pt-2">
          <p
            ref={probeHeaderRef}
            className="px-3 py-2 text-sm font-medium text-gray-400"
          >
            Probe
          </p>
          <a
            ref={probeItemRef}
            href="#"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-300"
          >
            Probe
          </a>
        </div>
      </div>

      <Disclosure.Panel static as="div" style={style} className="sm:hidden">
        <div className="space-y-1 px-2 pt-2 pb-3">
          {categories.map((category) => (
            <div key={category.title} className="pt-2">
              <p className="px-3 py-2 text-sm font-medium text-gray-400">
                {category.title}
              </p>
              {category.items.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as="a"
                  href={item.href}
                  className={classNames(
                    pathName === item.href
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white",
                    "block px-3 py-2 rounded-md text-base font-medium",
                  )}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
          ))}
        </div>
      </Disclosure.Panel>
    </>
  );
}
