"use client";

import { create } from "zustand";
import { IslanderBridge } from "@/plugins/islander-bridge";
import type {
  CalculatorPayload,
  ChargingSnapshot,
  CurrencyPayload,
  IslandModuleId,
  ThermalSnapshot,
} from "@/plugins/islander-bridge/definitions";

export interface ModuleState {
  enabled: boolean;
  pollMs: number;
}

interface IslandState {
  modules: Record<IslandModuleId, ModuleState>;
  charging?: ChargingSnapshot;
  thermal?: ThermalSnapshot;
  calculator?: CalculatorPayload;
  currency?: CurrencyPayload;
  setModule: (id: IslandModuleId, patch: Partial<ModuleState>) => void;
  setCharging: (s: ChargingSnapshot) => void;
  setThermal: (s: ThermalSnapshot) => void;
  setCalculator: (s: CalculatorPayload) => void;
  setCurrency: (s: CurrencyPayload) => void;
}

const DEFAULT_POLL: Record<IslandModuleId, number> = {
  charging: 1500,
  thermal: 4000,
  calculator: 0,
  currency: 60_000,
};

export const useIsland = create<IslandState>((set) => ({
  modules: {
    charging:   { enabled: false, pollMs: DEFAULT_POLL.charging },
    thermal:    { enabled: false, pollMs: DEFAULT_POLL.thermal },
    calculator: { enabled: false, pollMs: DEFAULT_POLL.calculator },
    currency:   { enabled: false, pollMs: DEFAULT_POLL.currency },
  },
  setModule: (id, patch) =>
    set((s) => ({ modules: { ...s.modules, [id]: { ...s.modules[id], ...patch } } })),
  setCharging:   (charging)   => set({ charging }),
  setThermal:    (thermal)    => set({ thermal }),
  setCalculator: (calculator) => set({ calculator }),
  setCurrency:   (currency)   => set({ currency }),
}));

/**
 * Wire native listeners exactly once. Call from a top-level client component
 * mounted on the dashboard.
 */
let wired = false;
export async function bootstrapIsland() {
  if (wired) return;
  wired = true;
  await IslanderBridge.requestNotificationPermission().catch(() => undefined);
  await IslanderBridge.addListener("charging", (snap) =>
    useIsland.getState().setCharging(snap as ChargingSnapshot),
  );
  await IslanderBridge.addListener("thermal", (snap) =>
    useIsland.getState().setThermal(snap as ThermalSnapshot),
  );
}

export async function toggleModule(id: IslandModuleId, on: boolean) {
  const { pollMs } = useIsland.getState().modules[id];
  if (on) {
    await IslanderBridge.enableModule({ module: id, pollMs });
  } else {
    await IslanderBridge.disableModule({ module: id });
  }
  useIsland.getState().setModule(id, { enabled: on });
}
