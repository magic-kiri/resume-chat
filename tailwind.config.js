/** @type {import('tailwindcss').Config} */
module.exports = {
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
