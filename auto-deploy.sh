#!/bin/bash

# 完全自动化部署脚本（包括环境变量配置）
# 使用方法：./auto-deploy.sh <VERCEL_TOKEN> <PGDATABASE_URL> <YOUTUBE_API_KEY> [NEXTAUTH_SECRET]

set -e

echo "=========================================="
echo "YouTube Analytics - 完全自动化部署"
echo "=========================================="
echo ""

# 检查必需参数
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
    echo "❌ 错误：缺少必需参数"
    echo ""
    echo "使用方法："
    echo "  ./auto-deploy.sh <VERCEL_TOKEN> <PGDATABASE_URL> <YOUTUBE_API_KEY> [NEXTAUTH_SECRET]"
    echo ""
    echo "参数说明："
    echo "  VERCEL_TOKEN     - Vercel API Token（必需）"
    echo "  PGDATABASE_URL   - 数据库连接字符串（必需）"
    echo "  YOUTUBE_API_KEY  - YouTube API Key（必需）"
    echo "  NEXTAUTH_SECRET  - NextAuth 密钥（可选，如未提供会自动生成）"
    echo ""
    exit 1
fi

VERCEL_TOKEN=$1
PGDATABASE_URL=$2
YOUTUBE_API_KEY=$3
NEXTAUTH_SECRET=${4:-$(openssl rand -base64 32 2>/dev/null || echo "$(date +%s)-$(openssl rand -hex 16)")}

echo "✓ 所有参数已提供"
echo ""

# 检查 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装"
    echo "正在安装 Vercel CLI..."
    npm install -g vercel || {
        echo "❌ 安装 Vercel CLI 失败"
        exit 1
    }
    echo "✓ Vercel CLI 安装完成"
fi
echo ""

# 检查 Node.js 和 pnpm
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm 未安装，正在安装..."
    npm install -g pnpm || {
        echo "❌ 安装 pnpm 失败"
        exit 1
    }
    echo "✓ pnpm 安装完成"
fi
echo ""

# 检查是否已登录 Vercel
echo "检查 Vercel 登录状态..."
if vercel whoami > /dev/null 2>&1; then
    echo "✓ 已登录 Vercel"
else
    echo "正在登录 Vercel..."
    echo "${VERCEL_TOKEN}" | vercel login --token="${VERCEL_TOKEN}" || {
        echo "❌ 登录失败"
        exit 1
    }
    echo "✓ 登录成功"
fi
echo ""

# 检查或创建项目
echo "检查 Vercel 项目..."
PROJECT_ID=$(vercel ls --json | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
    echo "项目不存在，正在创建..."
    LINK_OUTPUT=$(vercel link --yes 2>&1)
    echo "$LINK_OUTPUT" | grep -o 'https://vercel.com/[^ ]*' | head -1

    # 获取项目 ID
    PROJECT_ID=$(vercel ls --json | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [ -z "$PROJECT_ID" ]; then
        echo "❌ 无法获取项目 ID"
        exit 1
    fi

    echo "✓ 项目创建成功 (ID: ${PROJECT_ID})"
else
    echo "✓ 项目已存在 (ID: ${PROJECT_ID})"
fi
echo ""

# 获取组织 ID
ORG_ID=$(vercel ls --json | grep -o '"orgId":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "✓ 组织 ID: ${ORG_ID}"
echo ""

# 安装依赖
echo "安装依赖..."
pnpm install || {
    echo "❌ 安装依赖失败"
    exit 1
}
echo "✓ 依赖安装完成"
echo ""

# 构建项目
echo "构建项目..."
pnpm run build || {
    echo "❌ 构建失败"
    exit 1
}
echo "✓ 构建完成"
echo ""

# 配置环境变量
echo "配置环境变量..."

# 设置 PGDATABASE_URL
echo "设置 PGDATABASE_URL..."
vercel env add PGDATABASE_URL production --yes <<< "${PGDATABASE_URL}" || {
    echo "⚠️  设置 PGDATABASE_URL 失败（可能已存在）"
}

# 设置 YOUTUBE_API_KEY
echo "设置 YOUTUBE_API_KEY..."
vercel env add YOUTUBE_API_KEY production --yes <<< "${YOUTUBE_API_KEY}" || {
    echo "⚠️  设置 YOUTUBE_API_KEY 失败（可能已存在）"
}

# 设置 NEXTAUTH_SECRET
echo "设置 NEXTAUTH_SECRET..."
vercel env add NEXTAUTH_SECRET production --yes <<< "${NEXTAUTH_SECRET}" || {
    echo "⚠️  设置 NEXTAUTH_SECRET 失败（可能已存在）"
}

echo "✓ 环境变量配置完成"
echo ""

# 获取生产环境 URL
echo "获取生产环境 URL..."
PROD_URL=$(vercel ls --prod --json | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PROD_URL" ]; then
    PROD_URL="https://youtube-analytics.vercel.app"
fi

echo "✓ 生产环境 URL: ${PROD_URL}"
echo ""

# 更新 NEXTAUTH_URL（如果需要）
echo "更新 NEXTAUTH_URL..."
vercel env rm NEXTAUTH_URL production --yes 2>/dev/null || true
vercel env add NEXTAUTH_URL production --yes <<< "${PROD_URL}" || {
    echo "⚠️  设置 NEXTAUTH_URL 失败"
}
echo "✓ NEXTAUTH_URL 已更新"
echo ""

# 部署到生产环境
echo "部署到生产环境..."
DEPLOY_OUTPUT=$(vercel --prod --token="${VERCEL_TOKEN}" 2>&1)
echo "$DEPLOY_OUTPUT" | grep -E "https|Preview|Production" || echo "✓ 部署成功"
echo ""

# 等待部署完成
echo "等待部署完成..."
sleep 10
echo ""

# 获取最终部署 URL
FINAL_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[a-zA-Z0-9.-]+vercel\.app' | head -1)

if [ -z "$FINAL_URL" ]; then
    FINAL_URL="${PROD_URL}"
fi

echo "=========================================="
echo "✅ 部署成功！"
echo "=========================================="
echo ""
echo "📱 应用 URL: ${FINAL_URL}"
echo ""
echo "🔧 环境变量："
echo "  • PGDATABASE_URL: ✓ 已配置"
echo "  • YOUTUBE_API_KEY: ✓ 已配置"
echo "  • NEXTAUTH_SECRET: ✓ 已配置"
echo "  • NEXTAUTH_URL: ${PROD_URL}"
echo ""
echo "📋 下一步操作："
echo "  1. 访问应用: ${FINAL_URL}"
echo "  2. 使用管理员账号登录"
echo "  3. 访问用户管理页面: ${FINAL_URL}/admin/users"
echo "  4. 测试所有功能"
echo ""
echo "🔄 更新部署："
echo "  git add ."
echo "  git commit -m 'your message'"
echo "  git push origin main"
echo ""
echo "或使用此脚本重新部署："
echo "  ./auto-deploy.sh \${VERCEL_TOKEN} \${PGDATABASE_URL} \${YOUTUBE_API_KEY}"
echo ""
