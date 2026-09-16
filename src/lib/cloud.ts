// ─────────────────────────────────────────────────────────────────────────────
// Pantry 云端同步（https://getpantry.cloud · 免费 · 纯 REST）
//
// 这是已在 getpantry.cloud 创建并激活的真实 Pantry ID（2026-09-17 接入）。
//    如需独立数据空间，换一个自己的 Pantry ID 即可，新旧数据互不可见。
//    云端不可用时应用会自动进入「离线模式」（仅用本机 localStorage），功能不受影响。
// ─────────────────────────────────────────────────────────────────────────────

export const PANTRY_ID = '260fb1d6-acbc-4eac-a7e2-8afbf242eebd'

/** 组织者账号与口令（写死在前端，仅供团建现场防手滑，非安全边界） */
export const ADMIN_USER = 'admin'
export const ADMIN_PASSWORD = 'sbti-admin'

const BASE = `https://getpantry.cloud/apiv1/pantry/${PANTRY_ID}`
const TIMEOUT_MS = 8000
const CACHE_MS = 30_000
const CONCURRENCY = 4 // Pantry 免费层限流约 1.5 次/秒，并发 4 + 错峰延迟
const STAGGER_MS = 150
const BASKET_PREFIX = 'r-'

/** 单条云端记录（basket 内容） */
export interface CloudPayload {
  name: string // 昵称
  type: string // 人格代号，如 CTRL
  match: number
  ts: number
}

/** 读取时附带 basket 名，便于管理页删除 */
export interface CloudRecord extends CloudPayload {
  basket: string
}

export interface CloudState {
  records: CloudRecord[]
  offline: boolean
  fetchedAt: number
}

// ─── 基础请求（8 秒超时） ────────────────────────────────────────────────────

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as T
    if (data && typeof data === 'object' && 'error' in data) throw new Error(String((data as { error: unknown }).error))
    return data
  } finally {
    clearTimeout(timer)
  }
}

// ─── 并发限制（4-6 个） ─────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function mapLimit<I, O>(items: I[], limit: number, fn: (item: I) => Promise<O | null>): Promise<O[]> {
  const out: O[] = []
  let cursor = 0
  async function worker() {
    while (cursor < items.length) {
      const item = items[cursor++]
      try {
        const v = await fn(item)
        if (v !== null) out.push(v)
      } catch {
        // 单条失败容错：跳过该条，不影响整体
      }
      await sleep(STAGGER_MS) // 错峰，避免触发 Pantry 限流
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

// ─── 缓存（30 秒） ───────────────────────────────────────────────────────────

let cache: CloudState | null = null

function invalidate() {
  cache = null
}

// ─── 读取：pantry 详情 → 过滤 r- 前缀 basket → 逐个取内容 ───────────────────

interface PantryDetail {
  baskets?: ({ name?: string } | string)[]
}

export async function fetchCloudRecords(force = false): Promise<CloudState> {
  if (!force && cache && Date.now() - cache.fetchedAt < CACHE_MS) return cache
  try {
    const detail = await req<PantryDetail>('')
    const names = (detail.baskets ?? [])
      .map(b => (typeof b === 'string' ? b : b.name ?? ''))
      .filter(n => n.startsWith(BASKET_PREFIX))
    const records = await mapLimit(names, CONCURRENCY, async basket => {
      const data = await req<Partial<CloudPayload>>(`/basket/${encodeURIComponent(basket)}`)
      if (typeof data?.name !== 'string' || typeof data?.type !== 'string') return null
      return {
        basket,
        name: data.name,
        type: data.type,
        match: Number(data.match ?? 0),
        ts: Number(data.ts ?? 0),
      } satisfies CloudRecord
    })
    records.sort((a, b) => b.ts - a.ts)
    cache = { records, offline: false, fetchedAt: Date.now() }
    return cache
  } catch {
    // 云端不可用：静默降级，返回旧缓存（若有）并标记离线
    return { records: cache?.records ?? [], offline: true, fetchedAt: cache?.fetchedAt ?? 0 }
  }
}

// ─── 写入：每条成绩一个独立 basket（r-<时间戳>-<6位随机>），互不覆盖 ─────────

function rand6(): string {
  return Math.random().toString(36).slice(2, 8).padEnd(6, '0')
}

export async function pushCloudRecord(p: CloudPayload): Promise<boolean> {
  try {
    await req(`/basket/${BASKET_PREFIX}${p.ts}-${rand6()}`, {
      method: 'POST',
      body: JSON.stringify(p),
    })
    invalidate()
    return true
  } catch {
    return false
  }
}

// ─── 管理操作 ────────────────────────────────────────────────────────────────

export async function deleteCloudRecord(basket: string): Promise<boolean> {
  try {
    await req(`/basket/${encodeURIComponent(basket)}`, { method: 'DELETE' })
    invalidate()
    return true
  } catch {
    return false
  }
}

export async function clearCloudRecords(): Promise<{ ok: number; fail: number }> {
  const state = await fetchCloudRecords(true)
  const baskets = state.records.map(r => r.basket)
  let ok = 0
  let fail = 0
  await mapLimit(baskets, CONCURRENCY, async basket => {
    try {
      await req(`/basket/${encodeURIComponent(basket)}`, { method: 'DELETE' })
      ok++
    } catch {
      fail++
    }
    return null
  })
  invalidate()
  return { ok, fail }
}

// ─── 分组结果发布（独立 basket，覆盖写；不带 r- 前缀，不进排行榜） ────────────

const GROUPS_BASKET = 'meta-groups'

export interface PublishedGroups {
  ts: number
  groups: { name: string; code: string }[][]
}

export async function publishGroups(groups: { name: string; code: string }[][]): Promise<boolean> {
  try {
    const payload: PublishedGroups = { ts: Date.now(), groups }
    await req(`/basket/${GROUPS_BASKET}`, { method: 'POST', body: JSON.stringify(payload) })
    return true
  } catch {
    return false
  }
}

export async function fetchGroups(): Promise<PublishedGroups | null> {
  try {
    const data = await req<PublishedGroups>(`/basket/${GROUPS_BASKET}`)
    if (!Array.isArray(data?.groups)) return null
    return data
  } catch {
    return null
  }
}
