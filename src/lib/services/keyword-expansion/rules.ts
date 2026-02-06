import { KeywordRule, KeywordDimension, ExpansionResult, SupportedLanguage } from './types';

// 多语言规则模板
const LANGUAGE_RULE_TEMPLATES: Record<SupportedLanguage, Record<KeywordDimension, string[]>> = {
  'en': {
    scenario: [
      'how to use {keyword}', 'using {keyword} for', '{keyword} tips for', 'best {keyword} for',
      '{keyword} for beginners', '{keyword} tutorial', '{keyword} guide', '{keyword} tricks',
      'how to use {keyword} for work', '{keyword} for business', '{keyword} for students',
      '{keyword} for home', '{keyword} for office', '{keyword} for travel',
      'beginner {keyword}', 'professional {keyword}', 'daily use {keyword}',
      '{keyword} for gaming', '{keyword} for design', '{keyword} for development',
    ],
    carrier: [
      '{keyword} for iPhone', '{keyword} for Android', '{keyword} for iPad',
      '{keyword} for Windows', '{keyword} for Mac', '{keyword} for Linux',
      '{keyword} for web', '{keyword} for desktop', '{keyword} for mobile',
      '{keyword} app', '{keyword} software', '{keyword} tool', '{keyword} extension',
    ],
    state: [
      'free {keyword}', 'paid {keyword}', 'best {keyword}', 'top {keyword}',
      'recommended {keyword}', 'popular {keyword}', 'latest {keyword}', 'new {keyword}',
      'professional {keyword}', 'basic {keyword}', 'advanced {keyword}', 'premium {keyword}',
      'online {keyword}', 'offline {keyword}', 'cloud {keyword}', 'local {keyword}',
    ],
    goal: [
      'using {keyword} to learn', 'using {keyword} to make money', '{keyword} for productivity',
      '{keyword} for business', '{keyword} for education', '{keyword} for solving problems',
      '{keyword} for organization', '{keyword} for collaboration', '{keyword} for automation',
    ],
    method: [
      'how to {keyword}', '{keyword} tutorial', '{keyword} guide', '{keyword} tips',
      '{keyword} tricks', '{keyword} hacks', 'best way to {keyword}', '{keyword} tutorial',
      '{keyword} step by step', '{keyword} for beginners', 'learn {keyword}',
    ],
  },
  'zh-CN': {
    scenario: [
      '{keyword}怎么用', '{keyword}使用方法', '{keyword}使用教程', '{keyword}使用技巧',
      '如何使用{keyword}', '{keyword}怎么用最好', '{keyword}使用指南', '{keyword}使用步骤',
      '{keyword}使用场景', '{keyword}常见用法', '{keyword}实用技巧', '{keyword}正确使用方法',
      '{keyword}进阶用法', '{keyword}高级用法', '{keyword}专业用法', '{keyword}初学者怎么用',
      '{keyword}入门用法', '{keyword}快捷用法', '{keyword}日常用法', '{keyword}特别用法',
      '{keyword}正确姿势', '{keyword}使用流程', '{keyword}上手指南', '{keyword}实战用法',
      '新手用{keyword}', '老手用{keyword}', '小白用{keyword}', '专业用{keyword}',
      '日常用{keyword}', '办公用{keyword}', '家用{keyword}', '学生用{keyword}',
      '商务用{keyword}', '旅行用{keyword}', '户外用{keyword}', '室内用{keyword}',
    ],
    carrier: [
      '手机{keyword}', '电脑{keyword}', '平板{keyword}', '笔记本{keyword}',
      '台式机{keyword}', '安卓{keyword}', '苹果{keyword}', 'Windows{keyword}',
      'Mac{keyword}', 'Linux{keyword}', '网页{keyword}', '桌面{keyword}',
      '{keyword}软件', '{keyword}应用', '{keyword}工具', '{keyword}插件',
      '{keyword}APP', '{keyword}小程序', '{keyword}网页版', '{keyword}客户端',
    ],
    state: [
      '免费{keyword}', '付费{keyword}', '推荐{keyword}', '热门{keyword}',
      '最新{keyword}', '最佳{keyword}', '高级{keyword}', '专业{keyword}',
      '开源{keyword}', '商业{keyword}', '在线{keyword}', '离线{keyword}',
      '云{keyword}', '本地{keyword}', '跨平台{keyword}', '多端{keyword}',
    ],
    goal: [
      '赚钱{keyword}', '学习{keyword}', '教程{keyword}', '入门{keyword}',
      '精通{keyword}', '变现{keyword}', '副业{keyword}', '提升效率{keyword}',
      '办公{keyword}', '设计{keyword}', '开发{keyword}', '运营{keyword}',
      '自动化{keyword}', '协作{keyword}', '组织{keyword}', '管理{keyword}',
    ],
    method: [
      '怎么{keyword}', '如何{keyword}', '{keyword}方法', '{keyword}技巧',
      '{keyword}教程', '{keyword}步骤', '{keyword}流程', '{keyword}指南',
      '{keyword}学习', '{keyword}使用', '{keyword}配置', '{keyword}安装',
      '{keyword}优化', '{keyword}设置', '{keyword}操作', '{keyword}实战',
    ],
  },
  'zh-TW': {
    scenario: [
      '{keyword}怎麼用', '{keyword}使用方法', '{keyword}使用教學', '{keyword}使用技巧',
      '如何使用{keyword}', '{keyword}怎麼用最好', '{keyword}使用指南', '{keyword}使用步驟',
      '{keyword}使用場景', '{keyword}常見用法', '{keyword}實用技巧', '{keyword}正確使用方法',
      '{keyword}進階用法', '{keyword}高級用法', '{keyword}專業用法', '{keyword}初學者怎麼用',
    ],
    carrier: [
      '手機{keyword}', '電腦{keyword}', '平板{keyword}', '筆記本{keyword}',
      '桌面機{keyword}', 'Android{keyword}', 'iOS{keyword}', 'Windows{keyword}',
      'Mac{keyword}', 'Linux{keyword}', '網頁{keyword}', '桌面{keyword}',
    ],
    state: [
      '免費{keyword}', '付費{keyword}', '推薦{keyword}', '熱門{keyword}',
      '最新{keyword}', '最佳{keyword}', '高級{keyword}', '專業{keyword}',
      '開源{keyword}', '商業{keyword}', '線上{keyword}', '離線{keyword}',
    ],
    goal: [
      '賺錢{keyword}', '學習{keyword}', '教學{keyword}', '入門{keyword}',
      '精通{keyword}', '變現{keyword}', '副業{keyword}', '提升效率{keyword}',
    ],
    method: [
      '怎麼{keyword}', '如何{keyword}', '{keyword}方法', '{keyword}技巧',
      '{keyword}教學', '{keyword}步驟', '{keyword}流程', '{keyword}指南',
      '{keyword}學習', '{keyword}使用', '{keyword}配置', '{keyword}安裝',
    ],
  },
  'ja': {
    scenario: [
      '{keyword}の使い方', '{keyword}使用方法', '{keyword}チュートリアル', '{keyword}使用テクニック',
      '{keyword}の使い方を学ぶ', '{keyword}のベストな使い方', '{keyword}ガイド', '{keyword}手順',
      '{keyword}使用シーン', '{keyword}一般的な使い方', '{keyword}実用的なテクニック', '{keyword}正しい使い方',
      '{keyword}上級編', '{keyword}プロ向け', '{keyword}初心者向けの使い方',
      '{keyword}入門編', '{keyword}クイックスタート', '{keyword}日常の使い方', '{keyword}特別な使い方',
      '初心者用{keyword}', 'プロ用{keyword}', '日常{keyword}', 'オフィス{keyword}',
      '家庭用{keyword}', '学生用{keyword}', 'ビジネス用{keyword}', '旅行用{keyword}',
    ],
    carrier: [
      '{keyword} for iPhone', '{keyword} for Android', '{keyword} for iPad',
      '{keyword} for Windows', '{keyword} for Mac', '{keyword} for Linux',
      '{keyword} web', '{keyword} デスクトップ', '{keyword} モバイル',
      '{keyword} アプリ', '{keyword} ソフトウェア', '{keyword} ツール', '{keyword} 拡張機能',
    ],
    state: [
      '無料{keyword}', '有料{keyword}', 'おすすめ{keyword}', '人気{keyword}',
      '最新{keyword}', 'ベスト{keyword}', '高度{keyword}', 'プロフェッショナル{keyword}',
      'オープンソース{keyword}', '商用{keyword}', 'オンライン{keyword}', 'オフライン{keyword}',
    ],
    goal: [
      '{keyword}で稼ぐ', '{keyword}で学ぶ', '{keyword}チュートリアル', '{keyword}入門',
      '{keyword}マスター', '{keyword}で稼ぐ', '{keyword}副業', '生産性向上{keyword}',
      'オフィス{keyword}', 'デザイン{keyword}', '開発{keyword}', '運用{keyword}',
    ],
    method: [
      '{keyword}のやり方', '{keyword}の方法', '{keyword}テクニック', '{keyword}チュートリアル',
      '{keyword}ステップ', '{keyword}プロセス', '{keyword}ガイド', '{keyword}学習',
      '{keyword}使用', '{keyword}設定', '{keyword}インストール', '{keyword}最適化',
    ],
  },
  'ko': {
    scenario: [
      '{keyword} 사용법', '{keyword} 사용 방법', '{keyword} 튜토리얼', '{keyword} 사용 팁',
      '{keyword} 사용법 배우기', '{keyword} 최적 사용법', '{keyword} 가이드', '{keyword} 단계',
      '{keyword} 사용 시나리오', '{keyword} 일반 사용법', '{keyword} 실용 팁', '{keyword} 올바른 사용법',
      '{keyword} 고급 사용법', '{keyword} 전문가용', '{keyword} 초보자 사용법',
      '{keyword} 입문', '{keyword} 빠른 시작', '{keyword} 일상 사용법', '{keyword} 특별 사용법',
      '초보자용 {keyword}', '전문가용 {keyword}', '일상용 {keyword}', '사무실용 {keyword}',
      '가정용 {keyword}', '학생용 {keyword}', '비즈니스용 {keyword}', '여행용 {keyword}',
    ],
    carrier: [
      '{keyword} for iPhone', '{keyword} for Android', '{keyword} for iPad',
      '{keyword} for Windows', '{keyword} for Mac', '{keyword} for Linux',
      '{keyword} 웹', '{keyword} 데스크탑', '{keyword} 모바일',
      '{keyword} 앱', '{keyword} 소프트웨어', '{keyword} 도구', '{keyword} 확장',
    ],
    state: [
      '무료 {keyword}', '유료 {keyword}', '추천 {keyword}', '인기 {keyword}',
      '최신 {keyword}', '최고 {keyword}', '고급 {keyword}', '전문가용 {keyword}',
      '오픈소스 {keyword}', '상업용 {keyword}', '온라인 {keyword}', '오프라인 {keyword}',
    ],
    goal: [
      '{keyword}로 돈 버는 법', '{keyword}로 학습하기', '{keyword} 튜토리얼', '{keyword} 입문',
      '{keyword} 마스터', '{keyword} 수익화', '{keyword} 부업', '생산성 향상 {keyword}',
      '사무실용 {keyword}', '디자인 {keyword}', '개발 {keyword}', '운영 {keyword}',
    ],
    method: [
      '{keyword} 하는 법', '{keyword} 방법', '{keyword} 팁', '{keyword} 튜토리얼',
      '{keyword} 단계', '{keyword} 프로세스', '{keyword} 가이드', '{keyword} 학습',
      '{keyword} 사용', '{keyword} 설정', '{keyword} 설치', '{keyword} 최적화',
    ],
  },
  'fr': {
    scenario: [
      'comment utiliser {keyword}', '{keyword} tutoriel', '{keyword} astuces', 'meilleur {keyword} pour',
      '{keyword} pour débutants', '{keyword} guide', 'utiliser {keyword} pour', '{keyword} pour le travail',
      '{keyword} pour les affaires', '{keyword} pour les étudiants', '{keyword} pour la maison',
      '{keyword} pour le bureau', '{keyword} pour les voyages',
    ],
    carrier: [
      '{keyword} pour iPhone', '{keyword} pour Android', '{keyword} pour iPad',
      '{keyword} pour Windows', '{keyword} pour Mac', '{keyword} pour Linux',
      '{keyword} web', '{keyword} bureau', '{keyword} mobile', '{keyword} application',
    ],
    state: [
      '{keyword} gratuit', '{keyword} payant', 'meilleur {keyword}', '{keyword} populaire',
      '{keyword} récent', '{keyword} professionnel', '{keyword} avancé', '{keyword} premium',
    ],
    goal: [
      'utiliser {keyword} pour apprendre', '{keyword} pour gagner de l\'argent', '{keyword} pour la productivité',
      '{keyword} pour les affaires', '{keyword} pour l\'éducation', '{keyword} pour résoudre des problèmes',
    ],
    method: [
      'comment {keyword}', '{keyword} tutoriel', '{keyword} guide', '{keyword} astuces',
      '{keyword} étape par étape', '{keyword} pour débutants', 'apprendre {keyword}',
    ],
  },
  'de': {
    scenario: [
      'wie man {keyword} verwendet', '{keyword} Tutorial', '{keyword} Tipps', 'bester {keyword} für',
      '{keyword} für Anfänger', '{keyword} Leitfaden', '{keyword} verwenden für', '{keyword} für die Arbeit',
      '{keyword} für Unternehmen', '{keyword} für Studenten', '{keyword} für Zuhause',
      '{keyword} für das Büro', '{keyword} für Reisen',
    ],
    carrier: [
      '{keyword} für iPhone', '{keyword} für Android', '{keyword} für iPad',
      '{keyword} für Windows', '{keyword} für Mac', '{keyword} für Linux',
      '{keyword} Web', '{keyword} Desktop', '{keyword} Mobile', '{keyword} App',
    ],
    state: [
      'kostenloser {keyword}', 'bezahlter {keyword}', 'bester {keyword}', '{keyword} beliebt',
      '{keyword} neu', '{keyword} professionell', '{keyword} fortgeschritten', '{keyword} Premium',
    ],
    goal: [
      '{keyword} zum Lernen verwenden', '{keyword} Geld verdienen', '{keyword} für Produktivität',
      '{keyword} für Unternehmen', '{keyword} für Bildung', '{keyword} zum Problemlösen',
    ],
    method: [
      'wie man {keyword}', '{keyword} Tutorial', '{keyword} Anleitung', '{keyword} Tipps',
      '{keyword} Schritt für Schritt', '{keyword} für Anfänger', '{keyword} lernen',
    ],
  },
  'es': {
    scenario: [
      'cómo usar {keyword}', '{keyword} tutorial', '{keyword} consejos', 'mejor {keyword} para',
      '{keyword} para principiantes', '{keyword} guía', 'usar {keyword} para', '{keyword} para trabajo',
      '{keyword} para negocios', '{keyword} para estudiantes', '{keyword} para casa',
      '{keyword} para oficina', '{keyword} para viajes',
    ],
    carrier: [
      '{keyword} para iPhone', '{keyword} para Android', '{keyword} para iPad',
      '{keyword} para Windows', '{keyword} para Mac', '{keyword} para Linux',
      '{keyword} web', '{keyword} escritorio', '{keyword} móvil', '{keyword} aplicación',
    ],
    state: [
      '{keyword} gratis', '{keyword} de pago', 'mejor {keyword}', '{keyword} popular',
      '{keyword} nuevo', '{keyword} profesional', '{keyword} avanzado', '{keyword} premium',
    ],
    goal: [
      'usar {keyword} para aprender', '{keyword} para ganar dinero', '{keyword} para productividad',
      '{keyword} para negocios', '{keyword} para educación', '{keyword} para resolver problemas',
    ],
    method: [
      'cómo {keyword}', '{keyword} tutorial', '{keyword} guía', '{keyword} consejos',
      '{keyword} paso a paso', '{keyword} para principiantes', 'aprender {keyword}',
    ],
  },
  'it': {
    scenario: [
      'come usare {keyword}', '{keyword} tutorial', '{keyword} consigli', 'miglior {keyword} per',
      '{keyword} per principianti', '{keyword} guida', 'usare {keyword} per', '{keyword} per lavoro',
      '{keyword} per affari', '{keyword} per studenti', '{keyword} per casa',
      '{keyword} per ufficio', '{keyword} per viaggi',
    ],
    carrier: [
      '{keyword} per iPhone', '{keyword} per Android', '{keyword} per iPad',
      '{keyword} per Windows', '{keyword} per Mac', '{keyword} per Linux',
      '{keyword} web', '{keyword} desktop', '{keyword} mobile', '{keyword} app',
    ],
    state: [
      '{keyword} gratuito', '{keyword} a pagamento', 'miglior {keyword}', '{keyword} popolare',
      '{keyword} nuovo', '{keyword} professionale', '{keyword} avanzato', '{keyword} premium',
    ],
    goal: [
      'usare {keyword} per imparare', '{keyword} per guadagnare', '{keyword} per produttività',
      '{keyword} per affari', '{keyword} per istruzione', '{keyword} per risolvere problemi',
    ],
    method: [
      'come {keyword}', '{keyword} tutorial', '{keyword} guida', '{keyword} consigli',
      '{keyword} passo dopo passo', '{keyword} per principianti', 'imparare {keyword}',
    ],
  },
  'pt': {
    scenario: [
      'como usar {keyword}', '{keyword} tutorial', '{keyword} dicas', 'melhor {keyword} para',
      '{keyword} para iniciantes', '{keyword} guia', 'usar {keyword} para', '{keyword} para trabalho',
      '{keyword} para negocios', '{keyword} para estudantes', '{keyword} para casa',
      '{keyword} para escritório', '{keyword} para viagens',
    ],
    carrier: [
      '{keyword} para iPhone', '{keyword} para Android', '{keyword} para iPad',
      '{keyword} para Windows', '{keyword} para Mac', '{keyword} para Linux',
      '{keyword} web', '{keyword} desktop', '{keyword} mobile', '{keyword} aplicativo',
    ],
    state: [
      '{keyword} gratuito', '{keyword} pago', 'melhor {keyword}', '{keyword} popular',
      '{keyword} novo', '{keyword} profissional', '{keyword} avançado', '{keyword} premium',
    ],
    goal: [
      'usar {keyword} para aprender', '{keyword} para ganhar dinheiro', '{keyword} para produtividade',
      '{keyword} para negocios', '{keyword} para educação', '{keyword} para resolver problemas',
    ],
    method: [
      'como {keyword}', '{keyword} tutorial', '{keyword} guia', '{keyword} dicas',
      '{keyword} passo a passo', '{keyword} para iniciantes', 'aprender {keyword}',
    ],
  },
};

