#!/bin/bash

echo "================================"
echo "Vercel 自动部署诊断工具"
echo "================================"
echo ""

# 检查 Git 配置
echo "1. 检查 Git 配置..."
git remote -v
echo ""

# 检查最新提交
echo "2. 检查最新提交..."
git log -1 --oneline
echo ""

# 检查本地分支
echo "3. 检查本地分支..."
git branch -vv
echo ""

# 检查与远程的同步状态
echo "4. 检查与远程的同步状态..."
git status
echo ""

# 检查 Vercel 配置文件
echo "5. 检查 Vercel 配置文件..."
if [ -f "vercel.json" ]; then
  echo "✅ vercel.json 存在"
  cat vercel.json
else
  echo "❌ vercel.json 不存在"
fi
echo ""

# 检查 Next.js 配置
echo "6. 检查 Next.js 配置..."
if [ -f "next.config.js" ] || [ -f "next.config.mjs" ]; then
  echo "✅ Next.js 配置文件存在"
else
  echo "❌ Next.js 配置文件不存在"
fi
echo ""

# 检查 package.json
echo "7. 检查 package.json..."
if [ -f "package.json" ]; then
  echo "✅ package.json 存在"
  echo "Build Command: $(cat package.json | grep '"build"' | head -1)"
  echo "Start Command: $(cat package.json | grep '"start"' | head -1)"
else
  echo "❌ package.json 不存在"
fi
echo ""

echo "================================"
echo "诊断完成"
echo "================================"
echo ""
echo "下一步："
echo "1. 访问 https://vercel.com/dashboard"
echo "2. 找到 youtube-analytics 项目"
echo "3. 检查 'Settings' → 'Git' 配置"
echo "4. 检查 'Deployments' 标签页"
echo "5. 点击 'Redeploy' 手动触发部署"
