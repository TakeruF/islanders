"use client";

import { useIsland } from "@/services/IslandManager";
import { IslandShell } from "./IslandShell";

const STATUS_LABEL = [
  "NONE", "LIGHT", "MODERATE", "SEVERE", "CRITICAL", "EMERGENCY", "SHUTDOWN",
];

export function SystemHealth() {
  const snap = useIsland((s) => s.thermal);
  const enabled = useIsland((s) => s.modules.thermal.enabled);
  if (!enabled || !snap) return null;

  const accent =
    snap.thermalStatus >= 3 ? "#ff5a5f" :
    snap.thermalStatus >= 1 ? "#ffb454" :
    "#7cffb5";

  return (
    <IslandShell
      accent={accent}
      capsule={
        <>
          <ThermoIcon />
          <span className="tabular-nums">{snap.socTempC.toFixed(1)}°</span>
          {snap.throttling && <span className="text-capsule-warn">⚠</span>}
        </>
      }
      expanded={
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-zinc-400">SoC</div>
              <div className="text-3xl font-semibold tabular-nums" style={{ color: accent }}>
                {snap.socTempC.toFixed(1)}°C
              </div>
            </div>
            <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs"
              style={{ color: accent }}>
              {STATUS_LABEL[snap.thermalStatus]}
            </span>
          </div>

          <ThermalBar value={snap.socTempC} />

          <div className="grid grid-cols-2 gap-2 text-center">
            <Metric label="電池温度" value={`${snap.batteryTempC.toFixed(1)}°C`} />
            <Metric label="制限"     value={snap.throttling ? "あり" : "なし"} />
          </div>
        </div>
      }
    />
  );
}

function ThermalBar({ value }: { value: number }) {
  const clamped = Math.max(20, Math.min(80, value));
  const pct = ((clamped - 20) / 60) * 100;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
      <div
        className="h-full"
        style={{
          width: `${pct}%`,
          background: "linear-gradient(90deg,#7cffb5 0%,#ffb454 60%,#ff5a5f 100%)",
        }}
      />
    </div>
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

function ThermoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
      <path d="M12 2a3 3 0 00-3 3v9.17a5 5 0 106 0V5a3 3 0 00-3-3zm0 18a3 3 0 01-1-5.83V5a1 1 0 112 0v9.17A3 3 0 0112 20z" />
    </svg>
  );
}
