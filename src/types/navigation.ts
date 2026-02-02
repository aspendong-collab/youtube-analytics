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
    id: 'monitoring',
    label: '视频监控',
    icon: '📹',
    path: '/monitoring',
    children: [
      { id: 'video-list', label: '视频列表', path: '/monitoring' },
      { id: 'channel-analysis', label: '博主分析', path: '/monitoring/channels' },
      { id: 'owner-performance', label: '负责人绩效', path: '/monitoring/owners' },
    ],
  },
  {
    id: 'analysis',
    label: '深度分析',
    icon: '🔍',
    path: '/analysis',
    children: [
      { id: 'content-optimization', label: '内容优化', path: '/analysis/content' },
      { id: 'publishing-strategy', label: '发布策略', path: '/analysis/publishing' },
      { id: 'competition-analysis', label: '竞争分析', path: '/analysis/competition' },
      { id: 'audience-insights', label: '受众洞察', path: '/analysis/audience' },
      { id: 'cost-analysis', label: '成本分析', path: '/analysis/cost' },
      { id: 'content-diagnosis', label: '内容诊断', path: '/analysis/diagnosis' },
      { id: 'trend-insights', label: '趋势洞察', path: '/analysis/trends' },
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
      { id: 'data-collection', label: '数据采集', path: '/settings/data' },
      { id: 'system-settings', label: '系统设置', path: '/settings/system' },
    ],
  },
];
