#!/bin/bash
# Kali Command Center 启动脚本

echo "================================================"
echo "  🔥 Kali Command Center 启动器"
echo "================================================"
echo ""

# 检查Python3
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 Python3"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
pip3 install -r requirements.txt > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✓ 依赖安装完成"
else
    echo "⚠ 依赖可能已安装或安装时出现警告，继续..."
fi

echo ""
echo "================================================"
echo ""
echo "🚀 正在启动服务..."
echo ""

# 启动应用
python3 app.py
