#!/bin/bash

# YouTube API Key 验证脚本
# 用于检查 API Key 的配置、权限和配额

API_KEY="AIzaSyBgo5bEiG0dMJ2RKp7I13eL-yk15gFcsjY"

echo "========================================="
echo "YouTube API Key 验证"
echo "========================================="
echo ""
echo "API Key: ${API_KEY:0:10}...${API_KEY: -10}"
echo ""

# 测试 1: 搜索 API
echo "测试 1: 搜索 API (基础搜索)"
echo "----------------------------------------"
URL1="https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=tech&maxResults=1&key=$API_KEY"
echo "请求: $URL1"
echo ""

RESPONSE1=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$URL1")
HTTP_CODE1=$(echo "$RESPONSE1" | grep "HTTP_CODE" | cut -d: -f2)
BODY1=$(echo "$RESPONSE1" | sed '/HTTP_CODE/d')

echo "HTTP 状态码: $HTTP_CODE1"
echo ""

if [ "$HTTP_CODE1" = "200" ]; then
    echo "✅ 搜索 API 正常"
    echo "响应示例:"
    echo "$BODY1" | head -c 300
    echo ""
else
    echo "❌ 搜索 API 失败"
    echo "响应内容:"
    echo "$BODY1"
    echo ""

    # 分析错误
    if echo "$BODY1" | grep -q "403"; then
        echo ""
        echo "🔴 403 错误 - 权限不足或配额问题"
        echo ""
        echo "可能的原因:"
        echo "1. API Key 未启用 YouTube Data API v3"
        echo "2. API Key 的应用限制设置不正确"
        echo "3. API Key 的 API 限制未配置"
        echo "4. 配额已用完"
        echo ""
        echo "解决方案:"
        echo "1. 访问 Google Cloud Console: https://console.cloud.google.com/"
        echo "2. 进入: API 和服务 > 凭证"
        echo "3. 检查 API Key 的设置"
        echo "4. 确保 'YouTube Data API v3' 已启用"
        echo "5. 检查配额使用情况"
    fi
fi

echo ""
echo ""

# 测试 2: 视频 API
echo "测试 2: 视频 API (获取统计数据)"
echo "----------------------------------------"
URL2="https://www.googleapis.com/youtube/v3/videos?part=statistics&id=dQw4w9WgXcQ&key=$API_KEY"
echo "请求: $URL2"
echo ""

RESPONSE2=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$URL2")
HTTP_CODE2=$(echo "$RESPONSE2" | grep "HTTP_CODE" | cut -d: -f2)
BODY2=$(echo "$RESPONSE2" | sed '/HTTP_CODE/d')

echo "HTTP 状态码: $HTTP_CODE2"
echo ""

if [ "$HTTP_CODE2" = "200" ]; then
    echo "✅ 视频 API 正常"
    echo "响应示例:"
    echo "$BODY2" | head -c 200
    echo ""
else
    echo "❌ 视频 API 失败"
    echo "响应内容:"
    echo "$BODY2"
fi

echo ""
echo ""

# 测试 3: 频道 API
echo "测试 3: 频道 API (获取频道统计)"
echo "----------------------------------------"
URL3="https://www.googleapis.com/youtube/v3/channels?part=statistics&id=UC_x5XG1OV2P6uZZ5FSM9Ttw&key=$API_KEY"
echo "请求: $URL3"
echo ""

RESPONSE3=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$URL3")
HTTP_CODE3=$(echo "$RESPONSE3" | grep "HTTP_CODE" | cut -d: -f2)
BODY3=$(echo "$RESPONSE3" | sed '/HTTP_CODE/d')

echo "HTTP 状态码: $HTTP_CODE3"
echo ""

if [ "$HTTP_CODE3" = "200" ]; then
    echo "✅ 频道 API 正常"
    echo "响应示例:"
    echo "$BODY3" | head -c 200
    echo ""
else
    echo "❌ 频道 API 失败"
    echo "响应内容:"
    echo "$BODY3"
fi

echo ""
echo "========================================="
echo "测试完成"
echo "========================================="
echo ""

# 总结
if [ "$HTTP_CODE1" = "200" ] && [ "$HTTP_CODE2" = "200" ] && [ "$HTTP_CODE3" = "200" ]; then
    echo "✅ 所有 API 测试通过 - API Key 正常"
else
    echo "❌ 部分或全部 API 测试失败 - 需要检查 API Key 配置"
    echo ""
    echo "📝 下一步操作:"
    echo "1. 检查 Google Cloud Console: https://console.cloud.google.com/"
    echo "2. 确认 YouTube Data API v3 已启用"
    echo "3. 检查 API Key 的应用限制"
    echo "4. 检查 API Key 的 API 限制"
    echo "5. 查看配额使用情况"
fi
echo ""
