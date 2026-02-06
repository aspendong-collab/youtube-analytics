/**
 * Affiliate 检测引擎
 * 用于检测文本中的 affiliate 标识（Ref参数、UTM参数、短链接、关键词、Disclosure声明）
 */

export interface AffiliateLink {
  type: 'ref' | 'utm' | 'short' | 'keyword' | 'disclosure';
  value: string;
  fullUrl?: string;
  position: 'description' | 'comment';
}

export interface AffiliateDetection {
  hasAffiliate: boolean;
  score: number; // 0-100
  evidence: {
    refLinks: AffiliateLink[];
    utmLinks: AffiliateLink[];
    shortLinks: AffiliateLink[];
    keywords: AffiliateLink[];
    disclosures: AffiliateLink[];
  };
  extractedContactInfo?: {
    email?: string;
    socialLinks?: string[];
  };
}

/**
 * Affiliate 检测器
 */
export class AffiliateDetector {
  // 短链接域名黑名单
  private static readonly SHORT_LINK_DOMAINS = [
    'bit.ly',
    'rebrand.ly',
    'tinyurl.com',
    'goo.gl',
    't.co',
    'buff.ly',
    'ow.ly',
    'short.link',
    'cutt.ly',
    'bit.do',
    'is.gd',
    'v.gd',
    'bl.ink',
    'href.li',
    'clck.ru'
  ];

  // Affiliate 关键词（多语言）
  private static readonly AFFILIATE_KEYWORDS = [
    // English
    'exclusive coupon code',
    'discount code',
    'promo code',
    'coupon code',
    'affiliate link',
    'use my code',
    'save with my code',
    'special offer',
    'limited time offer',
    'get discount',
    'use coupon',
    'apply code',
    'referral link',
    'partner link',
    'commission',
    // Chinese (Simplified)
    '专属优惠码',
    '折扣码',
    '优惠券',
    '专属链接',
    '使用我的优惠码',
    '推荐链接',
    '联盟营销',
    '佣金',
    // Chinese (Traditional)
    '專屬優惠碼',
    '折扣碼',
    '優惠券',
    '專屬連結',
    // French
    'code exclusif',
    'code de réduction',
    'code promo',
    'lien affilié',
    'gagner une commission',
    // German
    'exklusiver gutscheincode',
    'gutscheincode',
    'rabattcode',
    'affiliate-link',
    // Italian
    'codice esclusivo',
    'codice sconto',
    'codice promozionale',
    'link affiliato',
    // Japanese
    '限定クーポンコード',
    '割引コード',
    'プロモコード',
    'アフィリエイトリンク',
    '専用リンク',
    // Korean
    '전용 쿠폰 코드',
    '할인 코드',
    '프로모션 코드',
    '제휴 링크',
    '추천 링크'
  ];

  // Disclosure 声明模式
  private static readonly DISCLOSURE_PATTERNS = [
    /disclosure:\s*some\s+of\s+the\s+links\s+(above|below|in\s+this\s+(post|video))?\s+are\s+affiliate\s+links/gi,
    /affiliate\s+disclosure/gi,
    /i\s+(may|will)\s+earn\s+a\s+commission/gi,
    /contains\s+affiliate\s+links/gi,
    /sponsored\s+post/gi,
    /sponsored\s+by/gi,
    /partnered\s+with/gi,
    // Multilingual
    /affilié.*lien/gi, // French
    /werbelinks.*gültig/gi, // German
    /含有联盟营销链接/gi, // Chinese
    /包含联盟链接/gi // Chinese
  ];

  /**
   * 检测文本中的 affiliate 标识
   */
  detectAffiliate(text: string, position: 'description' | 'comment' = 'description'): AffiliateDetection {
    const result: AffiliateDetection = {
      hasAffiliate: false,
      score: 0,
      evidence: {
        refLinks: [],
        utmLinks: [],
        shortLinks: [],
        keywords: [],
        disclosures: []
      }
    };

    // 1. 检测 Ref 参数
    this.detectRefLinks(text, result, position);

    // 2. 检测 UTM 参数
    this.detectUTMLinks(text, result, position);

    // 3. 检测短链接
    this.detectShortLinks(text, result, position);

    // 4. 检测关键词
    this.detectKeywords(text, result, position);

    // 5. 检测 Disclosure 声明
    this.detectDisclosures(text, result, position);

    // 6. 提取联系信息
    result.extractedContactInfo = this.extractContactInfo(text);

    // 7. 计算 Affiliate Score
    result.hasAffiliate = result.score > 0;

    return result;
  }

  /**
   * 检测 Ref 参数链接
   */
  private detectRefLinks(text: string, result: AffiliateDetection, position: 'description' | 'comment'): void {
    const refParams = ['ref', 'via', 'affiliate', 'partner', 'sponsor', 'promo', 'campaign'];

    for (const param of refParams) {
      const regex = new RegExp(`[?&]${param}=([^&\\s]+)`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        result.hasAffiliate = true;
        result.evidence.refLinks.push({
          type: 'ref',
          value: match[1],
          fullUrl: match[0],
          position
        });
      }
    }

    // 计算分数
    result.score += result.evidence.refLinks.length * 30;
  }

