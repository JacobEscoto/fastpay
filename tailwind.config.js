/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg0:    "#0c0f0e",
        bg1:    "#161d1a",
        bg2:    "#1c2420",
        bg3:    "#222b27",
        green:  "#00ff87",
        amber:  "#f5a623",
        danger: "#ff4060",
        blue:   "#4d9fff",
        t1:     "#e8efe8",
        t2:     "#8fa88f",
        t3:     "#4a604a",
      },
      fontFamily: {
        mono: ['"DM Mono"', "monospace"],
        head: ["Syne", "sans-serif"],
      },
      borderRadius: { fp: "3px" },
    },
  },
  plugins: [],
}

