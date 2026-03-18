module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts}',
  ],
  presets: [require('nativewind/preset')],
  // Note: do NOT set darkMode — nativewind/preset registers its own dark variant
  theme: {
    extend: {},
  },
};
