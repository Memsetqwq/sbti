import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchCloudRecords, type CloudState } from './cloud'
import { loadRecords, saveRecords, PERSONALITIES, type SavedRecord } from './sbti'

export interface MergedRecord extends SavedRecord {
  source: 'local' | 'cloud'
  basket?: string
}

function cloudToRecord(c: { basket: string; name: string; type: string; match: number; ts: number }): MergedRecord {
  const p = PERSONALITIES.find(x => x.code === c.type)
  return {
    id: `cloud:${c.basket}`,
    basket: c.basket,
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

  const addLocal = useCallback((r: Omit<SavedRecord, 'id' | 'ts'>) => {
    const rec: SavedRecord = { ...r, id: crypto.randomUUID(), ts: Date.now() }
    setLocal(prev => {
      const next = [...prev, rec]
      saveRecords(next)
      return next
    })
    return rec
  }, [])

  const removeLocal = useCallback((id: string) => {
    setLocal(prev => {
      const next = prev.filter(r => r.id !== id)
      saveRecords(next)
      return next
    })
  }, [])

  const clearLocal = useCallback(() => {
    saveRecords([])
    setLocal([])
  }, [])

  const records = useMemo(() => mergeRecords(local, cloud), [local, cloud])

  return {
    records,
    cloudRecords: cloud?.records ?? [],
    offline: cloud?.offline ?? false,
    loading,
    refresh,
    addLocal,
    removeLocal,
    clearLocal,
  }
}
