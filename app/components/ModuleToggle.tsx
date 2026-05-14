"use client";

import { toggleModule } from "@/services/IslandManager";
import type { IslandModuleId } from "@/plugins/islander-bridge/definitions";

export function ModuleToggle({
  id,
  label,
  enabled,
}: {
  id: IslandModuleId;
  label: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-island bg-zinc-900/60 px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        onClick={() => toggleModule(id, !enabled)}
        className={`relative h-6 w-11 rounded-full transition ${
          enabled ? "bg-capsule-accent" : "bg-zinc-700"
        }`}
        aria-pressed={enabled}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
            enabled ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
