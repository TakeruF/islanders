"use client";

import { useEffect, useState } from "react";
import { CircleDollarSign } from "lucide-react";
import { useIsland } from "@/services/IslandManager";
import { startCurrencyLoop, stopCurrencyLoop } from "@/services/CurrencyService";
import { IslandShell } from "./IslandShell";

export function CurrencyConverter() {
  const fx = useIsland((s) => s.currency);
  const enabled = useIsland((s) => s.modules.currency.enabled);
  const [pair, setPair] = useState<{ base: string; quote: string }>({
    base: "JPY",
    quote: "CNY",
  });

  useEffect(() => {
    if (!enabled) { stopCurrencyLoop(); return; }
    startCurrencyLoop({ ...pair, intervalMs: 60_000 });
    return () => stopCurrencyLoop();
  }, [enabled, pair]);

  if (!enabled) return null;

  const trend =
    !fx?.change24h ? "flat" :
    fx.change24h > 0.0005 ? "up" :
    fx.change24h < -0.0005 ? "down" : "flat";
  const accent = trend === "up" ? "#7cffb5" : trend === "down" ? "#ff5a5f" : "#f4f4f5";

  return (
    <IslandShell
      accent={accent}
      capsule={
        <>
          <CurrencyIcon />
          <span className="tabular-nums">
            {fx ? `${fx.base}/${fx.quote} ${fx.rate.toFixed(4)}` : "—"}
          </span>
        </>
      }
      expanded={
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-zinc-400">
                {fx ? `1 ${fx.base} =` : "fetching…"}
              </div>
              <div className="text-3xl font-semibold tabular-nums" style={{ color: accent }}>
                {fx ? `${fx.rate.toFixed(4)} ${fx.quote}` : "—"}
              </div>
            </div>
            {fx?.change24h !== undefined && (
              <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs tabular-nums" style={{ color: accent }}>
                {(fx.change24h * 100).toFixed(2)}%
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <PairInput value={pair.base}  onChange={(base) => setPair((p) => ({ ...p, base }))}  />
            <PairInput value={pair.quote} onChange={(quote) => setPair((p) => ({ ...p, quote }))} />
          </div>

          {fx && (
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">
              {fx.source} · {new Date(fx.fetchedAt).toLocaleTimeString()}
            </div>
          )}
        </div>
      }
    />
  );
}

function PairInput({
  value, onChange,
}: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value.toUpperCase().slice(0, 4))}
      className="w-20 rounded-xl bg-zinc-900 px-3 py-2 text-center font-mono text-sm tracking-widest outline-none focus:ring-2 focus:ring-capsule-accent/40"
    />
  );
}

function CurrencyIcon() {
  return <CircleDollarSign className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
}
