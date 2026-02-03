#!/bin/bash

# YouTube Analytics - Vercel 部署脚本
# 功能：一键部署到 Vercel

set -e

echo "========================================="
echo "YouTube Analytics - Vercel 部署脚本"
echo "========================================="
echo ""

# 检查 Git 状态
echo "📋 检查 Git 状态..."
if ! git diff --quiet; then
    echo "⚠️  检测到未提交的更改"
    echo "📝 正在提交更改..."
    git add .
    git commit -m "feat: 实现基于 YouTube 全平台的达人发现和多维度筛选功能"
    echo "✅ 提交成功"
else
    echo "✅ 工作目录干净，无需提交"
fi
echo ""

# 推送到 GitHub
echo "🚀 推送代码到 GitHub..."
git push origin main
echo "✅ 推送成功"
echo ""

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 Vercel CLI 未安装，正在安装..."
    npm install -g vercel
    echo "✅ 安装成功"
else
    echo "✅ Vercel CLI 已安装"
fi
echo ""

# 询问是否使用 Vercel CLI 部署
echo "========================================="
echo "选择部署方式："
echo "1. 使用 Vercel CLI（需要登录）"
echo "2. 在 Vercel Dashboard 手动部署"
echo "========================================="
read -p "请选择 (1/2): " deploy_choice

if [ "$deploy_choice" = "1" ]; then
    echo ""
    echo "🔐 登录 Vercel..."
    vercel login --prod

    echo ""
    echo "🚀 开始部署..."
    vercel --prod

    echo ""
    echo "✅ 部署成功！"
    echo "📝 请访问 Vercel Dashboard 查看部署详情"
else
    echo ""
    echo "📝 请按照以下步骤手动部署："
    echo ""
    echo "1. 访问 Vercel Dashboard: https://vercel.com/dashboard"
    echo "2. 找到项目: youtube-analytics"
    echo "3. Vercel 会自动检测到新的 commit"
    echo "4. 等待部署完成（2-5 分钟）"
    echo ""
    echo "🔗 访问: https://vercel.com/dashboard"
fi

echo ""
echo "========================================="
echo "部署后测试清单："
echo "========================================="
echo "✅ 访问: https://your-project.vercel.app/discovery/enhanced"
echo "✅ 测试关键词搜索"
echo "✅ 测试热门视频"
echo "✅ 测试筛选功能"
echo "✅ 测试排序功能"
echo ""
echo "📚 详细文档: VERCEL_DEPLOYMENT_GUIDE.md"
echo "========================================="
