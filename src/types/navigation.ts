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
    id: 'discovery',
    label: '发现',
    icon: '🔎',
    path: '/discovery',
    children: [
      { id: 'trending', label: '热门排行榜', path: '/trending/ranking' },
      { id: 'ai-influencer', label: 'AI达人推荐', path: '/influencers/cover' },
      { id: 'keyword-expand', label: '关键词拓展', path: '/discovery/keywords' },
    ],
  },
  {
    id: 'monitoring',
    label: '视频监控',
    icon: '📹',
    path: '/monitoring',
    children: [
      { id: 'video-list', label: '视频列表', path: '/monitoring' },
      { id: 'channel-analysis', label: '博主分析', path: '/monitoring/channels' },
      { id: 'owner-performance', label: '排行榜', path: '/monitoring/owners' },
      { id: 'competitor-tracking', label: '竞品追踪', path: '/monitoring/competitors' },
      { id: 'comments-analysis', label: '评论分析', path: '/analysis/comments' },
    ],
  },
  {
    id: 'competitor-monitoring',
    label: '竞品监控',
    icon: '📈',
    path: '/competitor-monitoring',
    children: [
      { id: 'pdf-software', label: 'PDF软件', path: '/competitor-monitoring/pdf' },
    ],
  },
  {
    id: 'influencers',
    label: '达人管理',
    icon: '👥',
    path: '/influencers',
    children: [
      { id: 'my-influencers', label: '我的达人', path: '/my-influencers' },
      { id: 'influencer-list', label: '达人列表', path: '/influencers' },
    ],
  },
  {
    id: 'content-analysis',
    label: '内容分析',
    icon: '📊',
    path: '/content-analysis',
    children: [
      // Phase 1: 快速见效
      {
        id: 'performance-analysis',
        label: '内容表现分析',
        path: '/content-analysis/performance',
        icon: '📈'
      },
      {
        id: 'title-optimization',
        label: '标题与封面优化',
        path: '/content-analysis/title-optimization',
        icon: '🎯'
      },
      {
        id: 'content-diagnosis',
        label: '内容诊断',
        path: '/content-analysis/diagnosis',
        icon: '🩺'
      },
      // Phase 2: 深度优化
      {
        id: 'keyword-research',
        label: '关键词研究',
        path: '/content-analysis/keyword-research',
        icon: '🔑'
      },
      {
        id: 'publish-timing',
        label: '发布时机优化',
        path: '/content-analysis/publish-time',
        icon: '⏰'
      },
    ],
  },
  {
    id: 'owners',
    label: '负责人管理',
    icon: '👥',
    path: '/owners',
  },
  {
    id: 'settings',
    label: '设置管理',
    icon: '⚙️',
    path: '/settings',
    children: [
      { id: 'users', label: '用户管理', path: '/admin/users' },
      { id: 'data-collection', label: '数据采集', path: '/settings/data' },
      { id: 'system-settings', label: '系统设置', path: '/settings/system' },
    ],
  },
];
