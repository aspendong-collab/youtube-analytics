# 视频信息获取失败问题排查

## 问题现象

在"添加视频"页面输入 YouTube 视频链接后，点击"获取视频信息"按钮，显示"获取视频信息失败"。

## 常见原因和解决方案

### 1. 平台未配置 YouTube API Key

**错误提示：**
```
平台未配置 YouTube API Key
请联系管理员在环境变量中配置 YOUTUBE_API_KEY
```

**解决方案：**

#### 如果你是用户
- 联系平台管理员，告知需要配置 YouTube API Key
- 管理员配置后，重新刷新页面即可

#### 如果你是管理员
1. 在 Vercel 项目设置中添加环境变量 `YOUTUBE_API_KEY`
2. 输入有效的 YouTube API Key
3. 重新部署项目

### 2. API Key 无效或权限不足

**错误提示：**
```
API Key 无效或已过期
```
或
```
API Key 权限不足或配额已用尽
```

**解决方案（管理员）：**

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
   - 重新配置到 Vercel 环境变量中

### 3. 视频链接格式不正确

**错误提示：**
```
无法从 URL 中提取视频 ID，请输入正确的 YouTube 视频链接
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

### 4. 视频不存在或不可访问

**错误提示：**
```
未找到该视频
请检查视频链接是否正确，或者视频是否已被删除
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

### 5. 服务器错误

**错误提示：**
```
服务器内部错误
请稍后重试，如果问题持续存在请联系管理员
```

**解决方案（管理员）：**

1. **查看服务器日志**
   - 访问 Vercel 部署日志
   - 搜索错误信息
   - 检查是否有配置问题或 API 调用异常

2. **检查网络连接**
   - 确认服务器可以访问 Google API
   - 检查是否有防火墙限制

3. **联系技术支持**
   - 如果问题持续，查看完整的错误日志
   - 提供详细的错误信息和复现步骤

## 调试步骤

### 1. 检查环境变量配置（管理员）

1. 访问 Vercel 项目设置
2. 进入 "Environment Variables"
3. 检查是否存在 `YOUTUBE_API_KEY`
4. 确认值不为空

### 2. 测试视频链接

1. 在浏览器中直接打开视频链接
2. 确认视频可以正常播放
3. 检查链接格式是否正确

### 3. 检查服务器日志（管理员）

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
[API /api/video-info] 检查 API Key 配置: { hasApiKey: true, ... }
[API /api/video-info] 调用 YouTube API: { videoId: ... }
[API /api/video-info] YouTube API 响应: { status: ... }
```

### 4. 测试 API 直接调用

使用 curl 测试：

```bash
curl "https://your-domain.vercel.app/api/video-info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

查看返回的 JSON 响应，了解具体错误。

### 5. 测试 YouTube API 直接调用（管理员）

使用 API Key 直接测试 YouTube API：

```bash
curl "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=dQw4w9WgXcQ&key=YOUR_API_KEY"
```

如果这个失败，说明 API Key 本身有问题。

## 常见错误代码

| HTTP 状态码 | 错误信息 | 原因 | 解决方案 |
|-----------|---------|------|---------|
| 400 | 视频 URL 不能为空 | 未输入视频链接 | 输入有效的视频链接 |
| 400 | 无法从 URL 中提取视频 ID | URL 格式错误 | 使用正确的 YouTube 链接格式 |
| 401 | API Key 无效或已过期 | API Key 错误或已过期 | 管理员重新配置 API Key |
| 403 | API Key 权限不足或配额已用尽 | API Key 配额不足或权限不够 | 管理员申请增加配额或重新创建 API Key |
| 404 | 未找到该视频 | 视频不存在或已删除 | 检查视频链接是否正确 |
| 500 | 服务器内部错误 | 服务器或网络问题 | 管理员查看服务器日志 |

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
预期结果: 提示"请输入正确的 YouTube 视频链接"
```

### 测试用例 4：不存在视频

```
视频URL: https://www.youtube.com/watch?v=XXXXXXXXXXX
预期结果: 提示"未找到该视频"
```

### 测试用例 5：未配置 API Key

```
配置: 删除环境变量中的 YOUTUBE_API_KEY
预期结果: 提示"平台未配置 YouTube API Key"
```

## 获取帮助

如果以上方法都无法解决问题：

1. **收集信息**
   - 错误提示的完整信息
   - 视频链接
   - 浏览器和版本
   - 服务器日志（管理员）

2. **检查资源**
   - [Vercel 部署指南](./VERCEL_SETUP_GUIDE.md)
   - [YouTube Data API 文档](https://developers.google.com/youtube/v3)

3. **联系管理员**
   - 提供详细的错误信息
   - 说明已尝试的解决方法
   - 管理员会检查服务器配置和日志
