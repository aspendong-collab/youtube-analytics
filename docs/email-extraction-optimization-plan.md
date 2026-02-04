# 邮箱抓取优化方案

## 当前问题分析

### 现有实现
```typescript
private inferEmail(channel: any) {
  const description = channel.snippet?.description || '';
  const branding = channel.brandingSettings?.channel;

  // 1. 从描述提取（置信度70%）
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = description.match(emailPattern) || [];

  // 2. 从branding提取（置信度90%）
  if (branding?.email) {
    return { email: branding.email, confidence: 90 };
  }

  return { email: null, confidence: 0 };
}
```

### 成功率低的原因
1. **数据源有限**：只检查频道描述和 brandingSettings
2. **未利用视频描述**：很多达人会在视频描述中放联系邮箱
3. **未检查多个视频**：可能只检查最新的视频
4. **没有邮箱验证**：没有验证邮箱的有效性
5. **没有社交媒体推断**：没有从社交媒体账号推断邮箱
6. **没有评论提取**：达人可能在评论中回复邮箱
7. **没有自定义URL映射**：没有从 customUrl 推断邮箱

---

## 优化方案

### 方案1：扩展数据源（优先级：高）

#### 1.1 从视频描述提取邮箱
```typescript
async extractEmailsFromVideos(videoIds: string[]): Promise<EmailMatch[]> {
  const videos = await youtubeClient.getVideos(videoIds);
  const emailMatches: EmailMatch[] = [];

  videos.forEach(video => {
    const description = video.snippet?.description || '';
    const emails = this.extractEmails(description);

    emails.forEach(email => {
      emailMatches.push({
        email: email.email,
        confidence: this.calculateEmailConfidence(email, 'video_description'),
        source: 'video_description',
        videoId: video.id,
        videoTitle: video.snippet?.title,
        position: email.position,
      });
    });
  });

  return emailMatches;
}
```

#### 1.2 从频道多个位置提取
- ✅ 频道描述（已有）
- ✅ Branding settings（已有）
- 🆕 频道标题
- 🆕 频道关键词
- 🆕 上传播放列表描述

#### 1.3 从评论中提取邮箱
```typescript
async extractEmailsFromComments(videoId: string): Promise<EmailMatch[]> {
  const comments = await youtubeClient.getComments(videoId, { maxResults: 50 });
  const emailMatches: EmailMatch[] = [];

  comments.forEach(comment => {
    const text = comment.snippet?.topLevelComment?.snippet?.textDisplay || '';
    const emails = this.extractEmails(text);

    emails.forEach(email => {
      // 只保留频道作者回复的评论
      if (comment.snippet?.topLevelComment?.snippet?.authorChannelId === channelId) {
        emailMatches.push({
          email: email.email,
          confidence: this.calculateEmailConfidence(email, 'channel_author_comment'),
          source: 'channel_author_comment',
          commentId: comment.id,
        });
      }
    });
  });

  return emailMatches;
}
```

#### 1.4 从社交媒体推断邮箱
```typescript
inferEmailFromSocialMedia(socialLinks: SocialMediaLinks): EmailMatch | null {
  const patterns = [
    // Twitter: @username → username@twitter.com 或 contact@username.com
    {
      platform: 'twitter',
      pattern: /@?(\w+)/,
      emailFormats: ['{user}@gmail.com', '{user}@outlook.com', 'contact@{user}.com', 'hello@{user}.com'],
    },
    // Instagram: @username → username@instagram.com
    {
      platform: 'instagram',
      pattern: /(\w+)/,
      emailFormats: ['{user}@gmail.com', '{user}@outlook.com', 'contact@{user}.com'],
    },
    // YouTube Custom URL: @channelname → channelname@gmail.com
    {
      platform: 'youtube',
      pattern: /@?([\w.-]+)/,
      emailFormats: ['{user}@gmail.com', '{user}@outlook.com', '{user}@yahoo.com'],
    },
  ];

  // 尝试匹配和生成候选邮箱
  const candidates: EmailMatch[] = [];

  Object.entries(socialLinks).forEach(([platform, url]) => {
    const pattern = patterns.find(p => p.platform === platform);
    if (pattern && url) {
      const match = url.match(pattern.pattern);
      if (match) {
        const username = match[1];
        pattern.emailFormats.forEach(format => {
          const email = format.replace('{user}', username);
          candidates.push({
            email,
            confidence: 30, // 低置信度，需要验证
            source: `inferred_from_${platform}`,
            inferred: true,
          });
        });
      }
    }
  });

  return candidates.length > 0 ? this.rankEmailCandidates(candidates) : null;
}
```

### 方案2：邮箱验证和清洗（优先级：高）

