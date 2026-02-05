/**
 * 支持的语言列表
 */
export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region?: string;
  videoCount?: string;
  stopWords?: string[];
}

/**
 * 语言配置
 */
export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  // 中文
  'zh': {
    code: 'zh',
    name: '中文（简体）',
    nativeName: '中文',
    flag: '🇨🇳',
    region: 'CN',
    videoCount: '12亿',
    stopWords: ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'],
  },
  'zh-TW': {
    code: 'zh-TW',
    name: '中文（繁体）',
    nativeName: '中文',
    flag: '🇹🇼',
    region: 'TW',
    videoCount: '3,500万',
    stopWords: ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '個', '上', '也', '很', '到', '說', '要', '去', '你', '會', '著', '沒有', '看', '好', '自己', '這'],
  },

  // 英语
  'en': {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    region: 'US',
    videoCount: '120亿',
    stopWords: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me'],
  },

  // 西班牙语
  'es': {
    code: 'es',
    name: 'Español',
    nativeName: 'Español',
    flag: '🇪🇸',
    region: 'ES',
    videoCount: '85亿',
    stopWords: ['de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'fue', 'este', 'ha', 'sí', 'porque', 'esta', 'son', 'entre', 'está', 'cuando', 'muy', 'sin', 'sobre', 'también', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo'],
  },

  // 法语
  'fr': {
    code: 'fr',
    name: 'Français',
    nativeName: 'Français',
    flag: '🇫🇷',
    region: 'FR',
    videoCount: '53亿',
    stopWords: ['au', 'aux', 'avec', 'ce', 'ces', 'dans', 'de', 'des', 'du', 'elle', 'en', 'et', 'eux', 'il', 'je', 'la', 'le', 'leur', 'lui', 'ma', 'mais', 'me', 'même', 'mes', 'moi', 'mon', 'ne', 'nos', 'notre', 'nous', 'on', 'ou', 'par', 'pas', 'pour', 'qu', 'que', 'qui', 'sa', 'se', 'ses', 'son', 'sur', 'ta', 'te', 'tes', 'toi', 'ton', 'tu', 'un', 'une', 'vos', 'votre', 'vous'],
  },

  // 德语
  'de': {
    code: 'de',
    name: 'Deutsch',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    region: 'DE',
    videoCount: '41亿',
    stopWords: ['aber', 'als', 'am', 'an', 'auch', 'auf', 'aus', 'bei', 'bin', 'bis', 'bist', 'da', 'dadurch', 'dass', 'dein', 'deine', 'dem', 'den', 'der', 'des', 'deshalb', 'die', 'dies', 'diese', 'diesem', 'dieser', 'dir', 'doch', 'du', 'durch', 'ein', 'eine', 'einem', 'einen', 'einer', 'er', 'es', 'etwa', 'euch', 'euer', 'eure', 'für', 'hatte', 'hatten', 'hattest', 'hattet', 'hier', 'hinter', 'ich', 'ihr', 'ihre', 'im', 'in', 'ist', 'ja', 'jede', 'jedem', 'jeden', 'jeder', 'jedes', 'jener', 'jenes', 'jemand', 'jemandem', 'jemanden', 'jene', 'jenem', 'jenen', 'jener', 'jenes', 'mich', 'mir', 'mit', 'nach', 'nicht', 'nun', 'oder', 'seid', 'sein', 'seine', 'seinem', 'seinen', 'seiner', 'selbst', 'sich', 'sie', 'sind', 'so', 'solche', 'solchem', 'solchen', 'solcher', 'solches', 'soll', 'sollte', 'sondern', 'über', 'um', 'und', 'uns', 'unse', 'unsem', 'unsen', 'unser', 'unses', 'unter', 'vom', 'von', 'vor', 'wann', 'warum', 'was', 'weiter', 'weitere', 'weiterem', 'weiteren', 'weiterer', 'weiteres', 'wenn', 'wer', 'werde', 'werden', 'werdet', 'weshalb', 'wie', 'wieder', 'will', 'wir', 'wird', 'wo', 'woher', 'wohin', 'zu', 'zum', 'zur', 'zwar', 'zwischen'],
  },

  // 日语
  'ja': {
    code: 'ja',
    name: '日本語',
    nativeName: '日本語',
    flag: '🇯🇵',
    region: 'JP',
    videoCount: '89亿',
    stopWords: ['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ', 'ある', 'いる', 'も', 'する', 'から', 'な', 'こと', 'として', 'い', 'や', 'れる', 'など', 'なっ', 'ない', 'この', 'ため', 'その', 'あっ', 'よう', 'また', 'もの', 'という', 'あり', 'まで', 'られ', 'なる', 'へ', 'か', 'だ', 'これ', 'によって', 'により', 'おり', 'より', 'による', 'ず', 'なり', 'られる', 'において', 'ば', 'なかっ', 'なく', 'しかし', 'について', 'せ', 'だっ', 'その後', 'せる', 'した'],
  },

  // 韩语
  'ko': {
    code: 'ko',
    name: '한국어',
    nativeName: '한국어',
    flag: '🇰🇷',
    region: 'KR',
    videoCount: '67亿',
    stopWords: ['이', '그', '저', '것', '의', '가', '에', '를', '과', '와', '은', '는', '이', '가', '을', '를', '의', '과', '와', '도', '만', '도', '만', '까지', '부터', '에게', '한테', '께서', '께', '에서', '하고', '하고', '라서', '이라서', '으로', '로', '처럼', '같이', '보다', '보다', '처럼', '같이', '만큼', '만큼', '만큼', '그', '어느', '무슨', '어떤', '어느', '무슨', '어떤', '이런', '저런', '그런', '이런', '저런', '그런', '어떤', '어떠한', '아무런', '모든', '전혀', '조금', '좀', '약간', '많이', '별로', '안', '못', '하지만', '그러나', '그리고', '또한', '게다가', '즉', '예를', '들면', '예컨대', '바로', '곧', '바로', '곧', '아주', '매우', '정말', '참', '참으로', '가장', '제일', '아니', '아니다', '그렇다', '그렇지', '않다', '아니다'],
  },

  // 葡萄牙语
  'pt': {
    code: 'pt',
    name: 'Português',
    nativeName: 'Português',
    flag: '🇵🇹',
    region: 'PT',
    videoCount: '24亿',
    stopWords: ['de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'era', 'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus', 'quem', 'nas', 'me', 'esse', 'eles', 'estão', 'você', 'tinha', 'foram', 'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha', 'têm', 'numa', 'pelos', 'elas', 'havia', 'seja', 'qual', 'será', 'nós', 'tenho', 'lhe', 'deles', 'essas', 'esses', 'pelas', 'este', 'fosse', 'dele', 'tu', 'te', 'vocês', 'vos', 'lhes', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas', 'nosso', 'nossa', 'nossos', 'nossas', 'de', 'a', 'o', 'que', 'e'],
  },

  // 意大利语
  'it': {
    code: 'it',
    name: 'Italiano',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    region: 'IT',
    videoCount: '29亿',
    stopWords: ['di', 'che', 'e', 'la', 'il', 'un', 'a', 'in', 'per', 'non', 'più', 'con', 'del', 'da', 'si', 'lo', 'come', 'le', 'ma', 'questo', 'questa', 'su', 'perché', 'tutto', 'una', 'al', 'ai', 'a', 'o', 'gli', 'sono', 'tutti', 'me', 'mi', 'ha', 'solo', 'ci', 'de', 'degli', 'alla', 'quindi', 'quello', 'nella', 'delle', 'dallo', 'dagli', 'dalle', 'alla', 'allo', 'agli', 'alle', 'quello', 'quella', 'quelli', 'quelle', 'questo', 'questa', 'questi', 'queste', 'niente', 'molto', 'altro', 'ogni', 'alcuni', 'alcune', 'qualcuno', 'qualcuna', 'nessuno', 'nessuna', 'qualcosa'],
  },

  // 俄语
  'ru': {
    code: 'ru',
    name: 'Русский',
    nativeName: 'Русский',
    flag: '🇷🇺',
    region: 'RU',
    videoCount: '18亿',
    stopWords: ['и', 'в', 'во', 'не', 'что', 'он', 'на', 'я', 'с', 'со', 'как', 'а', 'то', 'все', 'она', 'так', 'его', 'но', 'да', 'ты', 'к', 'у', 'же', 'вы', 'за', 'бы', 'по', 'только', 'ее', 'мне', 'было', 'вот', 'от', 'меня', 'еще', 'нет', 'о', 'из', 'ему', 'теперь', 'когда', 'даже', 'ну', 'вдруг', 'ли', 'если', 'уже', 'или', 'ни', 'быть', 'был', 'него', 'до', 'вас', 'нибудь', 'опять', 'уж', 'вам', 'ведь', 'там', 'потом', 'себя', 'ничего', 'ей', 'может', 'они', 'тут', 'где', 'есть', 'надо', 'ней', 'для', 'мы', 'тебя', 'их', 'чем', 'была', 'сам', 'чтоб', 'без', 'будто', 'чего', 'раз', 'тоже', 'себе', 'под', 'будет', 'ж', 'тогда', 'кто', 'этот', 'того', 'потому', 'этого', 'какой', 'совсем', 'ним', 'здесь', 'этом', 'один', 'почти', 'мой', 'тем', 'чтобы', 'нее', 'сейчас', 'были', 'куда', 'зачем', 'все', 'всегда', 'никогда', 'можно', 'при', 'наконец', 'два', 'об', 'другой', 'хоть', 'после', 'над', 'больше', 'тот', 'через', 'эти', 'нас', 'про', 'всего', 'них', 'какая', 'много', 'разве', 'три', 'эту', 'моя', 'впрочем', 'хорошо', 'свою', 'этой', 'перед', 'иногда', 'лучше', 'чуть', 'том', 'нельзя', 'такой', 'им', 'более', 'всегда', 'конечно', 'всю', 'между'],
  },
};

