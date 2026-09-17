// ─────────────────────────────────────────────────────────────────────────────
// Pantry 云端同步（https://getpantry.cloud · 免费 · 纯 REST）
//
// 这是已在 getpantry.cloud 创建并激活的真实 Pantry ID（2026-09-17 接入）。
//    如需独立数据空间，换一个自己的 Pantry ID 即可，新旧数据互不可见。
//    云端不可用时应用会自动进入「离线模式」（仅用本机 localStorage），功能不受影响。
//
// 存储模型：所有成绩存在单个固定 basket「r-all」（{records: [...]}），
//    一次刷新仅 1 个请求；写入为 读→追加→写回 的乐观重试语义，
//    遇到 429/超时/5xx 自动退避重试（Pantry 免费层限流严格，切忌高频并发请求）。
// ─────────────────────────────────────────────────────────────────────────────

export const PANTRY_ID = '260fb1d6-acbc-4eac-a7e2-8afbf242eebd'

/** 组织者账号与口令（写死在前端，仅供团建现场防手滑，非安全边界） */
export const ADMIN_USER = 'admin'
export const ADMIN_PASSWORD = 'sbti-admin'

const BASE = `https://getpantry.cloud/apiv1/pantry/${PANTRY_ID}`
const TIMEOUT_MS = 10_000
const CACHE_MS = 30_000
const RECORDS_BASKET = 'r-all'
const GROUPS_BASKET = 'meta-groups'

/** 单条云端记录 */
export interface CloudPayload {
  name: string // 昵称
  type: string // 人格代号，如 CTRL
  match: number
  ts: number
}

export interface CloudState {
  records: CloudPayload[]
  offline: boolean
  fetchedAt: number // 0 = 从未成功过
}

// ─── 基础请求（10 秒超时） ───────────────────────────────────────────────────

class CloudError extends Error {}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new CloudError(`HTTP ${res.status}`)
    const data = (await res.json()) as T
    if (data && typeof data === 'object' && 'error' in data) {
      const err = (data as { error: unknown; details?: unknown })
      throw new CloudError(`${String(err.error)} ${String(err.details ?? '')}`)
    }
    return data
  } finally {
    clearTimeout(timer)
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/** 退避重试：第 n 次重试前等待 (1.5×n + 随机0~1) 秒 */
async function withRetry<T>(fn: () => Promise<T>, attempts: number): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await sleep(1500 * i + Math.random() * 1000)
    try {
      return await fn()
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr
}

// ─── r-all 读写 ──────────────────────────────────────────────────────────────

function validRecord(r: unknown): r is CloudPayload {
  if (!r || typeof r !== 'object') return false
  const o = r as Record<string, unknown>
  return typeof o.name === 'string' && typeof o.type === 'string'
}

/** 读取全部成绩；basket 不存在（新 pantry）视为空表 */
async function readAll(): Promise<CloudPayload[]> {
  try {
    const data = await req<{ records?: unknown }>(`/basket/${RECORDS_BASKET}`)
    const arr = Array.isArray(data?.records) ? data.records : []
    return arr.filter(validRecord).map(r => ({
      name: r.name, type: r.type, match: Number(r.match ?? 0), ts: Number(r.ts ?? 0),
    }))
  } catch (e) {
    if (/not found/i.test(String(e))) return []
    throw e
  }
}

/** 整表写回（POST = 创建或替换） */
async function writeAll(records: CloudPayload[]): Promise<void> {
  await req(`/basket/${RECORDS_BASKET}`, { method: 'POST', body: JSON.stringify({ records }) })
}

const sameRecord = (a: { name: string; ts: number }, b: { name: string; ts: number }) =>
  a.name === b.name && a.ts === b.ts

// 单进程写串行化：同一页面内的所有写操作排队执行，配合「写后读校验」
// 形成乐观重试语义——被其他设备覆盖写入时，校验失败触发重试，重读最新数据再追加。
let writeLock: Promise<unknown> = Promise.resolve()

function enqueueWrite<T>(fn: () => Promise<T>): Promise<T> {
  const p = writeLock.then(fn, fn)
  writeLock = p.catch(() => {})
  return p
}

// ─── 缓存（30 秒） ───────────────────────────────────────────────────────────

let cache: CloudState | null = null

function invalidate() {
  cache = null
}

// ─── 对外 API ────────────────────────────────────────────────────────────────

/** 读取排行榜数据：单个 GET r-all，429/失败退避重试最多 3 次 */
export async function fetchCloudRecords(force = false): Promise<CloudState> {
  if (!force && cache && Date.now() - cache.fetchedAt < CACHE_MS) return cache
  try {
    const records = await withRetry(readAll, 3)
    records.sort((a, b) => b.ts - a.ts)
    cache = { records, offline: false, fetchedAt: Date.now() }
    return cache
  } catch {
    // 重试耗尽才离线：返回旧缓存（若有），下一刷新周期自动重试恢复
    return { records: cache?.records ?? [], offline: true, fetchedAt: cache?.fetchedAt ?? 0 }
  }
}

/** 提交成绩：读→按 name+ts 去重追加→写回→读校验；失败退避重试最多 4 次 */
export async function pushCloudRecord(p: CloudPayload): Promise<boolean> {
  return enqueueWrite(async () => {
    try {
      await withRetry(async () => {
        const records = await readAll()
        if (!records.some(r => sameRecord(r, p))) records.push(p)
        await writeAll(records)
        await sleep(400)
        // 写后读校验：确认记录真的落库（防并发设备互相覆盖）
        const verify = await readAll()
        if (!verify.some(r => sameRecord(r, p))) throw new CloudError('write not confirmed')
      }, 4)
      invalidate()
      return true
    } catch {
      return false
    }
  })
}

/** 删除单条：读→按 name+ts 移除→写回（带重试） */
export async function deleteCloudRecord(p: { name: string; ts: number }): Promise<boolean> {
  return enqueueWrite(async () => {
    try {
      await withRetry(async () => {
        const records = await readAll()
        await writeAll(records.filter(r => !sameRecord(r, p)))
      }, 4)
      invalidate()
      return true
    } catch {
      return false
    }
  })
}

/** 清空全部成绩（带重试） */
export async function clearCloudRecords(): Promise<boolean> {
  return enqueueWrite(async () => {
    try {
      await withRetry(() => writeAll([]), 4)
      invalidate()
      return true
    } catch {
      return false
    }
  })
}

// ─── 分组结果发布（独立 basket，覆盖写） ─────────────────────────────────────

export interface PublishedGroups {
  ts: number
  groups: { name: string; code: string }[][]
}

export async function publishGroups(groups: { name: string; code: string }[][]): Promise<boolean> {
  try {
    const payload: PublishedGroups = { ts: Date.now(), groups }
    await withRetry(() =>
      req(`/basket/${GROUPS_BASKET}`, { method: 'POST', body: JSON.stringify(payload) }), 3)
    return true
  } catch {
    return false
  }
}

export async function fetchGroups(): Promise<PublishedGroups | null> {
  try {
    const data = await withRetry(() => req<PublishedGroups>(`/basket/${GROUPS_BASKET}`), 3)
    if (!Array.isArray(data?.groups)) return null
    return data
  } catch {
    return null
  }
}
