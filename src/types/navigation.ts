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
    ],
  },
  {
    id: 'content-optimization',
    label: '内容优化',
    icon: '✨',
    path: '/analysis',
    children: [
      { id: 'title-optimization', label: '标题优化', path: '/analysis' },
      { id: 'tags-optimization', label: '标签优化', path: '/analysis/tags' },
      { id: 'description-optimization', label: '描述优化', path: '/analysis/description' },
      { id: 'thumbnail-optimization', label: '封面优化', path: '/analysis/thumbnail' },
      { id: 'competition-analysis', label: '竞品分析', path: '/analysis/competition' },
      { id: 'content-diagnosis', label: '内容诊断', path: '/analysis/content-diagnosis' },
      { id: 'publishing-time', label: '发布时间', path: '/analysis/publishing' },
      { id: 'audience-analysis', label: '受众分析', path: '/analysis/audience' },
      { id: 'trends-tracking', label: '趋势追踪', path: '/analysis/tracking' },
    ],
  },
  {
    id: 'comments-analysis',
    label: '评论分析',
    icon: '💬',
    path: '/analysis/comments',
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
      { id: 'data-collection', label: '数据采集', path: '/settings/data' },
      { id: 'system-settings', label: '系统设置', path: '/settings/system' },
    ],
  },
];
