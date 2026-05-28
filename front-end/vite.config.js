import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

export default defineConfig(({ mode }) => {
  const rootDir = path.dirname(fileURLToPath(import.meta.url))
  const env = loadEnv(mode, process.cwd(), '')
  const useHttps = env.VITE_HTTPS === 'true'
  const host = env.VITE_HOST || (useHttps ? '0.0.0.0' : '127.0.0.1')
  const port = Number(env.VITE_PORT || 5173)
  const publicHost = env.VITE_PUBLIC_HOST || env.VITE_HMR_HOST || ''
  const publicProtocol = env.VITE_PUBLIC_PROTOCOL || (useHttps ? 'https' : 'http')
  const hmrProtocol = env.VITE_HMR_PROTOCOL || (useHttps ? 'wss' : 'ws')
  const hmrHost = env.VITE_HMR_HOST || publicHost || undefined
  const hmrClientPort = Number(env.VITE_HMR_CLIENT_PORT || env.VITE_HMR_PORT || port)

  let httpsConfig = false
  if (useHttps) {
    const certPath = path.resolve(process.cwd(), env.VITE_SSL_CERT || '.ssl/cert.pem')
    const keyPath  = path.resolve(process.cwd(), env.VITE_SSL_KEY  || '.ssl/key.pem')
    try {
      httpsConfig = { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }
      console.log(`[vite] HTTPS enabled, cert: ${certPath}`)
    } catch (e) {
      console.error(`[vite] SSL cert/key not found (${e.message}), HTTPS disabled`)
    }
  }

  return {
    plugins: [vue(), UnoCSS()],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, 'src'),
        '#': path.resolve(rootDir, 'src/pages'),
      },
    },
    server: {
      host,
      port,
      strictPort: true,
      https: httpsConfig,
      origin: publicHost ? `${publicProtocol}://${publicHost}:${port}` : undefined,
      hmr: hmrHost
        ? {
            protocol: hmrProtocol,
            host: hmrHost,
            clientPort: hmrClientPort,
          }
        : undefined,
      proxy: {
        '/api/ws': {
          target: 'ws://127.0.0.1:3000',
          ws: true,
          changeOrigin: true,
        },
        '/api': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
        },
      },
    },
  }
})
