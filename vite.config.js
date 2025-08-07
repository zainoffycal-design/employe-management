import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
        silenceDeprecations: ['legacy-js-api'],
      },
    },
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      treeshake: true,
      output: {
        
        manualChunks: undefined,
      },
    },
    
    cssCodeSplit: true,
    
    chunkSizeWarningLimit: 1000,
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'react-hot-toast',
      'react-icons',
      'react-select'
    ],
    exclude: [],
  },
}) 