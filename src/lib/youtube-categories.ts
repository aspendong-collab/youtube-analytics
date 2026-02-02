/**
 * YouTube 视频分类映射表
 * ID 到中文名称的映射
 */
export const YOUTUBE_CATEGORIES: Record<string, string> = {
  '1': '电影与动画',
  '2': '汽车与交通',
  '10': '音乐',
  '15': '宠物与动物',
  '17': '体育',
  '18': '短片',
  '19': '旅行与活动',
  '20': '游戏',
  '21': '视频博客',
  '22': '人物与博客',
  '23': '喜剧',
  '24': '娱乐',
  '25': '新闻与政治',
  '26': '操作指南与时尚',
  '27': '教育',
  '28': '科学与技术',
};

/**
 * 获取分类名称
 * @param categoryId 分类ID
 * @returns 分类名称，如果ID不存在则返回"未分类"
 */
export function getCategoryName(categoryId: string | number | null | undefined): string {
  if (categoryId === null || categoryId === undefined) {
    return '未分类';
  }
  const id = String(categoryId);
  return YOUTUBE_CATEGORIES[id] || '未分类';
}

/**
 * 获取所有分类列表
 * @returns 分类对象数组 [{id, name}]
 */
export function getAllCategories() {
  return Object.entries(YOUTUBE_CATEGORIES).map(([id, name]) => ({
    id,
    name,
  }));
}
