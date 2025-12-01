import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    // Use a relative base path to ensure assets load correctly if not at domain root
    base: './', 
    define: {
      // This ensures 'process.env.API_KEY' works in the browser code
      // We default to '' if undefined to prevent "undefined" string injection
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      // define 'process.env' as an object to prevent crashes in third-party libs
      'process.env': JSON.stringify({}),
    },
    build: {
      target: 'esnext',
      outDir: 'dist',
    }
  }
})