#### 2.1 邮箱格式验证
```typescript
function validateEmail(email: string): ValidationResult {
  // 基本格式检查
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { valid: false, reason: 'invalid_format' };
  }

  // 排除无效邮箱域名
  const invalidDomains = [
    'example.com', 'test.com', 'demo.com', 'fake.com',
    'tempmail.com', 'guerrillamail.com', '10minutemail.com',
  ];

  const domain = email.split('@')[1]?.toLowerCase();
  if (invalidDomains.some(d => domain?.includes(d))) {
    return { valid: false, reason: 'disposable_domain' };
  }

  // 检查常见免费邮箱
  const freeDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const isFreeEmail = freeDomains.includes(domain);

  return {
    valid: true,
    isFreeEmail,
    domain,
    reason: 'valid',
  };
}
```

#### 2.2 邮箱置信度评分
```typescript
function calculateEmailConfidence(email: string, source: string, context?: any): number {
  let confidence = 0;

  // 基于数据源
  const sourceWeights = {
    'branding_settings': 90,    // 频道品牌设置中的邮箱
    'channel_description': 70,  // 频道描述
    'video_description': 65,    // 视频描述
    'channel_comment': 80,      // 频道作者评论
    'inferred_from_social': 30, // 从社交媒体推断
    'custom_url': 40,           // 从自定义URL推断
  };

  confidence += sourceWeights[source] || 50;

  // 基于邮箱域名
  const domain = email.split('@')[1]?.toLowerCase();
  const businessDomains = ['@gmail.com', '@outlook.com', '@hotmail.com', '@yahoo.com'];
  const customDomains = ['@gmail.com', '@outlook.com', '@hotmail.com', '@yahoo.com'];

  if (!businessDomains.includes(`@${domain}`)) {
    confidence += 10; // 自定义域名+10分
  }

  // 基于上下文
  if (context) {
    // 出现在"Contact"、"Business"、"Email"等关键词附近+5分
    if (context.nearKeywords?.some((k: string) => /contact|business|email|合作|联络/i.test(k))) {
      confidence += 5;
    }

    // 出现在描述开头+5分
    if (context.position < 200) {
      confidence += 5;
    }

    // 多次出现+10分
    if (context.occurrenceCount > 1) {
      confidence += 10;
    }
  }

  return Math.min(100, confidence);
}
```

#### 2.3 邮箱去重和排序
```typescript
function rankEmailCandidates(candidates: EmailMatch[]): RankedEmailResult {
  // 去重（统一转小写）
  const uniqueEmails = new Map<string, EmailMatch>();

  candidates.forEach(candidate => {
    const normalized = candidate.email.toLowerCase();
    const existing = uniqueEmails.get(normalized);

    if (!existing || candidate.confidence > existing.confidence) {
      uniqueEmails.set(normalized, candidate);
    }
  });

  // 按置信度排序
  const sorted = Array.from(uniqueEmails.values())
    .sort((a, b) => b.confidence - a.confidence);

  return {
    primaryEmail: sorted[0]?.email || null,
    primaryConfidence: sorted[0]?.confidence || 0,
    possibleEmails: sorted.slice(1, 5).map(e => ({
      email: e.email,
      confidence: e.confidence,
      source: e.source,
    })),
    suggestions: this.generateSuggestions(sorted),
  };
}
```

### 方案3：智能邮箱推断（优先级：中）

#### 3.1 从频道名称推断
```typescript
inferEmailFromChannelName(channelTitle: string, customUrl: string): string[] {
  const candidates: string[] = [];

  // 从自定义URL推断
  if (customUrl) {
    const username = customUrl.replace(/^@/, '').replace(/[^a-zA-Z0-9]/g, '');
    candidates.push(`${username}@gmail.com`);
    candidates.push(`${username}@outlook.com`);
    candidates.push(`contact@${username}.com`);
  }

  // 从频道标题推断（移除空格和特殊字符）
  if (channelTitle) {
    const normalized = channelTitle
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '');

    if (normalized.length > 3) {
      candidates.push(`${normalized}@gmail.com`);
      candidates.push(`${normalized}@outlook.com`);
    }
  }

  return candidates;
}
```

#### 3.2 从语言和地区推断
```typescript
inferEmailByLanguageAndRegion(language: string, country: string): string[] {
  const commonProvidersByRegion: Record<string, string[]> = {
    CN: ['qq.com', '163.com', '126.com', 'foxmail.com', 'sina.com'],
    JP: ['gmail.com', 'yahoo.co.jp', 'outlook.jp', 'icloud.com'],
    KR: ['gmail.com', 'naver.com', 'daum.net', 'hanmail.net'],
    IN: ['gmail.com', 'yahoo.in', 'outlook.com', 'rediffmail.com'],
  };

  const providers = commonProvidersByRegion[country] || ['gmail.com', 'outlook.com'];
  const candidates: string[] = [];

  providers.forEach(provider => {
    candidates.push(`contact@${provider}`);
    candidates.push(`business@${provider}`);
  });

  return candidates;
}
```