// 规则库：多维度关键词拓展规则（保留原有结构用于兼容）
export const EXPANSION_RULES: Record<KeywordDimension, KeywordRule[]> = {
  // 场景维度
  scenario: [
    {
      id: 'scenario-1',
      name: '使用场景-前缀',
      description: '在关键词前添加场景描述',
      dimension: 'scenario',
      patterns: ['{keyword}'],
      templates: [
        '{keyword}怎么用',
        '{keyword}使用方法',
        '{keyword}使用教程',
        '{keyword}使用技巧',
        '如何使用{keyword}',
        '{keyword}怎么用最好',
        '{keyword}使用指南',
        '{keyword}使用步骤',
        '{keyword}使用场景',
        '{keyword}常见用法',
        '{keyword}实用技巧',
        '{keyword}正确使用方法',
        '{keyword}进阶用法',
        '{keyword}高级用法',
        '{keyword}专业用法',
        '{keyword}初学者怎么用',
        '{keyword}入门用法',
        '{keyword}快捷用法',
        '{keyword}日常用法',
        '{keyword}特别用法',
        '{keyword}正确姿势',
        '{keyword}使用流程',
        '{keyword}上手指南',
        '{keyword}实战用法',
      ],
      priority: 1,
    },
    {
      id: 'scenario-2',
      name: '使用场景-后缀',
      description: '在关键词后添加场景描述',
      dimension: 'scenario',
      patterns: ['{keyword}'],
      templates: [
        '新手用{keyword}',
        '老手用{keyword}',
        '小白用{keyword}',
        '专业用{keyword}',
        '日常用{keyword}',
        '办公用{keyword}',
        '家用{keyword}',
        '学生用{keyword}',
        '商务用{keyword}',
        '旅行用{keyword}',
        '户外用{keyword}',
        '室内用{keyword}',
        '公司用{keyword}',
        '家庭用{keyword}',
        '个人用{keyword}',
        '团队用{keyword}',
        '校园用{keyword}',
        '游戏用{keyword}',
        '设计用{keyword}',
        '剪辑用{keyword}',
        '开发用{keyword}',
        '运营用{keyword}',
      ],
      priority: 2,
    },
    {
      id: 'scenario-3',
      name: '特定场景',
      description: '针对特定使用场景',
      dimension: 'scenario',
      patterns: ['{keyword}'],
      templates: [
        '{keyword}开车时',
        '{keyword}开会时',
        '{keyword}做饭时',
        '{keyword}运动时',
        '{keyword}学习时',
        '{keyword}工作用',
        '{keyword}娱乐用',
        '{keyword}睡觉前',
        '{keyword}早起用',
        '{keyword}通勤用',
        '{keyword}约会用',
        '{keyword}聚会用',
        '{keyword}健身时',
        '{keyword}带娃用',
        '{keyword}赶路用',
        '{keyword}周末用',
        '{keyword}下班用',
        '{keyword}考试前',
        '{keyword}面试前',
        '{keyword}旅行前',
        '{keyword}出国用',
      ],
      priority: 3,
    },
  ],

  // 载体维度
  carrier: [
    {
      id: 'carrier-1',
      name: '设备载体',
      description: '关键词使用的设备载体',
      dimension: 'carrier',
      patterns: ['{keyword}'],
      templates: [
        '手机{keyword}',
        '电脑{keyword}',
        '平板{keyword}',
        '笔记本{keyword}',
        '台式机{keyword}',
        'iPhone{keyword}',
        '安卓{keyword}',
        'iPad{keyword}',
        'Mac{keyword}',
        'Windows{keyword}',
        '安卓手机{keyword}',
        '华为手机{keyword}',
        '小米手机{keyword}',
        'OPPO手机{keyword}',
        'vivo手机{keyword}',
        '三星手机{keyword}',
        'Surface{keyword}',
        'Chromebook{keyword}',
        '台式电脑{keyword}',
        '一体机{keyword}',
        '掌机{keyword}',
        '游戏机{keyword}',
      ],
      priority: 1,
    },
    {
      id: 'carrier-2',
      name: '平台载体',
      description: '关键词使用的平台载体',
      dimension: 'carrier',
      patterns: ['{keyword}'],
      templates: [
        '微信{keyword}',
        '抖音{keyword}',
        '快手{keyword}',
        '小红书{keyword}',
        'B站{keyword}',
        '知乎{keyword}',
        '微博{keyword}',
        '头条{keyword}',
        '淘宝{keyword}',
        '京东{keyword}',
        '拼多多{keyword}',
        '支付宝{keyword}',
        '拼多多{keyword}',
        '美团{keyword}',
        '大众点评{keyword}',
        '腾讯视频{keyword}',
        '爱奇艺{keyword}',
        '优酷{keyword}',
        '哔哩哔哩{keyword}',
        '喜马拉雅{keyword}',
        '网易云音乐{keyword}',
        '酷狗音乐{keyword}',
      ],
      priority: 2,
    },
    {
      id: 'carrier-3',
      name: '系统载体',
      description: '关键词使用的操作系统载体',
      dimension: 'carrier',
      patterns: ['{keyword}'],
      templates: [
        'iOS{keyword}',
        'Android{keyword}',
        'Windows{keyword}',
        'MacOS{keyword}',
        'Linux{keyword}',
        '鸿蒙{keyword}',
        '鸿蒙系统{keyword}',
        '安卓系统{keyword}',
        '苹果系统{keyword}',
        'Windows系统{keyword}',
        'iOS系统{keyword}',
        'iPadOS{keyword}',
        'ChromeOS{keyword}',
        'Ubuntu{keyword}',
        'CentOS{keyword}',
        'Debian{keyword}',
        'Kali{keyword}',
        'Manjaro{keyword}',
        'Arch Linux{keyword}',
        'Windows 11{keyword}',
        'Windows 10{keyword}',
      ],
      priority: 3,
    },
  ],

  // 状态维度
  state: [
    {
      id: 'state-1',
      name: '状态-前缀',
      description: '在关键词前添加状态描述',
      dimension: 'state',
      patterns: ['{keyword}'],
      templates: [
        '免费的{keyword}',
        '付费的{keyword}',
        '最新{keyword}',
        '热门{keyword}',
        '好用{keyword}',
        '推荐{keyword}',
        '高级{keyword}',
        '专业{keyword}',
        '入门{keyword}',
        '基础{keyword}',
        '进阶{keyword}',
        '简单{keyword}',
        '复杂{keyword}',
        '快速{keyword}',
        '慢速{keyword}',
        '永久免费{keyword}',
        '官方{keyword}',
        '正版{keyword}',
        '破解版{keyword}',
        '绿色版{keyword}',
        '便携版{keyword}',
        '安装版{keyword}',
      ],
      priority: 1,
    },
    {
      id: 'state-2',
      name: '状态-后缀',
      description: '在关键词后添加状态描述',
      dimension: 'state',
      patterns: ['{keyword}'],
      templates: [
        '{keyword}推荐',
        '{keyword}排行',
        '{keyword}排名',
        '{keyword}对比',
        '{keyword}测评',
        '{keyword}评价',
        '{keyword}评测',
        '{keyword}体验',
        '{keyword}效果',
        '{keyword}怎么样',
        '{keyword}好用吗',
        '{keyword}值得买吗',
        '{keyword}怎么选',
        '{keyword}选哪个好',
        '{keyword}哪个牌子好',
        '{keyword}性价比',
        '{keyword}优惠',
        '{keyword}折扣',
        '{keyword}促销',
        '{keyword}活动',
        '{keyword}特价',
        '{keyword}免费版',
        '{keyword}会员版',
      ],
      priority: 2,
    },
    {
      id: 'state-3',
      name: '状态描述',
      description: '描述关键词的状态特征',
      dimension: 'state',
      patterns: ['{keyword}'],
      templates: [
        '{keyword}好不好用',
        '{keyword}有没有用',
        '{keyword}是不是真的',
        '{keyword}靠谱吗',
        '{keyword}有效果吗',
        '{keyword}多久见效',
        '{keyword}有没有副作用',
        '{keyword}安全吗',
        '{keyword}合法吗',
        '{keyword}正规吗',
        '{keyword}真伪辨别',
        '{keyword}避坑指南',
        '{keyword}常见陷阱',
        '{keyword}坑不坑',
        '{keyword}靠谱吗',
        '{keyword}值不值',
        '{keyword}有必要吗',
        '{keyword}实用吗',
        '{keyword}高效吗',
        '{keyword}稳定吗',
        '{keyword}兼容性',
        '{keyword}兼容吗',
      ],
      priority: 3,
    },
  ],

  // 目标维度
  goal: [
    {
      id: 'goal-1',
      name: '学习目标',
      description: '用户学习的目标',
      dimension: 'goal',
      patterns: ['{keyword}'],
      templates: [
        '学习{keyword}',
        '学会{keyword}',
        '掌握{keyword}',
        '{keyword}入门',
        '{keyword}基础',
        '{keyword}从零开始',
        '{keyword}新手教程',
        '{keyword}自学',
        '如何学习{keyword}',
        '{keyword}怎么学',
        '{keyword}速成',
        '{keyword}快速入门',
        '{keyword}系统学习',
        '{keyword}深度学习',
        '{keyword}进阶学习',
        '{keyword}高级教程',
        '{keyword}精通',
        '{keyword}大神',
        '{keyword}学习路线',
        '{keyword}学习计划',
        '{keyword}学习资料',
        '{keyword}学习资源',
      ],
      priority: 1,
    },
    {
      id: 'goal-2',
      name: '使用目标',
      description: '用户的使用目标',
      dimension: 'goal',
      patterns: ['{keyword}'],
      templates: [
        '{keyword}赚钱',
        '{keyword}赚钱方法',
        '{keyword}变现',
        '{keyword}副业',
        '{keyword}兼职',
        '用{keyword}赚钱',
        '{keyword}创业',
        '{keyword}就业',
        '{keyword}求职',
        '{keyword}面试',
        '{keyword}职业发展',
        '{keyword}职业规划',
        '{keyword}职业前景',
        '{keyword}转行',
        '{keyword}跳槽',
        '{keyword}升职加薪',
        '{keyword}涨工资',
        '{keyword}自由职业',
        '{keyword}远程工作',
        '{keyword}被动收入',
        '{keyword}睡后收入',
        '{keyword}搞钱',
      ],
      priority: 2,
    },
    {
      id: 'goal-3',
      name: '解决问题目标',
      description: '用户解决特定问题的目标',
      dimension: 'goal',
      patterns: ['{keyword}'],
      templates: [
        '{keyword}解决什么问题',
        '{keyword}能做什么',
        '{keyword}有什么用',
        '{keyword}能解决什么',
        '{keyword}的作用',
        '{keyword}的好处',
        '{keyword}的优点',
        '{keyword}缺点',
        '{keyword}避坑',
        '{keyword}注意事项',
        '{keyword}常见问题',
        '{keyword}适用人群',
        '{keyword}适合谁',
        '{keyword}能帮你做什么',
        '{keyword}主要功能',
        '{keyword}核心功能',
        '{keyword}实际应用',
        '{keyword}典型案例',
        '{keyword}成功案例',
        '{keyword}失败案例',
        '{keyword}优缺点对比',
        '{keyword}弊端',
      ],
      priority: 3,
    },
  ],

  // 方法维度
  method: [
    {
      id: 'method-1',
      name: '学习方法',
      description: '学习某事物的方法',
      dimension: 'method',
      patterns: ['{keyword}'],
      templates: [
        '{keyword}怎么学',
        '怎么学习{keyword}',
        '如何学习{keyword}',
        '{keyword}学习方法',
        '{keyword}学习技巧',
        '{keyword}学习经验',
        '{keyword}学习心得',
        '{keyword}学习步骤',
        '{keyword}学习流程',
        '{keyword}学习路线',
        '{keyword}学习计划',
        '{keyword}学习资源',
        '{keyword}学习材料',
        '{keyword}学习书籍',
        '{keyword}学习视频',
        '{keyword}学习课程',
        '{keyword}笔记',
        '{keyword}思维导图',
        '{keyword}重点',
        '{keyword}难点',
        '{keyword}考试',
        '{keyword}考证',
      ],
      priority: 1,
    },
    {
      id: 'method-2',
      name: '使用方法',
      description: '使用某事物的方法',
      dimension: 'method',
      patterns: ['{keyword}'],
      templates: [
        '{keyword}怎么用',
        '怎么使用{keyword}',
        '如何使用{keyword}',
        '{keyword}使用方法',
        '{keyword}使用技巧',
        '{keyword}使用心得',
        '{keyword}使用经验',
        '{keyword}操作方法',
        '{keyword}操作步骤',
        '{keyword}操作流程',
        '{keyword}使用教程',
        '{keyword}教学视频',
        '{keyword}演示视频',
        '{keyword}实战教程',
        '{keyword}入门教程',
        '{keyword}进阶教程',
        '{keyword}操作指南',
        '{keyword}快速上手',
        '{keyword}配置教程',
        '{keyword}安装教程',
        '{keyword}卸载教程',
      ],
      priority: 2,
    },
    {
      id: 'method-3',
      name: '实现方法',
      description: '实现某目标的方法',
      dimension: 'method',
      patterns: ['{keyword}'],
      templates: [
        '{keyword}怎么做',
        '怎么做{keyword}',
        '{keyword}制作方法',
        '{keyword}制作教程',
        '{keyword}制作流程',
        '{keyword}制作步骤',
        '{keyword}实现方法',
        '{keyword}实现教程',
        '{keyword}实现步骤',
        '{keyword}搭建教程',
        '{keyword}搭建方法',
        '{keyword}部署教程',
        '{keyword}开发教程',
        '{keyword}开发方法',
        '{keyword}开发步骤',
        '{keyword}配置方法',
        '{keyword}集成教程',
        '{keyword}连接教程',
        '{keyword}配置步骤',
        '{keyword}部署步骤',
        '{keyword}上线教程',
        '{keyword}发布教程',
      ],
      priority: 3,
    },
    {
      id: 'method-4',
      name: '优化方法',
      description: '优化某事物的方法',
      dimension: 'method',
      patterns: ['{keyword}'],
      templates: [
        '{keyword}优化',
        '{keyword}优化方法',
        '{keyword}优化技巧',
        '{keyword}优化方案',
        '{keyword}优化策略',
        '{keyword}提升',
        '{keyword}提升方法',
        '{keyword}提升技巧',
        '{keyword}改进',
        '{keyword}改进方法',
        '{keyword}改进建议',
        '{keyword}升级',
        '{keyword}升级教程',
        '{keyword}更新教程',
        '{keyword}加速',
        '{keyword}加速方法',
        '{keyword}提速',
        '{keyword}提速技巧',
        '{keyword}调优',
        '{keyword}调优教程',
        '{keyword}性能优化',
        '{keyword}效果优化',
        '{keyword}方案优化',
      ],
      priority: 4,
    },
  ],
};

