#!/bin/bash

# YouTube API Key 自动配置脚本
# 从 Vercel 拉取环境变量到本地

echo "========================================"
echo "YouTube API Key 自动配置"
echo "========================================"
echo ""

# 检查是否已安装 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装"
    echo "正在安装 Vercel CLI..."
    pnpm add -D vercel@latest

    if [ $? -ne 0 ]; then
        echo "❌ Vercel CLI 安装失败"
        exit 1
    fi

    echo "✅ Vercel CLI 安装成功"
    echo ""
fi

# 检查是否已登录
echo "检查 Vercel 登录状态..."
if ! vercel whoami &> /dev/null; then
    echo "❌ 未登录 Vercel"
    echo "请运行以下命令登录："
    echo "  vercel login"
    echo ""
    echo "登录后，再次运行此脚本"
    exit 1
fi

echo "✅ 已登录 Vercel"
echo ""

# 拉取环境变量
echo "正在从 Vercel 拉取环境变量..."
vercel env pull .env.local

if [ $? -ne 0 ]; then
    echo "❌ 拉取环境变量失败"
    exit 1
fi

echo "✅ 环境变量拉取成功"
echo ""

# 检查 YouTube API Key 配置
echo "检查 YouTube API Key 配置..."
echo ""

if grep -q "YOUTUBE_API_KEY_" .env.local; then
    echo "✅ 检测到 YouTube API Key 配置"
    echo ""
    echo "已配置的 Key："
    grep "^YOUTUBE_API_KEY_" .env.local | nl -w2 -s'. '
    echo ""
    KEY_COUNT=$(grep -c "^YOUTUBE_API_KEY_" .env.local)
    echo "共配置 $KEY_COUNT 个 Key"
else
    echo "❌ 未检测到 YouTube API Key 配置"
    echo ""
    echo "请检查 Vercel Dashboard 中的环境变量配置"
    echo "访问：https://vercel.com/dashboard"
fi

echo ""
echo "========================================"
echo "配置完成"
echo "========================================"
echo ""
echo "下一步："
echo "  1. 重启开发服务器：pnpm dev"
echo "  2. 访问：http://localhost:5000/api/check-env-youtube"
echo "  3. 验证配置是否正确"
echo ""
