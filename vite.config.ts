import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Prevents "process is not defined" error in browser
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      // Shim process.env for other usages if necessary
      'process.env': {}
    }
  };
});