export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  path: string;
  children?: NavItem[];
}

export const navItems: NavItem[] = [
  {
    id: 'overview',
    label: '数据总览',
    icon: '🏠',
    path: '/overview',
  },
  {
    id: 'videos',
    label: '视频监控',
    icon: '📹',
    path: '/videos',
    children: [
      { id: 'video-list', label: '视频列表', path: '/videos' },
      { id: 'video-add', label: '添加视频', path: '/videos/add' },
      { id: 'owners', label: '负责人管理', path: '/owners' },
      { id: 'groups', label: '分组管理', path: '/groups' },
    ],
  },
  {
    id: 'analysis',
    label: '深度分析',
    icon: '🔍',
    path: '/analysis',
    children: [
      { id: 'video-analysis', label: '视频分析', path: '/analysis' },
      { id: 'channel-analysis', label: '博主分析', path: '/analysis/channels' },
      { id: 'owner-performance', label: '负责人绩效', path: '/analysis/owners' },
    ],
  },
  {
    id: 'suggestions',
    label: '优化建议',
    icon: '💡',
    path: '/suggestions',
    children: [
      { id: 'video-suggestions', label: '视频优化', path: '/suggestions' },
      { id: 'batch-suggestions', label: '批量优化', path: '/suggestions/batch' },
      { id: 'tracking', label: '优化追踪', path: '/suggestions/tracking' },
    ],
  },
  {
    id: 'trends',
    label: '热点趋势',
    icon: '🔥',
    path: '/trends',
    children: [
      { id: 'hot-topics', label: '热点话题', path: '/trends' },
      { id: 'hot-content', label: '热门内容', path: '/trends/content' },
      { id: 'topic-recommendation', label: '话题推荐', path: '/trends/recommendation' },
    ],
  },
  {
    id: 'settings',
    label: '设置管理',
    icon: '⚙️',
    path: '/settings',
    children: [
      { id: 'data-collection', label: '数据采集', path: '/settings/data' },
      { id: 'system-settings', label: '系统设置', path: '/settings/system' },
    ],
  },
];