// 规则引擎：基于规则库生成关键词
export class RuleEngine {
  private rules: Record<KeywordDimension, KeywordRule[]> = EXPANSION_RULES;

  // 应用规则生成关键词（支持多语言）
  applyRules(keyword: string, dimension: KeywordDimension, language: SupportedLanguage = 'zh-CN'): ExpansionResult[] {
    const dimensionRules = this.rules[dimension] || [];
    const results: ExpansionResult[] = [];

    // 使用多语言模板
    const languageTemplates = LANGUAGE_RULE_TEMPLATES[language]?.[dimension] || LANGUAGE_RULE_TEMPLATES['zh-CN']?.[dimension] || [];

    // 优先使用多语言模板
    for (const template of languageTemplates) {
      const generatedKeyword = template.replace(/{keyword}/g, keyword);
      results.push({
        keyword: generatedKeyword,
        dimension,
        source: 'rule',
        relevance: this.calculateRelevance(keyword, generatedKeyword),
        type: this.detectKeywordType(generatedKeyword),
        intent: this.detectKeywordIntent(generatedKeyword),
      });
    }

    // 如果没有多语言模板，使用原有规则（兼容性）
    if (languageTemplates.length === 0) {
      for (const rule of dimensionRules) {
        for (const template of rule.templates) {
          const generatedKeyword = template.replace(/{keyword}/g, keyword);
          results.push({
            keyword: generatedKeyword,
            dimension,
            source: 'rule',
            relevance: this.calculateRelevance(keyword, generatedKeyword),
            type: this.detectKeywordType(generatedKeyword),
            intent: this.detectKeywordIntent(generatedKeyword),
          });
        }
      }
    }

    return results;
  }

