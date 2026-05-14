"use client";

import { useIsland } from "@/services/IslandManager";
import { classifyProtocol, formatWatts } from "@/lib/chargingProtocol";
import { IslandShell } from "./IslandShell";

export function ChargingMonitor() {
  const snap = useIsland((s) => s.charging);
  const thermal = useIsland((s) => s.thermal);
  const enabled = useIsland((s) => s.modules.charging.enabled);
  if (!enabled || !snap) return null;

  const tier = classifyProtocol(snap);
  const accent =
    tier.tier === "super" ? "#7cffb5" :
    tier.tier === "fast"  ? "#4af8ff" :
    "#f4f4f5";

  return (
    <IslandShell
      accent={accent}
      capsule={
        <>
          <BoltIcon />
          <span className="tabular-nums">{formatWatts(snap.watts)}</span>
          <span className="text-zinc-400">·</span>
          <span className="tabular-nums">{snap.level}%</span>
        </>
      }
      expanded={
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-zinc-400">
                {tier.label || "充電中"}
              </div>
              <div className="text-3xl font-semibold tabular-nums" style={{ color: accent }}>
                {formatWatts(snap.watts)}
              </div>
            </div>
            <BatteryRing level={snap.level} accent={accent} />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric label="電流"  value={`${(snap.currentMa / 1000).toFixed(2)} A`} />
            <Metric label="電圧"  value={`${snap.voltageV.toFixed(2)} V`} />
            <Metric label="温度"  value={thermal ? `${thermal.batteryTempC.toFixed(1)}°` : "—"} />
          </div>
        </div>
      }
    />
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-zinc-900/70 py-2">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="text-sm font-medium tabular-nums">{value}</div>
    </div>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  );
}

function BatteryRing({ level, accent }: { level: number; accent: string }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
      <circle cx={28} cy={28} r={r} stroke="#27272a" strokeWidth={4} fill="none" />
      <circle cx={28} cy={28} r={r} stroke={accent} strokeWidth={4} fill="none"
        strokeDasharray={c} strokeDashoffset={c - (c * level) / 100} strokeLinecap="round" />
      <text x={28} y={31} textAnchor="middle" className="rotate-90"
        fill="#f4f4f5" fontSize={12} fontWeight={600}>{level}</text>
    </svg>
  );
}
