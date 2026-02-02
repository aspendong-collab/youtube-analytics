#!/bin/bash

# Vercel 部署测试脚本
# 使用方法: ./test-deployment.sh [部署URL]
# 示例: ./test-deployment.sh https://your-project.vercel.app

set -e

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查参数
if [ -z "$1" ]; then
    echo -e "${RED}错误: 请提供部署 URL${NC}"
    echo "使用方法: ./test-deployment.sh [部署URL]"
    echo "示例: ./test-deployment.sh https://your-project.vercel.app"
    exit 1
fi

DEPLOY_URL=$1

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}开始测试 Vercel 部署${NC}"
echo -e "${GREEN}部署 URL: $DEPLOY_URL${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 测试计数器
TOTAL=0
PASSED=0
FAILED=0

# 测试函数
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    TOTAL=$((TOTAL + 1))
    echo -n "测试 $TOTAL: $name ... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10)
    
    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ 通过${NC} (HTTP $response)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ 失败${NC} (HTTP $response, 期望 $expected_status)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# 测试函数（返回 JSON 数据）
test_api() {
    local name=$1
    local url=$2
    local expected_field=${3:-data}
    
    TOTAL=$((TOTAL + 1))
    echo -n "测试 $TOTAL: $name ... "
    
    response=$(curl -s "$url" --max-time 10)
    
    if echo "$response" | jq -e ".${expected_field}" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 通过${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ 失败${NC}"
        echo "响应: $response"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo -e "${YELLOW}1. 测试基础页面${NC}"
test_endpoint "首页" "$DEPLOY_URL/" 200
test_endpoint "视频管理" "$DEPLOY_URL/videos" 200
test_endpoint "数据分析" "$DEPLOY_URL/analysis" 200
test_endpoint "优化建议" "$DEPLOY_URL/suggestions" 200
test_endpoint "热点趋势" "$DEPLOY_URL/trends" 200
test_endpoint "设置管理" "$DEPLOY_URL/settings" 200

echo ""
echo -e "${YELLOW}2. 测试 API 端点${NC}"
test_api "视频列表" "$DEPLOY_URL/api/videos" "videos"
test_api "博主列表" "$DEPLOY_URL/api/channels" "channels"
test_api "统计数据" "$DEPLOY_URL/api/stats" "totalViews"

echo ""
echo -e "${YELLOW}3. 测试优化建议 API${NC}"
test_api "发布时间分析" "$DEPLOY_URL/api/suggestions/publish-time" "heatmap"

echo ""
echo -e "${YELLOW}4. 测试 YouTube API 集成${NC}"
test_endpoint "视频信息 API" "$DEPLOY_URL/api/video-info?videoId=dQw4w9WgXcQ" 200

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}测试完成${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "总计: $TOTAL"
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试通过！部署成功！${NC}"
    exit 0
else
    echo -e "${RED}✗ 有 $FAILED 个测试失败，请检查日志${NC}"
    exit 1
fi