  // 应用所有维度的规则（支持多语言）
  applyAllRules(keyword: string, language: SupportedLanguage = 'zh-CN'): Record<KeywordDimension, ExpansionResult[]> {
    const dimensions: KeywordDimension[] = ['scenario', 'carrier', 'state', 'goal', 'method'];
    const results: Record<KeywordDimension, ExpansionResult[]> = {} as any;

    for (const dimension of dimensions) {
      results[dimension] = this.applyRules(keyword, dimension, language);
    }

    return results;
  }

  // 计算相关性（基于关键词相似度）
  private calculateRelevance(original: string, generated: string): number {
    const similarity = this.calculateSimilarity(original, generated);
    // 添加额外因子：包含原始词的得分更高
    const containsOriginal = generated.includes(original) ? 0.9 : 0.7;
    return (similarity * 0.3 + containsOriginal * 0.7);
  }

  // 计算字符串相似度
  private calculateSimilarity(str1: string, str2: string): number {
    const set1 = new Set(str1);
    const set2 = new Set(str2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }

  // 检测关键词类型
  private detectKeywordType(keyword: string): 'broad' | 'long-tail' | 'question' | 'brand' {
    if (keyword.includes('？') || keyword.includes('?') || keyword.includes('怎么') || keyword.includes('如何')) {
      return 'question';
    }
    if (keyword.split(/\s+/).length > 3) {
      return 'long-tail';
    }
    return 'broad';
  }

  // 检测搜索意图
  private detectKeywordIntent(keyword: string): 'info' | 'tutorial' | 'review' | 'transaction' {
    if (keyword.includes('教程') || keyword.includes('学习') || keyword.includes('方法') || keyword.includes('技巧')) {
      return 'tutorial';
    }
    if (keyword.includes('评价') || keyword.includes('测评') || keyword.includes('推荐') || keyword.includes('排行')) {
      return 'review';
    }
    if (keyword.includes('买') || keyword.includes('购买') || keyword.includes('价格') || keyword.includes('多少钱')) {
      return 'transaction';
    }
    return 'info';
  }
}

export const ruleEngine = new RuleEngine();
