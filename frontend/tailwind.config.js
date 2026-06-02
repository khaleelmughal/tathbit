/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Madrasah design tokens — use these everywhere for consistency
        paper:   "#FBF7EE",
        paper2:  "#F3ECDD",
        ink:     "#2B3A33",
        ink2:    "#5C6B62",
        faint:   "#8A968D",
        line:    "#E8E0CF",
        brand:   "#1E7A57",   // primary green
        brandSoft:"#E4F1E9",
        gold:    "#C99A2E",
      },
      fontFamily: {
        serif: ['Fraunces', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: "22px" },
    },
  },
  plugins: [],
};
