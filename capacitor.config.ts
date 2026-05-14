import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.islanders.app",
  appName: "Islanders",
  webDir: "out",
  backgroundColor: "#0a0a0c",
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  server: {
    androidScheme: "https",
  },
};

export default config;
