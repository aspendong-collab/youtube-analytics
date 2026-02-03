#!/bin/bash

# YouTube API 测试脚本
# 用于检查 API Key 是否有效以及权限配置

API_KEY="AIzaSyBgo5bEiG0dMJ2RKp7I13eL-yk15gFcsjY"

echo "========================================="
echo "YouTube API 测试"
echo "========================================="
echo ""

# 测试 1: 搜索 API
echo "测试 1: 搜索 API"
echo "URL: https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=tech&maxResults=1&key=***"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=tech&maxResults=1&key=$API_KEY")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "HTTP 状态码: $HTTP_CODE"
echo "响应内容:"
echo "$BODY" | head -c 500
echo ""
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 搜索 API 正常"
elif [ "$HTTP_CODE" = "403" ]; then
    echo "❌ 403 错误 - API 权限不足或配额已用完"
    echo ""
    echo "可能的原因:"
    echo "1. API Key 未启用 YouTube Data API v3"
    echo "2. API Key 的应用限制设置不正确"
    echo "3. API Key 的 IP 限制设置不正确"
    echo "4. 配额已用完"
    echo ""
    echo "解决方案:"
    echo "1. 访问 Google Cloud Console: https://console.cloud.google.com/"
    echo "2. 进入 API 和服务 > 凭证"
    echo "3. 检查 API Key 的设置"
    echo "4. 确保 YouTube Data API v3 已启用"
elif [ "$HTTP_CODE" = "400" ]; then
    echo "❌ 400 错误 - 请求参数错误"
    echo "响应: $BODY"
elif [ "$HTTP_CODE" = "429" ]; then
    echo "❌ 429 错误 - 请求过于频繁"
else
    echo "❌ 未知错误: $HTTP_CODE"
    echo "响应: $BODY"
fi

echo ""
echo "========================================="
echo ""

# 测试 2: 视频 API
echo "测试 2: 视频 API (获取统计)"
echo "URL: https://www.googleapis.com/youtube/v3/videos?part=statistics&id=dQw4w9WgXcQ&key=***"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  "https://www.googleapis.com/youtube/v3/videos?part=statistics&id=dQw4w9WgXcQ&key=$API_KEY")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "HTTP 状态码: $HTTP_CODE"
echo "响应内容:"
echo "$BODY" | head -c 300
echo ""
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 视频 API 正常"
else
    echo "❌ 视频 API 错误: $HTTP_CODE"
fi

echo ""
echo "========================================="
echo ""

# 测试 3: 频道 API
echo "测试 3: 频道 API (获取统计)"
echo "URL: https://www.googleapis.com/youtube/v3/channels?part=statistics&id=UC_x5XG1OV2P6uZZ5FSM9Ttw&key=***"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  "https://www.googleapis.com/youtube/v3/channels?part=statistics&id=UC_x5XG1OV2P6uZZ5FSM9Ttw&key=$API_KEY")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "HTTP 状态码: $HTTP_CODE"
echo "响应内容:"
echo "$BODY" | head -c 300
echo ""
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 频道 API 正常"
else
    echo "❌ 频道 API 错误: $HTTP_CODE"
fi

echo ""
echo "========================================="
echo "测试完成"
echo "========================================="