  /**
   * 检测 UTM 参数链接
   */
  private detectUTMLinks(text: string, result: AffiliateDetection, position: 'description' | 'comment'): void {
    const utmRegex = /[?&]utm_source=(youtube|influencer|creator|partner)[&]?/gi;
    const utmLinkRegex = /(https?:\/\/[^\s]+utm_source=(youtube|influencer|creator|partner)[^\s]*)/gi;

    let match;
    if (utmRegex.test(text)) {
      result.hasAffiliate = true;
      while ((match = utmLinkRegex.exec(text)) !== null) {
        result.evidence.utmLinks.push({
          type: 'utm',
          value: 'utm_campaign',
          fullUrl: match[1],
          position
        });
      }
    }

    // 计算分数
    result.score += result.evidence.utmLinks.length * 25;
  }

  /**
   * 检测短链接
   */
  private detectShortLinks(text: string, result: AffiliateDetection, position: 'description' | 'comment'): void {
    for (const domain of AffiliateDetector.SHORT_LINK_DOMAINS) {
      const escapedDomain = domain.replace(/\./g, '\\.');
      const shortLinkRegex = new RegExp(`https?:\\/\\/${escapedDomain}\\/[^\\s\\)]+`, 'gi');
      let match;
      while ((match = shortLinkRegex.exec(text)) !== null) {
        result.hasAffiliate = true;
        result.evidence.shortLinks.push({
          type: 'short',
          value: domain,
          fullUrl: match[0],
          position
        });
      }
    }

    // 计算分数
    result.score += result.evidence.shortLinks.length * 15;
  }

  /**
   * 检测 affiliate 关键词
   */
  private detectKeywords(text: string, result: AffiliateDetection, position: 'description' | 'comment'): void {
    const lowerText = text.toLowerCase();

    for (const keyword of AffiliateDetector.AFFILIATE_KEYWORDS) {
      const regex = new RegExp(keyword, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        result.hasAffiliate = true;
        result.evidence.keywords.push({
          type: 'keyword',
          value: match[0],
          position
        });
      }
    }

    // 计算分数（去重）
    const uniqueKeywords = new Set(result.evidence.keywords.map(k => k.value.toLowerCase()));
    result.score += uniqueKeywords.size * 20;
  }

  /**
   * 检测 Disclosure 声明
   */
  private detectDisclosures(text: string, result: AffiliateDetection, position: 'description' | 'comment'): void {
    for (const pattern of AffiliateDetector.DISCLOSURE_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        result.hasAffiliate = true;
        result.evidence.disclosures.push({
          type: 'disclosure',
          value: match[0].substring(0, 100) + (match[0].length > 100 ? '...' : ''),
          position
        });
      }
    }

    // 计算分数
    const uniqueDisclosures = new Set(result.evidence.disclosures.map(d => d.value.toLowerCase()));
    result.score += uniqueDisclosures.size * 35;
  }

  /**
   * 提取联系信息
   */
  private extractContactInfo(text: string): AffiliateDetection['extractedContactInfo'] {
    const contactInfo: AffiliateDetection['extractedContactInfo'] = {};

    // 提取邮箱
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    const emailMatch = emailRegex.exec(text);
    if (emailMatch) {
      contactInfo.email = emailMatch[1];
    }

    // 提取社交媒体链接
    const socialRegex = /(https?:\/\/(www\.)?(twitter|instagram|facebook|linkedin|tiktok|youtube)\.com\/[^\s]+)/gi;
    const socialMatches = text.match(socialRegex);
    if (socialMatches) {
      contactInfo.socialLinks = [...new Set(socialMatches)];
    }

    return contactInfo;
  }

  /**
   * 计算 Affiliate Score（0-100）
   */
  private calculateAffiliateScore(detection: AffiliateDetection): number {
    let score = 0;

    // Ref 参数（高权重）
    score += detection.evidence.refLinks.length * 30;

    // UTM 参数（高权重）
    score += detection.evidence.utmLinks.length * 25;

    // 短链接（中等权重）
    score += detection.evidence.shortLinks.length * 15;

    // 关键词（中等权重）
    const uniqueKeywords = new Set(detection.evidence.keywords.map(k => k.value.toLowerCase()));
    score += uniqueKeywords.size * 20;

    // Disclosure 声明（高权重）
    const uniqueDisclosures = new Set(detection.evidence.disclosures.map(d => d.value.toLowerCase()));
    score += uniqueDisclosures.size * 35;

    return Math.min(100, score);
  }

  /**
   * 批量检测
   */
  detectAffiliateBatch(
    items: Array<{ text: string; position?: 'description' | 'comment' }>
  ): AffiliateDetection[] {
    return items.map(item =>
      this.detectAffiliate(item.text, item.position || 'description')
    );
  }
}
