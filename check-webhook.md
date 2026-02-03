# Vercel Webhook 检查步骤

## 1. 访问 GitHub 仓库设置
1. 访问: https://github.com/aspendong-collab/youtube-analytics/settings/hooks
2. 查看是否有 Vercel 的 webhook
3. 检查 webhook 状态是否为"Active"

## 2. 如果没有 Vercel Webhook
1. 访问 Vercel Dashboard
2. 进入 youtube-analytics 项目的 Settings
3. 找到 "Git" 或 "Deployments" 设置
4. 重新连接 GitHub 仓库
5. 确保 "Auto Deploy" 选项已启用

## 3. 检查分支设置
- 确保监听的是 `main` 分支
- 确保 "Production Branch" 设置为 `main`
