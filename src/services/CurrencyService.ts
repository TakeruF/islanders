"use client";

import { IslanderBridge } from "@/plugins/islander-bridge";
import { useIsland } from "./IslandManager";
import type { CurrencyPayload } from "@/plugins/islander-bridge/definitions";

const CACHE_KEY = "islanders.fx.cache";
const STALE_MS = 5 * 60 * 1000;

let timer: ReturnType<typeof setInterval> | null = null;

export function startCurrencyLoop(opts: {
  base: string;
  quote: string;
  intervalMs?: number;
}) {
  stopCurrencyLoop();
  const tick = () => fetchRate(opts.base, opts.quote).catch(() => undefined);
  tick();
  timer = setInterval(tick, opts.intervalMs ?? 60_000);
}

export function stopCurrencyLoop() {
  if (timer) clearInterval(timer);
  timer = null;
}

export async function fetchRate(base: string, quote: string) {
  const cached = readCache(base, quote);
  if (cached && Date.now() - cached.fetchedAt < STALE_MS) {
    publish(cached);
    return cached;
  }
  // open.er-api.com is free, no key. Crypto callers should override.
  const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
  if (!res.ok) throw new Error(`fx fetch ${res.status}`);
  const json = (await res.json()) as { rates: Record<string, number> };
  const rate = json.rates?.[quote];
  if (typeof rate !== "number") throw new Error("missing rate");
  const payload: CurrencyPayload = {
    base,
    quote,
    rate,
    change24h: cached ? (rate - cached.rate) / cached.rate : undefined,
    source: "open.er-api.com",
    fetchedAt: Date.now(),
  };
  writeCache(payload);
  publish(payload);
  return payload;
}

function publish(p: CurrencyPayload) {
  useIsland.getState().setCurrency(p);
  IslanderBridge.updateModule({ module: "currency", data: p }).catch(() => undefined);
}

function cacheKey(base: string, quote: string) {
  return `${CACHE_KEY}.${base}.${quote}`;
}
function readCache(base: string, quote: string): CurrencyPayload | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(cacheKey(base, quote)) ?? "null"); }
  catch { return null; }
}
function writeCache(p: CurrencyPayload) {
  if (typeof window === "undefined") return;
  localStorage.setItem(cacheKey(p.base, p.quote), JSON.stringify(p));
}
