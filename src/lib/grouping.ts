// ─────────────────────────────────────────────────────────────────────────────
// 自动分组：多目标优化（随机贪心 + 300 轮尝试）
// 代价 = 同组重复人格数×3 + 同组冲突对数×2 + 人数超出均值惩罚
// ─────────────────────────────────────────────────────────────────────────────

export interface GroupMember {
  id: string
  nickname: string
  code: string
}

/**
 * 手工定义的人格冲突对（按人格气质）：同组尽量避免。
 * 无向——A×B 与 B×A 等价。
 */
export const CONFLICT_PAIRS: [string, string][] = [
  ['BOSS', 'CTRL'],     // 都想当老大，方向盘只有一个
  ['SHIT', 'THAN-K'],   // 愤世嫉俗 × 感恩一切，频道对不上
  ['MONK', 'SEXY'],     // 清心寡欲 × 魅力四射
  ['DRUNK', 'BOSS'],    // 酒鬼碰上领导，场面失控
  ['DEAD', 'GOGO'],     // 躺平选手 × 冲锋队长，节奏撕裂
  ['CTRL', 'WOC!'],     // 拿捏者 × 握草人，一个布局一个炸毛
  ['FAKE', 'LOVE-R'],   // 伪人的面具 × 多情者的真心
  ['ATM-er', 'POOR'],   // 送钱者 × 贫困者，容易产生危险的经济关系
  ['THIN-K', 'HHHH'],   // 深度思考100s × 哈哈哈哈哈哈
  ['MALO', 'BOSS'],     // 吗喽不认领导，领导收编不了吗喽
  ['IMSB', 'MUM'],      // 自我攻击者会被妈妈当场心疼死
  ['SHIT', 'OJBK'],     // 一个看什么都不爽，一个什么都随便
]

const ROUNDS = 300
const W_DUP = 3
const W_CONFLICT = 2

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function isConflict(a: string, b: string): boolean {
  return CONFLICT_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
}

/** 把人 p 放进组 g 的增量代价 */
function placeCost(p: GroupMember, g: GroupMember[], mean: number): number {
  let dup = 0
  let conflict = 0
  for (const m of g) {
    if (m.code === p.code) dup++
    if (isConflict(m.code, p.code)) conflict++
  }
  const over = Math.max(0, g.length + 1 - Math.ceil(mean))
  return dup * W_DUP + conflict * W_CONFLICT + over
}

/** 整套分组方案的总代价（用于横向比较各轮结果） */
export function totalCost(groups: GroupMember[][]): number {
  const mean = groups.reduce((s, g) => s + g.length, 0) / groups.length
  let cost = 0
  for (const g of groups) {
    cost += Math.abs(g.length - mean)
    for (let i = 0; i < g.length; i++) {
      for (let j = i + 1; j < g.length; j++) {
        if (g[i].code === g[j].code) cost += W_DUP
        if (isConflict(g[i].code, g[j].code)) cost += W_CONFLICT
      }
    }
  }
  return cost
}

/**
 * 随机贪心分组：每轮随机洗牌后，依次把每个人放进「增量代价最低」的组；
 * 300 轮取总代价最低方案。
 */
export function optimalGroup(members: GroupMember[], n: number): GroupMember[][] {
  if (members.length === 0) return Array.from({ length: n }, () => [])
  let best: GroupMember[][] | null = null
  let bestCost = Infinity
  for (let round = 0; round < ROUNDS; round++) {
    const groups: GroupMember[][] = Array.from({ length: n }, () => [])
    const mean = members.length / n
    for (const p of shuffle(members)) {
      let target = 0
      let minCost = Infinity
      // 人少的组优先作为候选（同代价时偏向均衡）
      for (let gi = 0; gi < n; gi++) {
        const c = placeCost(p, groups[gi], mean)
        if (c < minCost || (c === minCost && groups[gi].length < groups[target].length)) {
          minCost = c
          target = gi
        }
      }
      groups[target].push(p)
    }
    const c = totalCost(groups)
    if (c < bestCost) {
      bestCost = c
      best = groups
      if (c === 0) break // 理论最优，提前收工
    }
  }
  return best!
}
