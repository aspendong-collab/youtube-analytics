/**
 * 邮箱提取和验证工具类
 *
 * 功能：
 * 1. 从多个数据源提取邮箱
 * 2. 验证邮箱格式和有效性
 * 3. 计算邮箱置信度评分
 * 4. 排序和去重邮箱候选
 */

export interface EmailMatch {
  email: string;
  confidence: number;
  source: string;
  position?: number;
  videoId?: string;
  videoTitle?: string;
  commentId?: string;
  inferred?: boolean;
  nearKeywords?: string[];
  occurrenceCount?: number;
}

export interface ValidationResult {
  valid: boolean;
  reason: string;
  isFreeEmail?: boolean;
  domain?: string;
}

export interface RankedEmailResult {
  primaryEmail: string | null;
  primaryConfidence: number;
  possibleEmails: EmailMatch[];
  suggestions: string[];
  sources: {
    fromDescription: boolean;
    fromBranding: boolean;
    fromVideo: boolean;
    fromComment: boolean;
    fromSocialMedia: boolean;
    userSubmitted: boolean;
  };
}

export interface EmailExtractionContext {
  channelId?: string;
  videos?: any[];
  channel?: any;
}

export class EmailExtractor {
  // 无效邮箱域名列表
  private readonly INVALID_DOMAINS = [
    'example.com', 'test.com', 'demo.com', 'fake.com', 'placeholder.com',
    'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'trashmail.com',
    'sharklasers.com', 'guerrillamailblock.com', 'guerrillamail.net',
    'spamgourmet.com', 'mailinator.com', 'throwawaymail.com',
  ];

