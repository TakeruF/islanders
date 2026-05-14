"use client";

import { useState } from "react";
import { useIsland } from "@/services/IslandManager";
import { pushCalculation } from "@/services/CalculatorService";
import { IslandShell } from "./IslandShell";

export function CalculatorSnippet() {
  const calc = useIsland((s) => s.calculator);
  const enabled = useIsland((s) => s.modules.calculator.enabled);
  const [expr, setExpr] = useState("");
  if (!enabled) return null;

  return (
    <IslandShell
      accent="#a7b0ff"
      capsule={
        <>
          <CalcIcon />
          <span className="font-mono tabular-nums">
            {calc?.result ?? "—"}
          </span>
        </>
      }
      expanded={
        <div className="space-y-3">
          <form
            onSubmit={(e) => { e.preventDefault(); pushCalculation(expr); }}
            className="flex gap-2"
          >
            <input
              value={expr}
              onChange={(e) => setExpr(e.target.value)}
              placeholder="例: (12.5 + 7) * 4"
              className="flex-1 rounded-xl bg-zinc-900 px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-capsule-accent/40"
            />
            <button className="rounded-xl bg-capsule-accent px-3 text-sm font-medium text-black">
              =
            </button>
          </form>

          {calc && (
            <div className="space-y-1 rounded-2xl bg-zinc-900/70 p-3 font-mono text-sm">
              <div className="text-zinc-500">{calc.expression}</div>
              <div className="text-xl">= {calc.result}</div>
              {calc.history && calc.history.length > 1 && (
                <div className="mt-2 space-y-0.5 border-t border-zinc-800 pt-2 text-xs text-zinc-500">
                  {calc.history.slice(1).map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      }
    />
  );
}

function CalcIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
      <path d="M6 2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm1 3v3h10V5H7zm0 5v2h2v-2H7zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2zm3 0v2h1v-2h-1zM7 13v2h2v-2H7zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2zm3 0v6h1v-6h-1zM7 16v2h2v-2H7zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2z" />
    </svg>
  );
}
