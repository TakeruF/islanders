import { WebPlugin } from "@capacitor/core";
import type {
  ChargingSnapshot,
  IslanderBridgePlugin,
  IslandModuleId,
  ModulePayload,
  PromotionStatus,
  ThermalSnapshot,
} from "./definitions";

/**
 * Browser fallback. Uses the W3C Battery Status API when available and
 * synthesises a thermal snapshot from a sine wave so that the dashboard
 * is usable during `next dev`.
 */
export class IslanderBridgeWeb
  extends WebPlugin
  implements IslanderBridgePlugin
{
  private timers = new Map<IslandModuleId, number>();

  async getPromotionStatus(): Promise<PromotionStatus> {
    return { canPostPromoted: false, liveUpdateApi: false, colorOsHost: false };
  }

  async requestNotificationPermission(): Promise<{ granted: boolean }> {
    if (typeof Notification === "undefined") return { granted: false };
    const res = await Notification.requestPermission();
    return { granted: res === "granted" };
  }

  async enableModule({
    module,
    pollMs = 1500,
  }: { module: IslandModuleId; pollMs?: number }): Promise<void> {
    this.disableModule({ module });
    if (module === "charging") {
      const tick = async () => this.notifyListeners("charging", await readBattery());
      tick();
      this.timers.set(module, window.setInterval(tick, pollMs));
    } else if (module === "thermal") {
      const tick = () => this.notifyListeners("thermal", fakeThermal());
      tick();
      this.timers.set(module, window.setInterval(tick, pollMs));
    }
  }

  async disableModule({ module }: { module: IslandModuleId }): Promise<void> {
    const id = this.timers.get(module);
    if (id) window.clearInterval(id);
    this.timers.delete(module);
  }

  async updateModule(_opts: ModulePayload): Promise<void> {
    // No-op on web. Native side posts the actual Live Update.
  }
}

async function readBattery(): Promise<ChargingSnapshot> {
  // @ts-expect-error - non-standard but widely available
  const bm = navigator.getBattery ? await navigator.getBattery() : null;
  return {
    watts: 0,
    currentMa: 0,
    voltageV: 0,
    level: Math.round((bm?.level ?? 0.5) * 100),
    protocol: "Unknown",
    plugged: bm?.charging ? "USB" : "NONE",
    status: bm?.charging ? "charging" : "discharging",
    timestamp: Date.now(),
  };
}

function fakeThermal(): ThermalSnapshot {
  const t = Date.now() / 1000;
  const soc = 40 + 8 * Math.sin(t / 30);
  return {
    socTempC: Math.round(soc * 10) / 10,
    batteryTempC: Math.round((soc - 5) * 10) / 10,
    thermalStatus: soc > 50 ? 2 : 0,
    throttling: soc > 50,
    timestamp: Date.now(),
  };
}