  // 常见免费邮箱域名
  private readonly FREE_DOMAINS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'aol.com', 'icloud.com', 'protonmail.com', 'zoho.com',
    'qq.com', '163.com', '126.com', 'foxmail.com', 'sina.com',
    'naver.com', 'daum.net', 'hanmail.net', 'yahoo.co.jp',
  ];

  // 邮箱关键词（用于置信度评分）
  private readonly EMAIL_KEYWORDS = [
    'contact', 'business', 'email', 'inquiry', '合作', '联络',
    '联系', 'email:', 'e-mail:', 'mail:', 'mailto:', '@gmail',
  ];

  /**
   * 从文本中提取所有邮箱
   */
  extractEmails(text: string, context?: { position?: number; nearKeywords?: string[] }): EmailMatch[] {
    if (!text) return [];

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.matchAll(emailRegex);
    const emails: EmailMatch[] = [];

    for (const match of matches) {
      const email = match[0];
      const validation = this.validateEmail(email);

      if (!validation.valid) continue;

      // 检查是否在关键词附近
      const nearKeywords = context?.nearKeywords || this.findNearKeywords(text, match.index, 50);

      emails.push({
        email,
        confidence: 0, // 稍后计算
        source: 'unknown',
        position: context?.position || match.index,
        nearKeywords,
      });
    }

    return emails;
  }

  /**
   * 验证邮箱格式和有效性
   */
  validateEmail(email: string): ValidationResult {
    if (!email || typeof email !== 'string') {
      return { valid: false, reason: 'invalid_email' };
    }

    // 基本格式检查
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return { valid: false, reason: 'invalid_format' };
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      return { valid: false, reason: 'invalid_domain' };
    }

    // 排除无效邮箱域名
    if (this.INVALID_DOMAINS.some(d => domain.includes(d))) {
      return { valid: false, reason: 'disposable_domain' };
    }

    // 检查是否为免费邮箱
    const isFreeEmail = this.FREE_DOMAINS.includes(domain);

    return {
      valid: true,
      reason: 'valid',
      isFreeEmail,
      domain,
    };
  }

  /**
   * 计算邮箱置信度
   */
  calculateEmailConfidence(
    email: string,
    source: string,
    context?: {
      position?: number;
      nearKeywords?: string[];
      occurrenceCount?: number;
      videoTitle?: string;
    }
  ): number {
    let confidence = 0;

    // 基于数据源的权重
    const sourceWeights: Record<string, number> = {
      'branding_settings': 95,      // 频道品牌设置
      'channel_description': 75,    // 频道描述
      'channel_title': 50,          // 频道标题
      'channel_keywords': 60,       // 频道关键词
      'video_description': 70,      // 视频描述
      'channel_comment': 85,        // 频道作者评论
      'user_comment': 40,           // 用户评论（低置信度）
      'inferred_from_social': 35,   // 从社交媒体推断
      'inferred_from_custom_url': 45, // 从自定义URL推断
      'inferred_from_name': 30,     // 从频道名称推断
      'user_submitted': 98,         // 用户提交
      'smtp_verified': 100,         // SMTP验证通过
    };

    confidence += sourceWeights[source] || 50;

    // 基于邮箱域名
    const validation = this.validateEmail(email);
    if (validation.valid) {
      if (!validation.isFreeEmail) {
        confidence += 5; // 自定义域名加分
      }
    }

    // 基于上下文
    if (context) {
      // 在关键词附近
      if (context.nearKeywords && context.nearKeywords.length > 0) {
        const hasBusinessKeyword = context.nearKeywords.some(k =>
          /contact|business|email|合作|联络|inquiry/i.test(k)
        );
        if (hasBusinessKeyword) {
          confidence += 8;
        }
      }

      // 出现在开头（前200字符）
      if (context.position !== undefined && context.position < 200) {
        confidence += 5;
      }

      // 多次出现
      if (context.occurrenceCount && context.occurrenceCount > 1) {
        confidence += Math.min(10, context.occurrenceCount * 3);
      }
    }

    return Math.min(100, confidence);
  }

  /**
   * 从视频描述提取邮箱
   */
  async extractEmailsFromVideos(videos: any[]): Promise<EmailMatch[]> {
    const emailMatches: EmailMatch[] = [];

    for (const video of videos) {
      const description = video.snippet?.description || '';
      const title = video.snippet?.title || '';

      const emails = this.extractEmails(description, {
        nearKeywords: this.EMAIL_KEYWORDS,
      });

      emails.forEach(email => {
        emailMatches.push({
          ...email,
          confidence: this.calculateEmailConfidence(
            email.email,
            'video_description',
            { nearKeywords: email.nearKeywords, videoTitle: title }
          ),
          source: 'video_description',
          videoId: video.id,
          videoTitle: title,
        });
      });
    }

    return emailMatches;
  }

  /**
   * 从频道信息提取邮箱
   */
  extractEmailsFromChannel(channel: any): EmailMatch[] {
    const emailMatches: EmailMatch[] = [];

    // 1. 从 brandingSettings 提取
    if (channel.brandingSettings?.channel?.email) {
      const email = channel.brandingSettings.channel.email;
      const validation = this.validateEmail(email);

      if (validation.valid) {
        emailMatches.push({
          email,
          confidence: this.calculateEmailConfidence(email, 'branding_settings'),
          source: 'branding_settings',
        });
      }
    }

    // 2. 从频道描述提取
    const description = channel.snippet?.description || '';
    if (description) {
      const emails = this.extractEmails(description, {
        nearKeywords: this.EMAIL_KEYWORDS,
      });

      emails.forEach(email => {
        emailMatches.push({
          ...email,
          confidence: this.calculateEmailConfidence(
            email.email,
            'channel_description',
            { nearKeywords: email.nearKeywords, position: email.position }
          ),
          source: 'channel_description',
        });
      });
    }

    // 3. 从频道标题提取
    const title = channel.snippet?.title || '';
    if (title) {
      const emails = this.extractEmails(title);
      emails.forEach(email => {
        emailMatches.push({
          ...email,
          confidence: this.calculateEmailConfidence(email.email, 'channel_title'),
          source: 'channel_title',
        });
      });
    }

    // 4. 从频道关键词提取
    const keywords = channel.brandingSettings?.channel?.keywords || '';
    if (keywords) {
      const emails = this.extractEmails(keywords);
      emails.forEach(email => {
        emailMatches.push({
          ...email,
          confidence: this.calculateEmailConfidence(email.email, 'channel_keywords'),
          source: 'channel_keywords',
        });
      });
    }

    return emailMatches;
  }

  /**
   * 从自定义URL推断邮箱
   */
  inferEmailsFromCustomUrl(customUrl: string, channelTitle?: string): EmailMatch[] {
    const candidates: EmailMatch[] = [];

    if (!customUrl) return candidates;

    // 提取用户名
    const username = customUrl
      .replace(/^@/, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();

    if (username.length < 3) return candidates;

    // 生成候选邮箱
    const emailFormats = [
      `${username}@gmail.com`,
      `${username}@outlook.com`,
      `${username}@hotmail.com`,
      `contact@${username}.com`,
      `hello@${username}.com`,
      `info@${username}.com`,
      `${username}@yahoo.com`,
    ];

    emailFormats.forEach(email => {
      const validation = this.validateEmail(email);
      if (validation.valid) {
        candidates.push({
          email,
          confidence: this.calculateEmailConfidence(email, 'inferred_from_custom_url'),
          source: 'inferred_from_custom_url',
          inferred: true,
        });
      }
    });

    // 从频道标题推断
    if (channelTitle) {
      const normalized = channelTitle
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, '');

      if (normalized.length > 3 && normalized !== username) {
        const titleEmails = [
          `${normalized}@gmail.com`,
          `${normalized}@outlook.com`,
        ];

        titleEmails.forEach(email => {
          const validation = this.validateEmail(email);
          if (validation.valid) {
            candidates.push({
              email,
              confidence: this.calculateEmailConfidence(email, 'inferred_from_name'),
              source: 'inferred_from_name',
              inferred: true,
            });
          }
        });
      }
    }

    return candidates;
  }

  /**
   * 排序和去重邮箱候选
   */
  rankEmailCandidates(candidates: EmailMatch[]): RankedEmailResult {
    // 去重（统一转小写）
    const uniqueEmails = new Map<string, EmailMatch>();

    candidates.forEach(candidate => {
      const normalized = candidate.email.toLowerCase();
      const existing = uniqueEmails.get(normalized);

      if (!existing || candidate.confidence > existing.confidence) {
        uniqueEmails.set(normalized, candidate);
      } else if (existing && candidate.confidence === existing.confidence) {
        // 如果置信度相同，合并来源
        existing.nearKeywords = [
          ...(existing.nearKeywords || []),
          ...(candidate.nearKeywords || []),
        ].filter((v, i, a) => a.indexOf(v) === i);
      }
    });

    // 按置信度排序
    const sorted = Array.from(uniqueEmails.values())
      .sort((a, b) => b.confidence - a.confidence);

    // 收集来源信息
    const sources = {
      fromDescription: sorted.some(e => e.source === 'channel_description'),
      fromBranding: sorted.some(e => e.source === 'branding_settings'),
      fromVideo: sorted.some(e => e.source === 'video_description'),
      fromComment: sorted.some(e => e.source === 'channel_comment'),
      fromSocialMedia: sorted.some(e => e.source.startsWith('inferred_from_social')),
      userSubmitted: sorted.some(e => e.source === 'user_submitted'),
    };

    return {
      primaryEmail: sorted[0]?.email || null,
      primaryConfidence: sorted[0]?.confidence || 0,
      possibleEmails: sorted.slice(1, 5).map(e => ({
        email: e.email,
        confidence: e.confidence,
        source: e.source,
      })),
      suggestions: this.generateSuggestions(sorted),
      sources,
    };
  }

  /**
   * 生成建议
   */
  private generateSuggestions(emails: EmailMatch[]): string[] {
    const suggestions: string[] = [];

    if (emails.length === 0) {
      suggestions.push('未找到邮箱信息');
      suggestions.push('建议查看频道"关于"页面');
      suggestions.push('建议查看最新视频的描述');
      suggestions.push('建议查看频道作者的评论回复');
    } else if (emails[0].confidence < 50) {
      suggestions.push('邮箱置信度较低，建议验证');
      suggestions.push('尝试从社交媒体平台查找');
      suggestions.push('联系频道作者确认');
    } else if (emails[0].confidence < 80) {
      suggestions.push('邮箱可能已经变更');
      suggestions.push('建议尝试多个候选邮箱');
    }

    return suggestions;
  }

  /**
   * 查找关键词附近的文本
   */
  private findNearKeywords(text: string, position: number, range: number): string[] {
    const start = Math.max(0, (position || 0) - range);
    const end = Math.min(text.length, (position || 0) + range);
    const context = text.substring(start, end);

    return this.EMAIL_KEYWORDS.filter(keyword =>
      context.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * 主函数：从上下文提取和排序邮箱
   */
  async extractAndRankEmails(context: EmailExtractionContext): Promise<RankedEmailResult> {
    const allCandidates: EmailMatch[] = [];

    // 从频道信息提取
    if (context.channel) {
      const channelEmails = this.extractEmailsFromChannel(context.channel);
      allCandidates.push(...channelEmails);
    }

    // 从视频描述提取
    if (context.videos && context.videos.length > 0) {
      const videoEmails = await this.extractEmailsFromVideos(context.videos);
      allCandidates.push(...videoEmails);
    }

    // 从自定义URL推断
    if (context.channel?.snippet?.customUrl) {
      const inferredEmails = this.inferEmailsFromCustomUrl(
        context.channel.snippet.customUrl,
        context.channel.snippet?.title
      );
      allCandidates.push(...inferredEmails);
    }

    return this.rankEmailCandidates(allCandidates);
  }
}

// 导出单例
export const emailExtractor = new EmailExtractor();
