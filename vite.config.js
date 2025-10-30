import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/emmys-learning-app/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and core dependencies
          vendor: ['react', 'react-dom', 'react-router-dom'],
          
          // Educational content chunks
          'content-core': [
            'src/data/educationalContent.js'
          ],
          'content-science': [
            'src/data/subjects/scienceContent.js',
            'src/components/subjects/ScienceComponent.jsx'
          ],
          'content-art': [
            'src/data/subjects/artContent.js',
            'src/components/subjects/ArtComponent.jsx'
          ],
          'content-geography': [
            'src/data/subjects/geographyContent.js',
            'src/components/subjects/GeographyComponent.jsx'
          ],
          'content-history': [
            'src/data/subjects/historyContent.js',
            'src/components/subjects/HistoryComponent.jsx'
          ],
          
          // Utility chunks
          'utils-performance': [
            'src/utils/performanceMonitor.js',
            'src/utils/coreWebVitals.js',
            'src/utils/userCentricMetrics.js',
            'src/utils/performanceRegressionDetector.js'
          ],
          'utils-mobile': [
            'src/utils/mobilePerformanceOptimizer.js',
            'src/utils/touchInteractionManager.js',
            'src/utils/responsiveUtils.js'
          ],
          'utils-accessibility': [
            'src/utils/accessibilityManager.js',
            'src/utils/accessibilityHelpers.js',
            'src/utils/textToSpeech.js'
          ],
          'utils-audio': [
            'src/utils/audioManager.js',
            'src/hooks/useAudio.js'
          ],
          'utils-pwa': [
            'src/utils/serviceWorkerManager.js',
            'src/utils/pwaUtils.js'
          ],
          
          // Component chunks
          'components-ui': [
            'src/components/ErrorBoundary.jsx',
            'src/components/LazyImage.jsx',
            'src/components/MobileLoadingState.jsx',
            'src/components/SkeletonLoader.jsx'
          ],
          'components-accessibility': [
            'src/components/AccessibilityProvider.jsx',
            'src/components/AccessibilitySettings.jsx',
            'src/components/FocusManager.jsx',
            'src/components/SkipLinks.jsx'
          ],
          'components-performance': [
            'src/components/PerformanceDashboard.jsx',
            'src/components/OfflineManager.jsx'
          ]
        },
        // Optimize chunk file names for caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace('.jsx', '').replace('.js', '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `css/[name]-[hash].${ext}`;
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `images/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        }
      }
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Enable source maps for better debugging
    sourcemap: false, // Disable in production for smaller builds
    // Minify for production
    minify: 'esbuild' // Use esbuild instead of terser for faster builds
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@emailjs/browser',
      '@supabase/supabase-js'
    ],
    exclude: [
      // Exclude large dependencies that should be loaded on demand
      'src/data/subjects/scienceContent.js',
      'src/data/subjects/artContent.js',
      'src/data/subjects/geographyContent.js',
      'src/data/subjects/historyContent.js'
    ]
  }
})

