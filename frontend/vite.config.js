import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  build: {
    // The only chunk above Vite's 500 kB default is the PDF generator (jsPDF + html2canvas),
    // which is loaded on demand when a ticket is downloaded or emailed, never on page load.
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        // Long-lived vendor chunks: they stay cached across app releases
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion']
        }
      }
    }
  }
});
