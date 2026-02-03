#!/bin/bash

# 🚀 Vercel 部署自动化脚本
# 此脚本帮助你在本地触发 Vercel 部署

set -e

echo "🚀 开始 Vercel 部署流程..."
echo ""

# 检查是否已安装 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装"
    echo "正在安装 Vercel CLI..."
    npm install -g vercel
fi

echo "✅ Vercel CLI 已安装"
echo ""

# 检查是否已登录
if ! vercel whoami &> /dev/null; then
    echo "🔐 需要登录 Vercel..."
    vercel login
fi

echo "✅ 已登录 Vercel"
echo ""

# 显示当前状态
echo "📊 当前状态:"
echo "   - 最新提交: $(git log -1 --pretty=format:'%h - %s')"
echo "   - 分支: $(git branch --show-current)"
echo "   - 远程仓库: $(git remote get-url origin)"
echo ""

# 确认部署
echo "⚠️  即将部署到 Vercel"
read -p "确认部署? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 取消部署"
    exit 0
fi

echo ""
echo "🔨 开始部署..."
echo ""

# 部署到 Vercel
vercel --prod

echo ""
echo "✅ 部署完成！"
echo ""
echo "📝 部署后测试步骤："
echo "   1. 访问应用 URL"
echo "   2. 测试登录功能"
echo "   3. 测试全平台达人发现功能"
echo "   4. 测试热门排行榜功能（包括缓存）"
echo "   5. 按照 TRENDING_RANKING_TEST_GUIDE.md 进行完整测试"
echo ""
echo "📚 相关文档："
echo "   - VERCEL_DEPLOYMENT_COMPLETE_GUIDE.md - 完整部署指南"
echo "   - TRENDING_RANKING_TEST_GUIDE.md - 测试指南"
echo "   - TRENDING_CACHE_OPTIMIZATION.md - 缓存优化说明"
echo ""
echo "🎉 部署成功！"
