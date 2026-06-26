#!/bin/bash
# ============================================================
# 亮品牌 · 本机服务管理脚本
# 使用方法: bash liangbrand.sh [start|stop|restart|status|logs]
# ============================================================

LABEL="com.liangbrand.server"
PORT=3001
SCRIPT="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")

case "$1" in
    start)
        launchctl load ~/Library/LaunchAgents/${LABEL}.plist 2>&1
        sleep 3
        if curl -s http://localhost:${PORT}/api/health > /dev/null 2>&1; then
            echo "✅ 服务已启动"
            echo "   本机访问: http://localhost:${PORT}"
            echo "   局域网:   http://${IP}:${PORT}"
        else
            echo "❌ 启动失败，查看日志: bash $SCRIPT logs"
        fi
        ;;
    stop)
        launchctl unload ~/Library/LaunchAgents/${LABEL}.plist 2>&1
        echo "✅ 服务已停止"
        ;;
    restart)
        "$SCRIPT" stop
        sleep 1
        "$SCRIPT" start
        ;;
    status)
        if curl -s http://localhost:${PORT}/api/health > /dev/null 2>&1; then
            echo "✅ 服务运行中"
            echo "   本机: http://localhost:${PORT}"
            echo "   局域网: http://${IP}:${PORT}"
            PID=$(launchctl list | grep ${LABEL} | awk '{print $1}')
            echo "   PID: ${PID}"
        else
            echo "❌ 服务未运行"
        fi
        ;;
    logs)
        tail -50 /Users/a105/WorkBuddy/Claw/data/server.log 2>/dev/null
        echo ""
        echo "--- 错误日志 ---"
        tail -20 /Users/a105/WorkBuddy/Claw/data/server-error.log 2>/dev/null
        ;;
    *)
        echo ""
        echo "  ✦ 亮品牌 · 服务管理"
        echo "  ━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "  用法: bash liangbrand.sh [命令]"
        echo ""
        echo "  命令:"
        echo "    start    启动服务"
        echo "    stop     停止服务"
        echo "    restart  重启服务"
        echo "    status   查看状态"
        echo "    logs     查看日志"
        echo ""
        ;;
esac
