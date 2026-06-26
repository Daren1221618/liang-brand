#!/bin/bash
# ============================================================
# 亮品牌 · 本机一键部署脚本
# 使用方法: bash start-local.sh
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}  ✦ 亮品牌 · 本机部署${NC}"
echo -e "${CYAN}  ━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 1. 检查 Docker
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker 未运行${NC}"
    echo ""
    echo "请先安装并启动 Docker Desktop："
    echo "  1. 访问 https://www.docker.com/products/docker-desktop/"
    echo "  2. 下载 Mac 版（Apple Silicon 或 Intel）"
    echo "  3. 安装后打开 Docker Desktop，等待状态变为 Running"
    echo "  4. 重新运行此脚本"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Docker 运行正常${NC}"

# 2. 检查 .env.production
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}⚠️  .env.production 不存在，正在创建...${NC}"
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | xxd -p | head -c 64)
    cat > .env.production <<EOF
# 亮品牌 · 本机生产环境配置
PORT=3001
NODE_ENV=production
JWT_SECRET=${JWT_SECRET}
DATA_DIR=/app/data
UPLOAD_DIR=/app/data/uploads

# DeepSeek
DEEPSEEK_API_KEY=
DEEPSEEK_ENABLED=false

# 豆包
DOUBAO_API_KEY=
DOUBAO_ENABLED=false

# 通义千问
QWEN_API_KEY=
QWEN_ENABLED=false
EOF
    echo -e "${GREEN}✅ 已创建 .env.production（请编辑填入 AI 模型 API Key）${NC}"
fi

# 3. 确保 data 目录存在
mkdir -p data/uploads
echo -e "${GREEN}✅ 数据目录就绪${NC}"

# 4. 构建并启动
echo ""
echo -e "${YELLOW}🔨 开始构建 Docker 镜像...${NC}"
docker compose -f docker-compose.local.yml build --no-cache 2>&1 | tail -5

echo ""
echo -e "${YELLOW}🚀 启动服务...${NC}"
docker compose -f docker-compose.local.yml up -d

# 5. 等待启动并健康检查
echo ""
echo -e "${YELLOW}⏳ 等待服务启动...${NC}"

for i in $(seq 1 15); do
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        # 获取本机 IP
        LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")
        
        echo ""
        echo -e "${GREEN}  ✦ 亮品牌 · 部署成功！${NC}"
        echo -e "${GREEN}  ━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo -e "  🌐 本机访问:  ${CYAN}http://localhost:3001${NC}"
        echo -e "  🌐 局域网访问:${CYAN} http://${LOCAL_IP}:3001${NC}"
        echo -e "  📊 API 地址:  ${CYAN}http://localhost:3001/api${NC}"
        echo -e "  🔑 默认账号:  ${CYAN}admin / admin123${NC}"
        echo ""
        echo -e "  ${YELLOW}⚠️  提示：${NC}"
        echo "     1. 首次登录后请立即修改默认密码"
        echo "     2. 局域网内其他设备通过上面的 IP 地址访问"
        echo "     3. 数据存储在 ./data 目录（SQLite 数据库 + 上传文件）"
        echo ""
        echo -e "  ${CYAN}📋 常用命令：${NC}"
        echo "     bash start-local.sh          # 重新部署"
        echo "     docker compose -f docker-compose.local.yml logs -f    # 查看日志"
        echo "     docker compose -f docker-compose.local.yml restart    # 重启服务"
        echo "     docker compose -f docker-compose.local.yml down       # 停止服务"
        echo ""
        exit 0
    fi
    sleep 2
    printf "."
done

echo ""
echo -e "${RED}❌ 服务启动超时${NC}"
echo ""
echo "排查步骤："
echo "  1. 查看日志: docker compose -f docker-compose.local.yml logs"
echo "  2. 检查端口: lsof -i :3001"
echo ""
exit 1
