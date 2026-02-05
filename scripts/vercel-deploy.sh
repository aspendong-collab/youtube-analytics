#!/bin/bash

# Vercel 快速部署脚本
# 用于手动触发部署到 Vercel

set -e

echo "🚀 Vercel 快速部署脚本"
echo "========================"
echo ""

# 检查是否已安装 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装"
    echo ""
    echo "正在安装 Vercel CLI..."
    npm install -g vercel
    echo "✅ Vercel CLI 安装完成"
    echo ""
fi

# 检查是否已登录
if ! vercel whoami &> /dev/null; then
    echo "🔐 需要登录 Vercel"
    echo ""
    vercel login
    echo ""
fi

# 显示当前项目信息
echo "📊 当前项目信息："
echo "  - 仓库：$(git config --get remote.origin.url | sed 's/.*github.com\///' | sed 's/\.git$//')"
echo "  - 分支：$(git branch --show-current)"
echo "  - 最新提交：$(git log -1 --oneline)"
echo ""

# 询问部署类型
echo "请选择部署类型："
echo "  1) 预览部署 (Preview)"
echo "  2) 生产部署 (Production)"
echo ""
read -p "请输入选项 [1/2]: " deploy_type

if [ "$deploy_type" = "2" ]; then
    echo ""
    echo "🚀 正在部署到生产环境..."
    echo ""
    vercel --prod
else
    echo ""
    echo "🔍 正在部署到预览环境..."
    echo ""
    vercel
fi

echo ""
echo "✅ 部署完成！"
echo ""
echo "📋 下一步："
echo "  1. 访问 Vercel 控制台查看部署状态：https://vercel.com"
echo "  2. 检查部署日志确认构建成功"
echo "  3. 访问部署的 URL 验证功能"
