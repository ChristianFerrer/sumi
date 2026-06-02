import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta Sumi — inspirada en lo andino/natural
        sumi: {
          DEFAULT: "#0f766e", // teal andino
          dark: "#134e4a",
          light: "#5eead4",
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
