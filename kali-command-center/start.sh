#!/bin/bash
# Kali Command Center - 快速启动脚本

echo "╔════════════════════════════════════════════════════╗"
echo "║                                                    ║"
echo "║   🔥  Kali Command Center - Web管理界面  🔥       ║"
echo "║                                                    ║"
echo "║   工具版本: v2.0 (GUI + 经典模式)                 ║"
echo "║                                                    ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到Python3"
    exit 1
fi

# 安装依赖
echo "📦 正在检查依赖..."
if ! pip3 show flask > /dev/null 2>&1; then
    echo "   安装Flask..."
    pip3 install flask > /dev/null 2>&1
    echo "   ✅ Flask已安装"
else
    echo "   ✅ Flask已就绪"
fi

echo ""
echo "════════════════════════════════════════════════════"
echo ""

# 获取IP地址
get_ip() {
    case "$(uname -s)" in
        Linux*)
            ip route get 1 | awk '{print $(NF-2); exit}'
            ;;
        Darwin)
            ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
            ;;
        *)
            echo "localhost"
            ;;
    esac
}

IP=$(get_ip)

echo "🚀 正在启动服务..."
echo ""
echo "════════════════════════════════════════════════════"
echo ""

# 启动应用
python3 app.py

# 下面的代码在服务关闭后执行
echo ""
echo "════════════════════════════════════════════════════"
echo ""
echo "👋 服务已停止"
echo ""
