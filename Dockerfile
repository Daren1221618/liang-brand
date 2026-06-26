# ============================================================
# 亮品牌 · 生产环境 Dockerfile（优化版）
# 多阶段构建：前端构建 + 后端运行
# ============================================================

# Stage 1: 依赖安装
FROM node:20-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

# Stage 2: 前端构建
FROM deps AS frontend-builder

COPY . .
RUN npx vite build

# Stage 3: 生产运行（最小镜像）
FROM node:20-alpine

WORKDIR /app

# 复制全部依赖（tsx 在 devDependencies 但生产运行时需要）
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

# 复制构建产物
COPY --from=frontend-builder /app/dist ./dist
COPY --from=frontend-builder /app/server ./server
COPY --from=frontend-builder /app/tsconfig.json ./

# 数据目录
RUN mkdir -p /app/data/uploads

# 环境
ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/app/data
ENV UPLOAD_DIR=/app/data/uploads

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

CMD ["npx", "tsx", "server/index.ts"]
