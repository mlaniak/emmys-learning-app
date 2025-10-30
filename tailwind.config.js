/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Mobile-first breakpoints (Tailwind default is already mobile-first)
      screens: {
        'xs': '475px',
        // sm: '640px' (default)
        // md: '768px' (default)
        // lg: '1024px' (default)
        // xl: '1280px' (default)
        // 2xl: '1536px' (default)
      },
      // Touch-friendly sizing
      spacing: {
        '18': '4.5rem', // 72px - good for touch targets
        '22': '5.5rem', // 88px - large touch targets
      },
      // Mobile-optimized typography - mobile first
      fontSize: {
        'xs-mobile': ['0.875rem', { lineHeight: '1.3' }], // Larger for mobile readability
        'sm-mobile': ['1rem', { lineHeight: '1.4' }],
        'base-mobile': ['1.125rem', { lineHeight: '1.5' }], // Larger base for mobile
        'lg-mobile': ['1.25rem', { lineHeight: '1.5' }],
        'xl-mobile': ['1.5rem', { lineHeight: '1.4' }],
        '2xl-mobile': ['1.75rem', { lineHeight: '1.3' }],
      },
      // Touch-friendly minimum sizes - mobile first
      minHeight: {
        'touch': '48px', // Mobile-first: Android minimum touch target
        'touch-lg': '56px', // Large touch targets for primary actions
        'touch-xl': '64px', // Extra large for important buttons
      },
      minWidth: {
        'touch': '48px',
        'touch-lg': '56px',
        'touch-xl': '64px',
      },
      // Mobile-specific animations
      animation: {
        'swipe-left': 'swipeLeft 0.3s ease-out',
        'swipe-right': 'swipeRight 0.3s ease-out',
        'swipe-up': 'swipeUp 0.3s ease-out',
        'swipe-down': 'swipeDown 0.3s ease-out',
        'pull-refresh': 'pullRefresh 0.5s ease-out',
        'mobile-bounce': 'mobileBounce 0.6s ease-in-out',
        'touch-feedback': 'touchFeedback 0.1s ease-in-out',
      },
      keyframes: {
        swipeLeft: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        swipeRight: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        swipeUp: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-100%)' },
        },
        swipeDown: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
        pullRefresh: {
          '0%': { transform: 'translateY(-50px)', opacity: '0' },
          '50%': { transform: 'translateY(10px)', opacity: '1' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        mobileBounce: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-10px)' },
          '60%': { transform: 'translateY(-5px)' },
        },
        touchFeedback: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}

