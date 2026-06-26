import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 需要仓库路径前缀，本地开发用相对路径 './'
  base: process.env.VITE_BASE || './',
  server: {
    port: 3000,
    host: true,
    proxy: {
      // 开发环境 API 代理到后端服务
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
  build: {
    // 生产构建输出到 dist/，后端直接 serve
    outDir: 'dist',
  },
})
