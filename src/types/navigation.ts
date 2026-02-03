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
    ],
  },
  {
    id: 'analysis',
    label: '深度分析',
    icon: '🔍',
    path: '/analysis',
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
