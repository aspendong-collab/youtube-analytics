/**
 * 验证工具
 */

/**
 * 检查是否为有效的邮箱地址
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * 检查是否为有效的 URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查是否为有效的 YouTube 视频 ID
 */
export function isValidYoutubeVideoId(id: string): boolean {
  const regex = /^[a-zA-Z0-9_-]{11}$/;
  return regex.test(id);
}

/**
 * 检查是否为有效的 YouTube 频道 ID
 */
export function isValidYoutubeChannelId(id: string): boolean {
  const regex = /^UC[a-zA-Z0-9_-]{22}$/;
  return regex.test(id);
}

/**
 * 检查是否为有效的 YouTube 播放列表 ID
 */
export function isValidYoutubePlaylistId(id: string): boolean {
  const regex = /^[a-zA-Z0-9_-]{34}$/;
  return regex.test(id);
}

/**
 * 从 YouTube URL 中提取视频 ID
 */
export function extractYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * 从 YouTube URL 中提取频道 ID
 */
export function extractYoutubeChannelId(url: string): string | null {
  const patterns = [
    /\/channel\/(UC[a-zA-Z0-9_-]{22})/,
    /\/c\/([^/?]+)/,
    /\/user\/([^/?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * 检查字符串是否为空
 */
export function isEmpty(str: string | null | undefined): boolean {
  return str === null || str === undefined || str.trim().length === 0;
}

/**
 * 检查对象是否为空
 */
export function isEmptyObject(obj: any): boolean {
  if (obj === null || obj === undefined) return true;
  return Object.keys(obj).length === 0;
}

/**
 * 检查数组是否为空
 */
export function isEmptyArray(arr: any[] | null | undefined): boolean {
  return arr === null || arr === undefined || arr.length === 0;
}

/**
 * 检查是否为有效的手机号
 */
export function isValidPhone(phone: string): boolean {
  const regex = /^\+?[1-9]\d{1,14}$/;
  return regex.test(phone.replace(/[\s-]/g, ''));
}

/**
 * 检查是否为有效的 UUID
 */
export function isValidUuid(uuid: string): boolean {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

/**
 * 检查是否为整数
 */
export function isInteger(value: any): boolean {
  return Number.isInteger(value);
}

/**
 * 检查是否为正数
 */
export function isPositive(value: number): boolean {
  return typeof value === 'number' && value > 0;
}

/**
 * 检查是否在范围内
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * 检查密码强度
 */
export function checkPasswordStrength(password: string): {
  strength: 'weak' | 'medium' | 'strong';
  score: number;
} {
  let score = 0;
  
  // 长度
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // 复杂度
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  let strength: 'weak' | 'medium' | 'strong';
  if (score < 3) strength = 'weak';
  else if (score < 5) strength = 'medium';
  else strength = 'strong';
  
  return { strength, score };
}
