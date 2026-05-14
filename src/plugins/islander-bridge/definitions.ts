import type { PluginListenerHandle } from "@capacitor/core";

export type IslandModuleId =
  | "charging"
  | "thermal"
  | "calculator"
  | "currency";

export interface ChargingSnapshot {
  /** Instantaneous power in watts (computed as |I| * V). */
  watts: number;
  /** Battery current in mA. Positive when charging, negative when discharging. */
  currentMa: number;
  /** Battery voltage in volts. */
  voltageV: number;
  /** State of charge 0..100 */
  level: number;
  /** Detected fast-charge protocol. */
  protocol:
    | "USB-PD"
    | "QC"
    | "SuperVOOC"
    | "VOOC"
    | "Warp"
    | "AC"
    | "USB"
    | "Wireless"
    | "Unknown";
  /** Plug status reported by BatteryManager. */
  plugged: "AC" | "USB" | "WIRELESS" | "DOCK" | "NONE";
  status: "charging" | "discharging" | "full" | "not_charging" | "unknown";
  /** ms since epoch */
  timestamp: number;
}

export interface ThermalSnapshot {
  /** SoC die temperature in °C (best-effort across vendors). */
  socTempC: number;
  /** Battery temperature in °C. */
  batteryTempC: number;
  /**
   * PowerManager.getCurrentThermalStatus() — 0 (NONE) … 6 (SHUTDOWN).
   * @see https://developer.android.com/reference/android/os/PowerManager#getCurrentThermalStatus()
   */
  thermalStatus: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  throttling: boolean;
  timestamp: number;
}

export interface CalculatorPayload {
  expression: string;
  result: string;
  /** Optional history snippet (up to 3 lines) shown on expand. */
  history?: string[];
}

export interface CurrencyPayload {
  base: string;       // "JPY"
  quote: string;      // "CNY"
  rate: number;
  change24h?: number; // -1..1
  source: string;     // "open.er-api.com" etc.
  fetchedAt: number;
}

export type ModulePayload =
  | { module: "charging"; data: ChargingSnapshot }
  | { module: "thermal"; data: ThermalSnapshot }
  | { module: "calculator"; data: CalculatorPayload }
  | { module: "currency"; data: CurrencyPayload };

export interface PromotionStatus {
  /** Whether the runtime can post promoted (status-bar chip) live updates. */
  canPostPromoted: boolean;
  /** True on Android 16+ where Live Update API is available. */
  liveUpdateApi: boolean;
  /** True when the host appears to be ColorOS / OxygenOS (流体云 capable). */
  colorOsHost: boolean;
}

export interface IslanderBridgePlugin {
  /** Returns whether Live Update / promoted notifications are available. */
  getPromotionStatus(): Promise<PromotionStatus>;

  /** Ensures POST_NOTIFICATIONS runtime permission. */
  requestNotificationPermission(): Promise<{ granted: boolean }>;

  /** Enable a module. Starts native monitors when applicable. */
  enableModule(opts: { module: IslandModuleId; pollMs?: number }): Promise<void>;

  /** Disable a module and cancel its live update. */
  disableModule(opts: { module: IslandModuleId }): Promise<void>;

  /**
   * Push a payload into the live-update notification. For charging/thermal the
   * native side ignores `data` and uses its own monitors; for calculator/currency
   * the JS layer is the source of truth.
   */
  updateModule(opts: ModulePayload): Promise<void>;

  /** Subscribe to native monitor snapshots (battery, thermal). */
  addListener(
    eventName: "charging" | "thermal",
    listener: (snap: ChargingSnapshot | ThermalSnapshot) => void,
  ): Promise<PluginListenerHandle>;
}
