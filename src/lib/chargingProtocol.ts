import type { ChargingSnapshot } from "@/plugins/islander-bridge/definitions";

const PROTOCOL_RANGES: Array<{
  min: number;
  max: number;
  protocol: ChargingSnapshot["protocol"];
  label: string;
}> = [
  { min: 100, max: 1000, protocol: "SuperVOOC", label: "SUPERVOOC" },
  { min: 60, max: 99.99, protocol: "SuperVOOC", label: "SUPERVOOC" },
  { min: 27, max: 59.99, protocol: "VOOC", label: "VOOC" },
  { min: 18, max: 26.99, protocol: "USB-PD", label: "PD" },
  { min: 7.5, max: 17.99, protocol: "QC", label: "QC" },
  { min: 2.5, max: 7.49, protocol: "USB", label: "USB" },
];

/** Best-effort labelling of fast-charge tier based on instantaneous wattage. */
export function classifyProtocol(snap: ChargingSnapshot): {
  protocol: ChargingSnapshot["protocol"];
  label: string;
  tier: "trickle" | "standard" | "fast" | "super";
} {
  if (snap.plugged === "WIRELESS") {
    return { protocol: "Wireless", label: "AIRVOOC", tier: snap.watts > 30 ? "super" : "fast" };
  }
  if (snap.plugged === "NONE" || snap.status !== "charging") {
    return { protocol: "Unknown", label: "", tier: "trickle" };
  }
  for (const r of PROTOCOL_RANGES) {
    if (snap.watts >= r.min && snap.watts <= r.max) {
      const tier =
        snap.watts >= 60 ? "super" :
        snap.watts >= 18 ? "fast" :
        snap.watts >= 7.5 ? "standard" : "trickle";
      return { protocol: r.protocol, label: r.label, tier };
    }
  }
  return { protocol: snap.protocol ?? "Unknown", label: "", tier: "trickle" };
}

export function formatWatts(w: number): string {
  if (w < 1) return `${(w * 1000).toFixed(0)}mW`;
  if (w < 10) return `${w.toFixed(2)}W`;
  return `${w.toFixed(1)}W`;
}
