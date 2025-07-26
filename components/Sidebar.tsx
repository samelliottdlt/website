"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { categories, getItemEmoji, getCategoryEmoji } from "../lib/navigation";
import { classNames } from "../lib/util";

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <nav
      className={classNames(
        "bg-gray-100 p-4 space-y-4 overflow-y-auto h-screen box-border relative transition-all duration-300 flex-shrink-0",
        isCollapsed ? "w-16" : "w-56",
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleCollapse}
        className={classNames(
          "absolute top-4 p-1 rounded hover:bg-gray-200 z-10",
          isCollapsed ? "left-1/2 transform -translate-x-1/2" : "right-2",
        )}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRightIcon className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
        )}
      </button>

      {!isCollapsed && (
        <>
          <div className="pb-4 border-b border-gray-200 pr-8">
            <Link
              href="/"
              className={classNames(
                pathname === "/"
                  ? "text-indigo-600 font-medium"
                  : "text-gray-600 hover:text-indigo-600",
                "block px-2 py-1 text-sm rounded",
              )}
            >
              Home
            </Link>
          </div>

          {categories.map((category) => (
            <div key={category.title}>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                {category.title}
              </h3>
              <ul className="space-y-1">
                {category.items.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={classNames(
                        pathname === item.href
                          ? "text-indigo-600 font-medium"
                          : "text-gray-600 hover:text-indigo-600",
                        "block px-2 py-1 text-sm rounded",
                      )}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}

      {/* Collapsed state - show only emojis */}
      {isCollapsed && (
        <div className="space-y-2 pt-12">
          <Link
            href="/"
            className={classNames(
              pathname === "/"
                ? "text-indigo-600 font-medium"
                : "text-gray-600 hover:text-indigo-600",
              "block px-2 py-1 text-xs text-center rounded",
            )}
            title="Home"
          >
            🏠
          </Link>
          {categories.map((category) => (
            <div key={category.title} className="space-y-1">
              <div className="text-xs font-semibold text-gray-700 text-center px-1 py-1" title={category.title}>
                {getCategoryEmoji(category)}
              </div>
              {category.items.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={classNames(
                    pathname === item.href
                      ? "text-indigo-600 font-medium"
                      : "text-gray-600 hover:text-indigo-600",
                    "block px-1 py-1 text-xs text-center rounded",
                  )}
                  title={item.name}
                >
                  {getItemEmoji(item)}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </nav>
  );
}
