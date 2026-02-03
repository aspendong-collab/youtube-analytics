#!/bin/bash

# ✅ 部署验证脚本
# 此脚本帮助验证部署是否成功

echo "🔍 开始验证部署..."
echo ""

# 获取部署 URL（需要用户输入）
read -p "请输入你的应用 URL (例如: https://youtube-analytics.vercel.app): " APP_URL

if [ -z "$APP_URL" ]; then
    echo "❌ 应用 URL 不能为空"
    exit 1
fi

# 移除末尾的斜杠
APP_URL=${APP_URL%/}

echo ""
echo "📊 验证应用: $APP_URL"
echo ""

# 验证计数器
PASS=0
FAIL=0

# 验证函数
verify() {
    local name="$1"
    local url="$2"
    local expected_code="$3"

    echo -n "验证 $name... "

    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")

    if [ "$response" = "$expected_code" ]; then
        echo "✅ PASS ($response)"
        ((PASS++))
    else
        echo "❌ FAIL (预期: $expected_code, 实际: $response)"
        ((FAIL++))
    fi
}

# 验证清单
echo "📋 验证清单:"
echo ""

# 1. 验证主页
verify "主页" "$APP_URL/" "200"

# 2. 验证登录页面
verify "登录页面" "$APP_URL/login" "200"

# 3. 验证注册页面
verify "注册页面" "$APP_URL/register" "200"

# 4. 验证数据总览
verify "数据总览" "$APP_URL/overview" "302"  # 需要登录，返回 302 重定向

# 5. 验证热门排行榜
verify "热门排行榜" "$APP_URL/trending/ranking" "302"  # 需要登录，返回 302 重定向

# 6. 验证全平台达人发现
verify "全平台达人发现" "$APP_URL/discovery/enhanced" "302"  # 需要登录，返回 302 重定向

# 7. 验证达人管理
verify "达人管理" "$APP_URL/influencers" "302"  # 需要登录，返回 302 重定向

# 8. 验证内容分析
verify "内容分析" "$APP_URL/content-analysis" "302"  # 需要登录，返回 302 重定向

echo ""
echo "🎯 API 接口验证:"
echo ""

# 9. 验证 NextAuth
echo -n "验证 NextAuth API... "
response=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/auth/session")
if [ "$response" = "200" ]; then
    echo "✅ PASS ($response)"
    ((PASS++))
else
    echo "❌ FAIL (预期: 200, 实际: $response)"
    ((FAIL++))
fi

echo ""
echo "📊 验证结果:"
echo ""
echo "   ✅ 通过: $PASS"
echo "   ❌ 失败: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "🎉 所有验证通过！部署成功！"
    echo ""
    echo "📝 下一步:"
    echo "   1. 访问应用并登录"
    echo "   2. 测试热门排行榜功能"
    echo "   3. 按照 TRENDING_RANKING_TEST_GUIDE.md 进行完整测试"
    echo ""
else
    echo "⚠️  发现 $FAIL 个问题，请检查："
    echo "   1. 环境变量是否配置正确"
    echo "   2. 部署日志是否有错误"
    echo "   3. 使用 'vercel logs' 查看详细信息"
    echo ""
    exit 1
fi
