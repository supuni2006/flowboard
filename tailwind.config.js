/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#1B1F23',
        canvas: '#0E1A2B',
        board: '#F4F6F8',
        accent: '#3D7BFF',
        accent2: '#FFB020',
        surface: '#FFFFFF',
        muted: '#5C6B7A',
        line: '#E3E7EC',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '10px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.06), 0 1px 1px rgba(16,24,40,0.04)',
        cardHover: '0 4px 10px rgba(16,24,40,0.12)',
      },
    },
  },
  plugins: [],
}
