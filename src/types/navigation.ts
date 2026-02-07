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
    label: '运营总览',
    icon: '🏠',
    path: '/overview',
  },
  {
    id: 'influencer-operations',
    label: '达人运营',
    icon: '📊',
    path: '/influencer-operations',
    children: [
      {
        id: 'discovery-management',
        label: '发现与管理',
        path: '/my-influencers',
        children: [
          { id: 'my-influencers', label: '我的达人库', path: '/my-influencers' },
          { id: 'influencer-list', label: '达人搜索', path: '/influencers' },
          { id: 'ai-influencer', label: 'AI 达人推荐', path: '/influencers/cover' },
        ]
      },
      {
        id: 'contact-negotiation',
        label: '联系与谈判',
        path: '/ai-assistant',
        children: [
          { id: 'ai-assistant', label: '智能沟通助手', path: '/ai-assistant' },
          { id: 'negotiation', label: '自动谈判助手', path: '/negotiation' },
        ]
      },
      {
        id: 'campaign-management',
        label: '营销活动',
        path: '/campaigns',
        children: [
          { id: 'campaigns', label: '活动管理', path: '/campaigns' },
          { id: 'campaign-data', label: '活动数据', path: '/dashboard' },
        ]
      },
    ],
  },
  {
    id: 'research-tools',
    label: '研究工具',
    icon: '🔬',
    path: '/research-tools',
    children: [
      { id: 'trending', label: '热门趋势', path: '/trending/ranking' },
      { id: 'keyword-research', label: '关键词挖掘', path: '/discovery/keywords' },
      { id: 'keyword-expansion', label: '关键词拓展', path: '/keyword-expansion' },
      { id: 'affiliate-search', label: 'Affiliate 搜索', path: '/affiliate-expansion' },
    ],
  },
  {
    id: 'content-operations',
    label: '内容运营',
    icon: '🎬',
    path: '/content-operations',
    children: [
      { id: 'performance', label: '内容表现', path: '/content-analysis/performance' },
      { id: 'title-optimization', label: '标题与封面优化', path: '/content-analysis/title-optimization' },
      { id: 'publish-timing', label: '发布时机优化', path: '/content-analysis/publish-time' },
      { id: 'content-diagnosis', label: '内容诊断', path: '/content-analysis/diagnosis' },
      { id: 'keyword-research', label: '关键词研究', path: '/content-analysis/keyword-research' },
    ],
  },
  {
    id: 'monitoring-center',
    label: '监控中心',
    icon: '📹',
    path: '/monitoring-center',
    children: [
      { id: 'video-list', label: '视频监控', path: '/monitoring' },
      { id: 'channel-analysis', label: '博主分析', path: '/monitoring/channels' },
      { id: 'competitor-tracking', label: '竞品追踪', path: '/monitoring/competitors' },
      { id: 'comments-analysis', label: '评论分析', path: '/analysis/comments' },
      { id: 'owner-performance', label: '排行榜', path: '/monitoring/owners' },
    ],
  },
  {
    id: 'owners',
    label: '团队管理',
    icon: '👥',
    path: '/owners',
  },
  {
    id: 'settings',
    label: '系统设置',
    icon: '⚙️',
    path: '/settings',
    children: [
      { id: 'users', label: '用户管理', path: '/admin/users' },
      { id: 'data-collection', label: '数据采集', path: '/settings/data' },
      { id: 'system-settings', label: '系统设置', path: '/settings/system' },
      { id: 'test-tools', label: '测试工具', path: '/test-tools' },
    ],
  },
];
