/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "chat-bg": "#343541",
        "sidebar-bg": "#202123",
        "chat-input": "#40414f",
      },
    },
  },
  plugins: [],
};
