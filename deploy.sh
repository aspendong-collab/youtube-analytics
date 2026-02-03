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
#!/bin/bash

# 自动化部署脚本
# 使用方法：./deploy.sh <VERCEL_TOKEN>

set -e

echo "=========================================="
echo "YouTube Analytics - 自动化部署脚本"
echo "=========================================="
echo ""

# 检查 Vercel Token
if [ -z "$1" ]; then
    echo "❌ 错误：缺少 Vercel Token"
    echo ""
    echo "使用方法："
    echo "  ./deploy.sh <VERCEL_TOKEN>"
    echo ""
    echo "获取 Vercel Token："
    echo "  1. 访问 https://vercel.com/account/tokens"
    echo "  2. 点击 'Create Token'"
    echo "  3. 设置 Token 名称并复制 Token"
    echo ""
    exit 1
fi

VERCEL_TOKEN=$1

echo "✓ Vercel Token 已提供"
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

# 检查项目是否存在
echo "检查 Vercel 项目..."
PROJECT_INFO=$(vercel ls 2>&1 || echo "")

if echo "$PROJECT_INFO" | grep -q "youtube-analytics"; then
    echo "✓ 项目已存在"
    echo ""
else
    echo "项目不存在，正在创建..."
    vercel link --yes || {
        echo "❌ 创建项目失败"
        exit 1
    }
    echo "✓ 项目创建成功"
    echo ""
fi

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

# 部署到生产环境
echo "部署到生产环境..."
vercel --prod --token="${VERCEL_TOKEN}" || {
    echo "❌ 部署失败"
    exit 1
}
echo ""

echo "=========================================="
echo "✅ 部署成功！"
echo "=========================================="
echo ""
echo "下一步："
echo "  1. 访问 Vercel 控制台配置环境变量"
echo "  2. 访问 https://vercel.com/[your-username]/youtube-analytics"
echo "  3. 在 'Settings' -> 'Environment Variables' 中添加："
echo ""
echo "     PGDATABASE_URL=你的数据库连接字符串"
echo "     YOUTUBE_API_KEY=你的YouTube API Key"
echo "     NEXTAUTH_SECRET=随机生成的密钥"
echo ""
echo "  4. 重新部署项目："
echo "     vercel --prod --token=<VERCEL_TOKEN>"
echo ""
