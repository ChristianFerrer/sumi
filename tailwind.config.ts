import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta Sumi — ámbar cálido
        sumi: {
          DEFAULT: "#f39c12",
          dark: "#b9770b",
          light: "#f8c471",
        },
        // Colores de nota (semaforo Sumi)
        grade: {
          excellent: "#16a34a",
          good: "#84cc16",
          poor: "#f59e0b",
          bad: "#dc2626",
        },
      },
    },
  },
  plugins: [],
};

export default config;
