// ─────────────────────────────────────────────────────────────────────────────
// 27 种人格手工配色（neo-brutalism 扁平色块：避开渐变/荧光/默认色板顺序）
// 用于卡片头部底色、徽章、榜单高光。色相整体分散，明度有层次，相邻不打架。
// ─────────────────────────────────────────────────────────────────────────────

export const PERSONALITY_COLORS: Record<string, string> = {
  // 掌控高能组：浓烈、有攻击性
  CTRL: '#E4572E', // 拿捏者 · 橘红
  BOSS: '#C0281C', // 领导者 · 正红
  GOGO: '#6FA84F', // 行者 · 草绿
  SEXY: '#C93A6E', // 尤物 · 玫红
  'THAN-K': '#F0A35E', // 感恩者 · 杏橙
  // 情感组：温暖柔软
  'LOVE-R': '#EE92B4', // 多情者 · 樱粉
  MUM: '#E4C15D', // 妈妈 · 奶黄
  'ATM-er': '#3E7C59', // 送钱者 · 钞票绿
  // 抽象自嘲组：大地色系、丧中带梗
  MALO: '#B8933A', // 吗喽 · 土黄
  SHIT: '#7A5230', // 愤世者 · 棕褐
  DEAD: '#6E7F8D', // 死者 · 灰蓝
  ZZZZ: '#4E5D6C', // 装死者 · 深夜蓝灰
  FUCK: '#C75B12', // 草者 · 焦橙
  'WOC!': '#2E8B8B', // 握草人 · 青 teal
  'OH-NO': '#8A7CA8', // 哦不人 · 灰紫
  OJBK: '#9BA17B', // 无所谓人 · 灰绿
  'Dior-s': '#4F6D9E', // 屌丝 · 牛仔蓝
  POOR: '#A99E8C', // 贫困者 · 灰卡其
  IMFW: '#6B6B66', // 废物 · 铅灰
  IMSB: '#A65A4E', // 自我攻击者 · 赭红
  // 社交面具组：冷调、克制
  FAKE: '#9AA3A8', // 伪人 · 冷灰
  'JOKE-R': '#A63D40', // 小丑 · 暗朱红
  SOLO: '#93A8BC', // 孤儿 · 冷月灰蓝
  MONK: '#A0785A', // 僧人 · 赭石灰
  'THIN-K': '#2F4B4E', // 思考者 · 深青墨
  // 特殊
  HHHH: '#F2C230', // 傻乐者 · 明黄
  DRUNK: '#D98E32', // 酒鬼 · 琥珀酒色
}

export function personalityColor(code: string): string {
  return PERSONALITY_COLORS[code] ?? '#B8B0A4'
}

/** 深底色上用白字，浅底色上用黑字（按亮度粗判） */
export function onColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  return lum > 150 ? '#1c1917' : '#ffffff'
}
