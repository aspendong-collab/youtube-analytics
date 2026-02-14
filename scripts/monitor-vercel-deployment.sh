#!/bin/bash

# Vercel 部署状态监控脚本

echo "========================================"
echo "Vercel 部署状态监控"
echo "========================================"
echo ""

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI 未安装"
    echo ""
    echo "监控方式 1：访问 Vercel Dashboard"
    echo "  URL: https://vercel.com/dashboard/aspendong-collab/youtube-analytics"
    echo ""
    echo "监控方式 2：访问部署页面"
    echo "  URL: https://vercel.com/aspendong-collab/youtube-analytics/deployments"
    echo ""
    exit 0
fi

echo "✅ 检测到 Vercel CLI"
echo ""

# 检查登录状态
if ! vercel whoami &> /dev/null; then
    echo "⚠️  未登录 Vercel，请运行: vercel login"
    exit 1
fi

echo "获取最新部署信息..."
echo ""

# 获取部署列表
vercel ls --scope aspendong-collab 2>&1 | head -20

echo ""
echo "========================================"
echo "详细部署信息"
echo "========================================"
echo ""

# 获取最新部署详情
vercel inspect --scope aspendong-collab 2>&1 || echo "获取详细信息失败"

echo ""
echo "========================================"
echo "访问链接"
echo "========================================"
echo ""
echo "📊 Dashboard:"
echo "  https://vercel.com/dashboard/aspendong-collab/youtube-analytics"
echo ""
echo "🚀 部署列表:"
echo "  https://vercel.com/aspendong-collab/youtube-analytics/deployments"
echo ""
echo "🌐 应用访问:"
echo "  https://youtube-analytics-opal.vercel.app"
echo ""
