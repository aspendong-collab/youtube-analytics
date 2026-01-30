# 视频信息获取失败问题排查

## 问题现象
在"添加视频"页面输入 YouTube 视频链接后，点击"获取视频信息"按钮，显示"获取视频信息失败"。

## 常见原因和解决方案

### 1. 未配置 YouTube API Key

**错误提示：**
```
未配置 YouTube API Key
请前往"设置管理 > 数据采集"进行配置
```

**解决方案：**

#### 方法 A：界面配置（推荐个人使用）

1. 访问 "设置管理" → "数据采集"
2. 在 "API 配置" 标签页中输入 YouTube API Key
3. 点击 "保存配置" 按钮
4. 看到成功提示后，返回"添加视频"页面重试

#### 方法 B：Vercel 环境变量（推荐生产环境）

1. 访问 Vercel 项目设置
2. 添加环境变量：`YOUTUBE_API_KEY`
3. 重新部署应用
4. 等待部署完成后重试

### 2. API Key 无效或权限不足

**错误提示：**
```
API Key 无效，请重新配置
```
或
```
API Key 权限不足或已达到配额限制 (403)
```

**解决方案：**

1. **检查 API Key 是否正确**
   - 登录 [Google Cloud Console](https://console.cloud.google.com/)
   - 进入 "API 和服务" > "凭据"
   - 确认 API Key 是否正确

2. **检查 API 是否启用**
   - 在 Google Cloud Console 中
   - 搜索并启用 "YouTube Data API v3"

3. **检查配额限制**
   - 在 Google Cloud Console 中
   - 进入 "API 和服务" > "配额"
   - 查看 YouTube Data API v3 的配额使用情况
   - 如果达到限制，可以申请增加配额

4. **重新生成 API Key**
   - 如果 API Key 有问题，可以删除并重新创建
   - 重新配置到应用中

### 3. Cookie 数据损坏

**错误提示：**
```
从 Cookie 读取配置失败
```

**解决方案：**

1. **清除 Cookie 并重新配置**
   - 打开浏览器开发者工具（F12）
   - 进入 "Application" > "Cookies"
   - 删除 `app_settings` Cookie
   - 重新在"设置管理"中配置 API Key

2. **使用 LocalStorage 备份**
   - 打开浏览器开发者工具（F12）
   - 进入 "Application" > "Local Storage"
   - 查看 `youtube_analytics_settings` 键的值
   - 如果存在，删除并重新配置

### 4. 视频链接格式不正确

**错误提示：**
```
请输入正确的 YouTube 视频链接
```

**解决方案：**

确保视频链接格式正确，支持以下格式：

- ✅ `https://www.youtube.com/watch?v=VIDEO_ID`
- ✅ `https://youtu.be/VIDEO_ID`
- ✅ `https://www.youtube.com/embed/VIDEO_ID`

**示例：**
```
✅ 正确: https://www.youtube.com/watch?v=dQw4w9WgXcQ
✅ 正确: https://youtu.be/dQw4w9WgXcQ
❌ 错误: https://youtube.com/watch?v=dQw4w9WgXcQ
❌ 错误: www.youtube.com/watch?v=dQw4w9WgXcQ
```

### 5. 视频不存在或不可访问

**错误提示：**
```
无法找到该视频，请检查链接是否正确
```

**解决方案：**

1. **确认视频可以正常访问**
   - 在浏览器中直接打开视频链接
   - 确认视频可以正常播放

2. **检查视频是否受限**
   - 有些视频可能因版权、地区限制等原因无法通过 API 访问
   - 尝试使用其他公开视频测试

3. **检查视频 ID 是否正确**
   - 视频 ID 应该是 11 个字符的字母数字组合
   - 例如：`dQw4w9WgXcQ`

## 调试步骤

### 1. 检查 Cookie 是否存在

1. 打开浏览器开发者工具（F12）
2. 进入 "Application" > "Cookies"
3. 查找 `app_settings` Cookie
4. 如果不存在，说明没有配置，需要先配置

### 2. 检查 Cookie 内容

1. 点击 `app_settings` Cookie
2. 查看 "Value" 字段
3. 确认包含 `apiKeys.youtubeApiKey` 字段
4. 确认 API Key 不为空

### 3. 检查服务器日志

如果部署在 Vercel：

1. 访问 Vercel 项目
2. 进入 "Deployments" 标签
3. 点击最新的部署
4. 查看实时日志
5. 搜索 `[API /api/video-info]` 关键字
6. 查看详细的调试信息

日志会显示：
```
[API /api/video-info] 收到请求，视频URL: ...
[API /api/video-info] 提取到的视频ID: ...
[API /api/video-info] Cookie 存在: true/false
[API /api/video-info] 使用 Cookie 中的 API Key
[API /api/video-info] 准备调用 YouTube API
[API /api/video-info] YouTube API 响应状态: ...
```

### 4. 测试 API 直接调用

使用 curl 或 Postman 测试：

```bash
curl "https://your-domain.vercel.app/api/video-info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

查看返回的 JSON 响应，了解具体错误。

### 5. 测试 YouTube API 直接调用

使用 API Key 直接测试 YouTube API：

```bash
curl "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=dQw4w9WgXcQ&key=YOUR_API_KEY"
```

如果这个失败，说明 API Key 本身有问题。

## 常见错误代码

| HTTP 状态码 | 错误信息 | 原因 | 解决方案 |
|-----------|---------|------|---------|
| 400 | 视频URL不能为空 | 未输入视频链接 | 输入有效的视频链接 |
| 400 | 无法从URL中提取视频ID | URL格式错误 | 使用正确的YouTube链接格式 |
| 401 | API Key无效 | API Key错误或已过期 | 重新配置API Key |
| 403 | API Key权限不足 | API Key配额不足或权限不够 | 申请增加配额或重新创建API Key |
| 404 | 未找到该视频 | 视频ID错误或视频不存在 | 检查视频链接是否正确 |
| 500 | 服务器内部错误 | 服务器或网络问题 | 查看服务器日志，联系管理员 |

## 测试用例

### 测试用例 1：公开视频

```
视频URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ
预期结果: 成功获取视频信息
```

### 测试用例 2：短链接

```
视频URL: https://youtu.be/dQw4w9WgXcQ
预期结果: 成功获取视频信息
```

### 测试用例 3：无效链接

```
视频URL: https://invalid-url.com
预期结果: 提示"请输入正确的YouTube视频链接"
```

### 测试用例 4：不存在视频

```
视频URL: https://www.youtube.com/watch?v=XXXXXXXXXXX
预期结果: 提示"无法找到该视频"
```

### 测试用例 5：未配置API Key

```
配置: 清除Cookie和环境变量
预期结果: 提示"请先配置YouTube API Key"
```

## 获取帮助

如果以上方法都无法解决问题：

1. **收集信息**
   - 错误提示的完整信息
   - 视频链接
   - 浏览器和版本
   - 服务器日志（如果可以访问）

2. **检查资源**
   - [Vercel 部署指南](./VERCEL_SETUP_GUIDE.md)
   - [YouTube Data API 文档](https://developers.google.com/youtube/v3)

3. **联系支持**
   - 提供详细的错误信息和日志
   - 说明已尝试的解决方法