/**
 * 语言分组
 */
export const LANGUAGE_GROUPS = {
  asia: ['zh', 'zh-TW', 'ja', 'ko', 'hi', 'id', 'vi', 'th', 'tl', 'ms'],
  europe: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'pl', 'nl'],
  americas: ['pt-BR', 'es-MX'],
  middleEast: ['ar'],
};

/**
 * 热门语言（视频量前10）
 */
export const TOP_LANGUAGES = [
  'en', 'es', 'fr', 'de', 'ja', 'ko', 'pt', 'ru', 'zh', 'it'
];

/**
 * 根据语言代码获取配置
 */
export function getLanguageConfig(code: string): LanguageConfig | undefined {
  return LANGUAGE_CONFIGS[code];
}

/**
 * 获取所有语言列表
 */
export function getAllLanguages(): LanguageConfig[] {
  return Object.values(LANGUAGE_CONFIGS);
}

/**
 * 根据语言代码推断地区代码
 */
export function getRegionCode(languageCode: string): string {
  const config = LANGUAGE_CONFIGS[languageCode];
  return config?.region || 'US';
}

/**
 * 检测关键词语言
 */
export function detectLanguage(keyword: string): string {
  // 简单的语言检测逻辑
  const chineseRegex = /[\u4e00-\u9fa5]/;
  const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff]/;
  const koreanRegex = /[\uac00-\ud7af]/;
  const arabicRegex = /[\u0600-\u06ff]/;
  const cyrillicRegex = /[\u0400-\u04ff]/;

  if (chineseRegex.test(keyword)) {
    // 区分简繁体
    const traditionalRegex = /[繁體]/;
    return traditionalRegex.test(keyword) ? 'zh-TW' : 'zh';
  }
  if (japaneseRegex.test(keyword)) return 'ja';
  if (koreanRegex.test(keyword)) return 'ko';
  if (arabicRegex.test(keyword)) return 'ar';
  if (cyrillicRegex.test(keyword)) return 'ru';

  // 默认英语
  return 'en';
}
