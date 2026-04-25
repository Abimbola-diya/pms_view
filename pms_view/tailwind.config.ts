import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palantir Dark
        'palantir-void': '#0A0E27',
        'palantir-dark': '#0D1117',
        'palantir-bg': '#1A1F3A',
        'palantir-panel': '#111827',
        
        // Data Colors
        'crude-gold': '#FFD700',
        'crude-gold-dim': '#B8A000',
        'refine-cyan': '#00D9FF',
        'refine-cyan-dim': '#0099BB',
        'retail-teal': '#1ABC9C',
        'retail-teal-dim': '#0E7856',
        'port-blue': '#0066CC',
        'port-blue-dim': '#003D7A',
        
        // Alerts
        'alert-red': '#FF1744',
        'alert-red-dim': '#8B0000',
        'caution-orange': '#FFA500',
        'caution-orange-dim': '#994C00',
        'healthy-green': '#00E676',
        'healthy-green-dim': '#004D2E',
        
        // AI & Info
        'ai-purple': '#9D4EDD',
        'ai-purple-accent': '#E0AAFF',
        'info-yellow': '#FFE082',
        'ai-neon': '#00D9FF',
        
        // Text
        'text-primary': '#E8E8E8',
        'text-secondary': '#A0A0A0',
        'text-muted': '#696969',
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'Courier New', 'monospace'],
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'display-xl': '32px',
        'display-l': '24px',
        'display-m': '20px',
        'headline': '16px',
        'body-lg': '14px',
        'body': '13px',
        'label': '12px',
        'tiny': '11px',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 217, 255, 0.5), inset 0 0 15px rgba(0, 217, 255, 0.1)',
        'glow-cyan-lg': '0 0 40px rgba(0, 217, 255, 0.6)',
        'glow-gold': '0 0 20px rgba(255, 215, 0, 0.5)',
        'glow-red': '0 0 20px rgba(255, 23, 68, 0.7)',
        'glow-purple': '0 0 15px rgba(157, 78, 221, 0.4)',
        'panel-glow': '0 8px 32px rgba(0, 217, 255, 0.15)',
        'panel-border': 'inset 0 0 20px rgba(0, 217, 255, 0.1)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      animation: {
        'pulse-cyan': 'pulseCyan 2s infinite',
        'pulse-orange': 'pulseOrange 2s infinite',
        'pulse-red': 'pulseRed 0.8s infinite',
        'glow-steady': 'glowSteady 3s infinite',
        'float': 'float 6s ease-in-out infinite',
        'scan-line': 'scanLine 4s linear infinite',
        'flicker': 'flicker 0.2s infinite',
        'neon-glow': 'neonGlow 2s ease-in-out infinite',
      },
      keyframes: {
        pulseCyan: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(0, 217, 255, 0.8)' },
          '50%': { boxShadow: '0 0 5px rgba(0, 217, 255, 0.3)' },
        },
        pulseOrange: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(255, 165, 0, 0.8)' },
          '50%': { boxShadow: '0 0 5px rgba(255, 165, 0, 0.3)' },
        },
        pulseRed: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 23, 68, 1)' },
          '50%': { boxShadow: '0 0 5px rgba(255, 23, 68, 0.4)' },
        },
        glowSteady: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 230, 118, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        scanLine: {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        },
        flicker: {
          '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': { opacity: '1' },
          '20%, 24%, 55%': { opacity: '0.5' },
        },
        neonGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 10px rgba(0, 217, 255, 0.5), 0 0 20px rgba(0, 217, 255, 0.3)' 
          },
          '50%': { 
            boxShadow: '0 0 20px rgba(0, 217, 255, 0.8), 0 0 40px rgba(0, 217, 255, 0.5)' 
          },
        },
      },
    },
  },
  plugins: [
    function ({ addComponents }: any) {
      addComponents({
        '.glassmorphic': {
          'background': 'rgba(13, 17, 23, 0.7)',
          'backdrop-filter': 'blur(12px)',
          '-webkit-backdrop-filter': 'blur(12px)',
          'border': '1px solid rgba(0, 217, 255, 0.15)',
          'border-radius': '0.5rem',
        },
        '.glassmorphic:hover': {
          'border-color': 'rgba(0, 217, 255, 0.25)',
          'box-shadow': '0 0 20px rgba(0, 217, 255, 0.15)',
        },
        '.neon-border': {
          'border': '1px solid rgba(0, 217, 255, 0.3)',
          'box-shadow': '0 0 10px rgba(0, 217, 255, 0.2), inset 0 0 10px rgba(0, 217, 255, 0.05)',
        },
        '.hud-panel': {
          'background': 'rgba(13, 17, 23, 0.7)',
          'backdrop-filter': 'blur(12px)',
          '-webkit-backdrop-filter': 'blur(12px)',
          'border': '1px solid rgba(0, 217, 255, 0.15)',
          'border-radius': '0.5rem',
          'padding': '1rem',
          'box-shadow': '0 0 15px rgba(0, 217, 255, 0.1), inset 0 0 10px rgba(0, 217, 255, 0.05)',
          'transition': 'all 0.3s ease',
        },
        '.hud-panel:hover': {
          'border-color': 'rgba(0, 217, 255, 0.25)',
          'box-shadow': '0 0 25px rgba(0, 217, 255, 0.2), inset 0 0 10px rgba(0, 217, 255, 0.08)',
        },
      });
    },
  ],
};

export default config;
