import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchCloudRecords, type CloudState } from './cloud'
import { loadRecords, saveRecords, PERSONALITIES, type SavedRecord } from './sbti'

export interface MergedRecord extends SavedRecord {
  source: 'local' | 'cloud'
}

function cloudToRecord(c: { name: string; type: string; match: number; ts: number }): MergedRecord {
  const p = PERSONALITIES.find(x => x.code === c.type)
  return {
    id: `cloud:${c.name}|${c.ts}`,
    nickname: c.name,
    code: c.type,
    name: p?.name ?? c.type,
    category: p?.category ?? '特殊组',
    match: c.match,
    ts: c.ts,
    source: 'cloud',
  }
}

/** 合并 localStorage 与云端记录；以 昵称+时间戳 为键去重 */
export function mergeRecords(local: SavedRecord[], cloud: CloudState | null): MergedRecord[] {
  const seen = new Set<string>()
  const out: MergedRecord[] = []
  for (const c of cloud?.records ?? []) {
    const key = `${c.name}|${c.ts}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(cloudToRecord(c))
  }
  for (const r of local) {
    const key = `${r.nickname}|${r.ts}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ ...r, source: 'local' })
  }
  return out.sort((a, b) => b.ts - a.ts)
}

export function useRecords() {
  const [local, setLocal] = useState<SavedRecord[]>(() => loadRecords())
  const [cloud, setCloud] = useState<CloudState | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async (force = false) => {
    setLoading(true)
    try {
      setCloud(await fetchCloudRecords(force))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const persist = useCallback((next: SavedRecord[]) => {
    saveRecords(next)
    setLocal(next)
  }, [])

  const addLocal = useCallback((r: Omit<SavedRecord, 'id' | 'ts' | 'synced'>, synced: boolean) => {
    const rec: SavedRecord = { ...r, id: crypto.randomUUID(), ts: Date.now(), synced }
    persist([...loadRecords(), rec])
    return rec
  }, [persist])

  const markSynced = useCallback((ids: string[]) => {
    const set = new Set(ids)
    persist(loadRecords().map(r => (set.has(r.id) ? { ...r, synced: true } : r)))
  }, [persist])

  const removeLocal = useCallback((id: string) => {
    persist(loadRecords().filter(r => r.id !== id))
  }, [persist])

  const clearLocal = useCallback(() => {
    persist([])
  }, [persist])

  const records = useMemo(() => mergeRecords(local, cloud), [local, cloud])

  // 本机已保存但尚未同步云端的记录
  const pendingLocal = useMemo(() => local.filter(r => r.synced === false), [local])

  return {
    records,
    pendingLocal,
    offline: cloud?.offline ?? false,
    everSynced: (cloud?.fetchedAt ?? 0) > 0,
    loading,
    refresh,
    addLocal,
    markSynced,
    removeLocal,
    clearLocal,
  }
}