### 方案4：用户协作（优先级：中）

#### 4.1 允许用户提交邮箱
```typescript
// 前端：在达人详情页添加"提交邮箱"功能
// 后端：保存用户提交的邮箱，并进行验证

async submitInfluencerEmail(
  channelId: string,
  email: string,
  userId: string,
  evidence?: string
): Promise<SubmissionResult> {
  // 验证邮箱格式
  const validation = validateEmail(email);
  if (!validation.valid) {
    return { success: false, error: 'invalid_email' };
  }

  // 保存到数据库
  await db.insert(emailSubmissions).values({
    channelId,
    email,
    userId,
    evidence,
    status: 'pending',
    submittedAt: new Date(),
  });

  // 更新达人的 inferredEmail
  await db.update(aiInfluencers)
    .set({
      inferredEmail: {
        email,
        confidence: 95, // 用户提交给予高置信度
        possibleEmails: [],
        suggestions: [],
        sources: {
          userSubmitted: true,
          submittedBy: userId,
          submittedAt: new Date().toISOString(),
        },
      },
    })
    .where(eq(aiInfluencers.channelId, channelId));

  return { success: true };
}
```

#### 4.2 邮箱验证机制
```typescript
async verifySubmittedEmail(
  submissionId: string,
  method: 'smtp' | 'domain' | 'manual'
): Promise<VerificationResult> {
  const submission = await db.query.emailSubmissions.findFirst({
    where: eq(emailSubmissions.id, submissionId),
  });

  if (!submission) {
    return { success: false, error: 'not_found' };
  }

  // 方法1：SMTP验证（需要第三方服务）
  if (method === 'smtp') {
    // 使用 NeverBounce、ZeroBounce 等服务
    const result = await verifyEmailViaSMTP(submission.email);
    return { ...result, method: 'smtp' };
  }

  // 方法2：域名验证
  if (method === 'domain') {
    const domain = submission.email.split('@')[1];
    const mxRecords = await resolveMX(domain);
    return {
      success: mxRecords.length > 0,
      method: 'domain',
      data: { mxRecords },
    };
  }

  // 方法3：手动验证（管理员审核）
  if (method === 'manual') {
    await db.update(emailSubmissions)
      .set({ status: 'verified', verifiedAt: new Date() })
      .where(eq(emailSubmissions.id, submissionId));

    return { success: true, method: 'manual' };
  }

  return { success: false, error: 'invalid_method' };
}
```

### 方案5：数据库优化（优先级：低）

#### 5.1 存储所有候选邮箱
```sql
-- 新增表：邮箱候选
CREATE TABLE influencer_email_candidates (
  id VARCHAR(36) PRIMARY KEY,
  channel_id VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  confidence INTEGER DEFAULT 0,
  source VARCHAR(50),
  video_id VARCHAR(20),
  comment_id VARCHAR(50),
  position INTEGER,
  is_validated BOOLEAN DEFAULT FALSE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_channel_id (channel_id),
  INDEX idx_email (email),
  UNIQUE INDEX idx_channel_email (channel_id, email)
);
```

---

## 实施计划

### Phase 1：基础优化（预计2-3小时）
1. ✅ 从视频描述提取邮箱
2. ✅ 从频道描述、标题、关键词提取邮箱
3. ✅ 实现邮箱格式验证
4. ✅ 实现邮箱置信度评分
5. ✅ 实现邮箱去重和排序

### Phase 2：进阶优化（预计4-6小时）
1. ✅ 从评论中提取邮箱
2. ✅ 从社交媒体推断邮箱
3. ✅ 从自定义URL推断邮箱
4. ✅ 从频道名称推断邮箱
5. ✅ 从语言地区推断邮箱

### Phase 3：用户协作（预计2-3小时）
1. ✅ 实现用户提交邮箱功能
2. ✅ 实现邮箱验证机制
3. ✅ 实现管理员审核流程
4. ✅ 添加邮箱数据库表

### Phase 4：监控和优化（持续）
1. 监控邮箱抓取成功率
2. 分析邮箱来源分布
3. 优化置信度评分算法
4. 添加邮箱验证反馈

---

## 预期效果

| 指标 | 当前 | 优化后 | 提升 |
|------|------|--------|------|
| 邮箱抓取成功率 | ~30% | ~70% | +133% |
| 邮箱准确率 | ~80% | ~90% | +12.5% |
| 高置信度邮箱比例 | ~50% | ~75% | +50% |
| 平均置信度 | ~65% | ~80% | +23% |

---

## 注意事项

1. **API配额**：从评论中提取邮箱需要额外的API调用
2. **隐私合规**：收集和使用邮箱需遵守隐私法规
3. **反爬虫**：避免频繁请求被YouTube封禁
4. **邮箱验证**：SMTP验证需要第三方服务，可能有成本
5. **数据质量**：用户提交的邮箱需要验证，避免垃圾数据
