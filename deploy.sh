#!/bin/bash
# ============================================================
# 亮品牌 · 一键部署脚本
# 适用：Ubuntu/Debian/CentOS 等 Linux 服务器
# 使用方法: bash deploy.sh
# ============================================================

set -e

echo ""
echo "  ✦ 亮品牌 · 一键部署脚本"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，正在安装..."
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
    echo "✅ Docker 安装完成"
fi

# 检查 Docker Compose
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose 未安装"
    exit 1
fi

# 创建 .env 文件（如果不存在）
if [ ! -f .env ]; then
    cp .env.example .env
    # 生成随机 JWT_SECRET
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | xxd -p | head -c 64)
    sed -i.bak "s/change-me-in-production-please/$JWT_SECRET/" .env
    rm -f .env.bak
    echo "✅ 已创建 .env 配置文件（JWT密钥已自动生成）"
fi

# 构建并启动
echo ""
echo "🔨 开始构建..."
docker compose build --no-cache

echo ""
echo "🚀 启动服务..."
docker compose up -d

# 等待服务启动
echo ""
echo "⏳ 等待服务启动..."
sleep 5

# 健康检查
for i in 1 2 3 4 5; do
    if curl -s http://localhost:${PORT:-3001}/api/health > /dev/null 2>&1; then
        echo ""
        echo "  ✦ 亮品牌 · 部署成功！"
        echo "  ━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "  🌐 访问地址:  http://$(hostname -I | awk '{print $1}' 2>/dev/null || echo 'localhost'):${PORT:-3001}"
        echo "  📊 API 地址:   http://$(hostname -I | awk '{print $1}' 2>/dev/null || echo 'localhost'):${PORT:-3001}/api"
        echo "  🔑 默认账号:   admin / admin123"
        echo ""
        echo "  ⚠️  重要提示："
        echo "     1. 首次登录后请立即修改默认密码"
        echo "     2. 生产环境请修改 .env 中的 JWT_SECRET"
        echo "     3. 建议配置 Nginx 反向代理 + HTTPS"
        echo ""
        echo "  📋 常用命令："
        echo "     docker compose logs -f    # 查看日志"
        echo "     docker compose restart    # 重启服务"
        echo "     docker compose down       # 停止服务"
        echo "     docker compose up -d      # 启动服务"
        echo ""
        exit 0
    fi
    sleep 3
done

echo "⚠️ 服务启动超时，请检查日志：docker compose logs"
exit 1
