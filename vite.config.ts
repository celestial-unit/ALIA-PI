import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  // Support both VITE_GEMINI_API_KEY and legacy GEMINI_API_KEY
  const geminiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';
  return {
    base: '/',
    plugins: [react(), tailwindcss()],
    define: {
      // Expose as process.env.GEMINI_API_KEY for existing service files
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          test3d: path.resolve(__dirname, 'test-3d.html'),
        },
        output: {
          manualChunks: {
            three: ['three', '@react-three/fiber', '@react-three/drei'],
            motion: ['framer-motion'],
            daily: ['@daily-co/daily-js'],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
