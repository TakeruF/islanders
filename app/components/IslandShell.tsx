"use client";

import { useState, ReactNode } from "react";

/**
 * Reusable visual shell mimicking the ColorOS 流体云 island.
 * Tap toggles between capsule (status bar) and expanded (long-press) layouts.
 */
export function IslandShell({
  capsule,
  expanded,
  accent = "#7cffb5",
}: {
  capsule: ReactNode;
  expanded: ReactNode;
  accent?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="capsule-shell mx-auto flex h-9 max-w-[260px] items-center gap-2 rounded-capsule px-4 text-xs font-medium"
        style={{ color: accent }}
      >
        {capsule}
      </button>

      <div
        className={`island-shell overflow-hidden rounded-island transition-[max-height,opacity] ${
          open ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-4">{expanded}</div>
      </div>
    </div>
  );
}
