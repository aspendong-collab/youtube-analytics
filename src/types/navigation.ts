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
      { id: 'keyword-search', label: '关键词检测', path: '/discovery/competitor' },
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
    ],
  },
  {
    id: 'competitor-analysis',
    label: '竞品分析',
    icon: '🎯',
    path: '/competitor',
  },
  {
    id: 'content-optimization',
    label: '内容优化',
    icon: '✨',
    path: '/analysis',
    children: [
      {
        id: 'basic-optimization',
        label: '基础优化',
        icon: '📝',
        children: [
          { id: 'title-optimization', label: '标题优化', path: '/analysis/basic/title' },
          { id: 'tags-optimization', label: '标签优化', path: '/analysis/basic/tags' },
          { id: 'description-optimization', label: '描述优化', path: '/analysis/basic/description' },
          { id: 'thumbnail-optimization', label: '封面优化', path: '/analysis/thumbnail' },
        ],
      },
      {
        id: 'keyword-research',
        label: '关键词研究',
        icon: '🔑',
        children: [
          { id: 'search-trends', label: '搜索趋势', path: '/analysis/keywords/trends' },
          { id: 'long-tail-keywords', label: '长尾关键词', path: '/analysis/keywords/long-tail' },
          { id: 'competition-analysis', label: '竞争度评估', path: '/analysis/keywords/competition' },
        ],
      },
      {
        id: 'content-diagnosis',
        label: '内容诊断',
        icon: '🩺',
        children: [
          { id: 'ab-test', label: 'A/B 测试', path: '/analysis/diagnostics/ab-test' },
          { id: 'ctr-prediction', label: '点击率预测', path: '/analysis/diagnostics/ctr-prediction' },
          { id: 'retention-analysis', label: '完播率分析', path: '/analysis/diagnostics/retention' },
        ],
      },
      {
        id: 'data-analysis',
        label: '数据分析',
        icon: '📊',
        children: [
          { id: 'channel-analysis', label: '频道分析', path: '/monitoring/channels/analysis' },
          { id: 'content-benchmark', label: '内容策略对标', path: '/analysis/data/benchmark' },
          { id: 'growth-analysis', label: '粉丝增长分析', path: '/analysis/data/growth' },
        ],
      },
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
