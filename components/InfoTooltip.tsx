"use client";

import { useState } from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

interface InfoTooltipProps {
  children: React.ReactNode;
}

export default function InfoTooltip({ children }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Information"
        className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-400 bg-white text-gray-600"
      >
        <InformationCircleIcon className="w-6 h-6" />
      </button>
      {open && (
        <div className="absolute z-10 left-1/2 -translate-x-1/2 mt-2 w-72 rounded bg-gray-800 p-3 text-sm text-white shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}
