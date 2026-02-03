#!/bin/bash

echo "=========================================="
echo "部署检查脚本"
echo "=========================================="
echo ""

echo "1. 检查本地环境变量..."
if [ -z "$PGDATABASE_URL" ]; then
    echo "❌ PGDATABASE_URL 环境变量未设置"
    echo ""
    echo "请在 Vercel 项目设置中配置以下环境变量："
    echo "  - PGDATABASE_URL: PostgreSQL 数据库连接字符串"
    echo ""
else
    echo "✅ PGDATABASE_URL 已设置"
    echo "   前缀: ${PGDATABASE_URL:0:20}..."
fi

echo ""
echo "2. 检查 NextAuth 环境变量..."
if [ -z "$NEXTAUTH_URL" ]; then
    echo "❌ NEXTAUTH_URL 环境变量未设置"
else
    echo "✅ NEXTAUTH_URL: $NEXTAUTH_URL"
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "⚠️  NEXTAUTH_SECRET 环境变量未设置（将使用默认值）"
else
    echo "✅ NEXTAUTH_SECRET 已设置"
fi

echo ""
echo "3. 检查数据库连接..."
if [ -n "$PGDATABASE_URL" ]; then
    # 测试数据库连接
    if command -v psql &> /dev/null; then
        psql "$PGDATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "✅ 数据库连接成功"
        else
            echo "❌ 数据库连接失败"
        fi
    else
        echo "⚠️  未安装 psql，跳过数据库连接测试"
    fi
else
    echo "❌ 无法测试数据库连接（PGDATABASE_URL 未设置）"
fi

echo ""
echo "4. 检查 API 路由..."
echo "测试: GET /api/owners"
curl -s http://localhost:5000/api/owners > /tmp/api_test.json 2>&1
if [ $? -eq 0 ]; then
    echo "✅ API 响应成功"
    echo "   响应: $(cat /tmp/api_test.json)"
else
    echo "❌ API 请求失败"
    echo "   响应: $(cat /tmp/api_test.json)"
fi

echo ""
echo "=========================================="
echo "检查完成"
echo "=========================================="
