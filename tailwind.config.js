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
        canvas: '#0B1220',
        canvasRaised: '#0F1830',
        board: '#F4F6F8',
        accent: '#4F6BFF',
        accent2: '#FFB020',
        surface: '#FFFFFF',
        surfaceDark: '#141B2E',
        surfaceDarkRaised: '#1A2338',
        muted: '#5C6B7A',
        mutedDark: '#8A93A6',
        line: '#E3E7EC',
        lineDark: 'rgba(255,255,255,0.08)',
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
        cardDark: '0 1px 2px rgba(0,0,0,0.3), 0 1px 1px rgba(0,0,0,0.2)',
        cardDarkHover: '0 12px 32px -8px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
        panelDark: '0 20px 60px -12px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}