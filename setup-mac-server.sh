#!/bin/bash
# ============================================================
# 亮品牌 · Mac 服务器配置脚本
# 功能：防止休眠 + 开机自动启动 Docker 容器
# 使用方法: sudo bash setup-mac-server.sh
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo -e "\033[0;36m  ✦ 亮品牌 · Mac 服务器配置\033[0m"
echo -e "\033[0;36m  ━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
echo ""

# 检查 sudo 权限
if [ "$EUID" -ne 0 ]; then
    echo -e "\033[1;33m⚠️  需要管理员权限，请输入密码\033[0m"
    echo ""
    # 重新以 sudo 执行
    exec sudo bash "$0" "$@"
fi

echo "━━━ 第 1 步：防止 Mac 自动休眠 ━━━"
echo ""

# 设置显示器不休眠
pmset -c displaysleep 0
# 设置系统不休眠
pmset -c sleep 0
# 设置硬盘不休眠
pmset -c disksleep 0
# 设置唤醒后自动恢复
pmset -c autorestart 1
# 网络唤醒
pmset -c womp 1

echo -e "\033[0;32m✅ 休眠设置完成（仅电源接通时生效）\033[0m"
echo "   - 显示器：永不休眠"
echo "   - 系统：永不休眠"
echo "   - 硬盘：永不休眠"
echo "   - 断电恢复后：自动重启"
echo ""

echo "━━━ 第 2 步：开机自动启动 Docker 容器 ━━━"
echo ""

# 创建 LaunchAgent plist（开机后 Docker Desktop 启动完成后自动运行容器）
LAUNCH_AGENT="/Library/LaunchDaemons/com.liangbrand.server.plist"

cat > "$LAUNCH_AGENT" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.liangbrand.server</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/docker</string>
        <string>compose</string>
        <string>-f</string>
        <string>${SCRIPT_DIR}/docker-compose.local.yml</string>
        <string>up</string>
        <string>-d</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>${SCRIPT_DIR}</string>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>StartInterval</key>
    <integer>300</integer>
    
    <key>StandardOutPath</key>
    <string>${SCRIPT_DIR}/data/docker-launch.log</string>
    
    <key>StandardErrorPath</key>
    <string>${SCRIPT_DIR}/data/docker-launch-error.log</string>
</dict>
</plist>
EOF

chmod 644 "$LAUNCH_AGENT"
launchctl load "$LAUNCH_AGENT" 2>/dev/null || true

echo -e "\033[0;32m✅ 开机自启配置完成\033[0m"
echo "   - Docker Desktop 启动后会自动运行亮品牌容器"
echo "   - 每 5 分钟检查一次，如容器停止则自动拉起"
echo ""

echo "━━━ 第 3 步：配置 Docker Desktop 开机自启 ━━━"
echo ""

# Docker Desktop 的开机自启通常在应用内设置
# 这里创建一个 LaunchAgent 确保用户登录后启动 Docker Desktop
DOCKER_LAUNCH="/Library/LaunchAgents/com.docker.docker.plist"

if [ ! -f "$DOCKER_LAUNCH" ]; then
    # 检查 Docker Desktop 安装路径
    DOCKER_APP="/Applications/Docker.app"
    if [ -d "$DOCKER_APP" ]; then
        cat > "$DOCKER_LAUNCH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.docker.docker</string>
    <key>ProgramArguments</key>
    <array>
        <string>open</string>
        <string>-a</string>
        <string>Docker</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
EOF
        chmod 644 "$DOCKER_LAUNCH"
        launchctl load "$DOCKER_LAUNCH" 2>/dev/null || true
        echo -e "\033[0;32m✅ Docker Desktop 已设为开机自启\033[0m"
    else
        echo -e "\033[1;33m⚠️  Docker Desktop 未安装，跳过\033[0m"
    fi
else
    echo -e "\033[0;32m✅ Docker Desktop 开机自启已配置\033[0m"
fi

echo ""
echo -e "\033[0;36m  ✦ 配置完成！\033[0m"
echo -e "\033[0;36m  ━━━━━━━━━━━━━\033[0m"
echo ""
echo -e "  📋 当前电源设置："
pmset -c | grep -E "sleep|displaysleep|disksleep|autorestart|womp" | while read line; do
    echo "     $line"
done
echo ""
echo -e "  📋 自启服务状态："
if [ -f "$LAUNCH_AGENT" ]; then
    echo -e "     亮品牌容器: \033[0;32m已启用\033[0m ($LAUNCH_AGENT)"
fi
if [ -f "$DOCKER_LAUNCH" ]; then
    echo -e "     Docker Desktop: \033[0;32m已启用\033[0m"
fi
echo ""
echo -e "  \033[1;33m⚠️  注意事项：\033[0m"
echo "     1. 以上设置在电源接通时生效（电池模式仍会休眠以省电）"
echo "     2. 建议在系统设置中将「电池」模式也设为不休眠"
echo "     3. 关闭自启: sudo launchctl unload $LAUNCH_AGENT"
echo ""
