import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        capsule: {
          bg: "#0d0d10",
          fg: "#f4f4f5",
          accent: "#7cffb5",
          warn: "#ffb454",
          alert: "#ff5a5f",
        },
      },
      borderRadius: {
        capsule: "9999px",
        island: "32px",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
