"use client";

import { useEffect } from "react";
import { bootstrapIsland, useIsland } from "@/services/IslandManager";
import { ChargingMonitor } from "./ChargingMonitor";
import { SystemHealth } from "./SystemHealth";
import { CalculatorSnippet } from "./CalculatorSnippet";
import { CurrencyConverter } from "./CurrencyConverter";
import { ModuleToggle } from "./ModuleToggle";

export function Dashboard() {
  const modules = useIsland((s) => s.modules);

  useEffect(() => {
    bootstrapIsland();
  }, []);

  return (
    <main className="mx-auto max-w-md px-4 py-6 pb-24 space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Islanders</h1>
        <p className="text-sm text-zinc-400">
          流体云 / Live Update コントロールパネル
        </p>
      </header>

      <section className="space-y-3">
        <ModuleToggle id="charging"   label="充電モニター" enabled={modules.charging.enabled}   />
        <ChargingMonitor />

        <ModuleToggle id="thermal"    label="システム熱状態" enabled={modules.thermal.enabled}   />
        <SystemHealth />

        <ModuleToggle id="calculator" label="計算機スニペット" enabled={modules.calculator.enabled} />
        <CalculatorSnippet />

        <ModuleToggle id="currency"   label="レート換算"     enabled={modules.currency.enabled}  />
        <CurrencyConverter />
      </section>
    </main>
  );
}
