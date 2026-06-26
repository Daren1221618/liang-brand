#!/bin/bash
# ============================================================
# 亮品牌 · 防火墙配置脚本
# 允许 Node.js 接受局域网入站连接
# 使用方法: 在终端中执行 bash firewall-fix.sh
# ============================================================

echo ""
echo "  ✦ 亮品牌 · 防火墙配置"
echo "  ━━━━━━━━━━━━━━━━━━━━"
echo ""

NODE_BIN="/Users/a105/.workbuddy/binaries/node/versions/22.12.0/bin/node"

echo "当前状态:"
/usr/libexec/ApplicationFirewall/socketfilterfw --getappblocked "$NODE_BIN" 2>&1
echo ""

echo "正在允许 Node.js 接受入站连接..."
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp "$NODE_BIN" 2>&1
echo ""

echo "验证结果:"
/usr/libexec/ApplicationFirewall/socketfilterfw --getappblocked "$NODE_BIN" 2>&1
echo ""

echo "测试局域网访问..."
sleep 1
if curl -s http://192.168.110.150:3001/api/health > /dev/null 2>&1; then
    echo "✅ 局域网访问正常！"
    echo "   http://192.168.110.150:3001"
else
    echo "⚠️  仍然不通，可能需要："
    echo "   系统设置 → 网络 → 防火墙 → 关闭防火墙"
    echo "   或手动添加 node 到防火墙允许列表"
fi
