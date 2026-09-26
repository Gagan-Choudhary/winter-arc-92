import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "#0D0D0F",
        card: "#17171C",
        raised: "#24242B",
        ink: "#F4F4F5",
        muted: "#A1A1AA",
        ice: "#38BDF8",
        gold: "#D6B86A"
      },
      boxShadow: { glow: "0 12px 44px rgba(56,189,248,.15)" }
    }
  },
  plugins: []
} satisfies Config;
