import { registerPlugin } from "@capacitor/core";
import type { IslanderBridgePlugin } from "./definitions";

export const IslanderBridge = registerPlugin<IslanderBridgePlugin>(
  "IslanderBridge",
  {
    web: () => import("./web").then((m) => new m.IslanderBridgeWeb()),
  },
);

export * from "./definitions";
