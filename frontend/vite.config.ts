import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Correct imports for ESM
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      process: 'process/browser',
      buffer: 'buffer',
      // Redirect pusher-js imports to our CDN shim
      // This makes laravel-echo's internal require('pusher-js') use the CDN version
      'pusher-js': path.resolve(__dirname, './src/pusher-shim.ts'),
    },
  },
  optimizeDeps: {
    // Exclude pusher-js from optimization so it uses our shim
    exclude: ['pusher-js'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({ buffer: true, process: true }),
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/broadcasting': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
