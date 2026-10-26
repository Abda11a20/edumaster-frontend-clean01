import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const backendUrl = env.VITE_BACKEND_URL || 'https://edu-master-delta.vercel.app';

  const apiRoutes = ['/auth', '/user', '/lesson', '/exam', '/question', '/admin', '/studentExam'];

  const proxyConfig = Object.fromEntries(
    apiRoutes.map((route) => [
      route === '/admin'
        ? '^/admin(?!/questions(?:/|\\?|$))(?:/|\\?|$)'
        : `^${route}(?:/|\\?|$)`,
      {
        target: backendUrl,
        changeOrigin: true,
        secure: true,
      },
    ])
  );

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: proxyConfig,
    },
  };
});

