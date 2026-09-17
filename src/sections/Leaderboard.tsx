import { useMemo, useState } from 'react'
import { CATEGORY_COLOR, cardCls } from '@/lib/style'
import type { MergedRecord } from '@/lib/useRecords'

interface Props {
  records: MergedRecord[]
  offline: boolean
  loading: boolean
  onRefresh: () => void
  onRemoveLocal: (id: string) => void
  onClearLocal: () => void
}

function fmtTime(ts: number) {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export default function Leaderboard({ records, offline, loading, onRefresh, onRemoveLocal, onClearLocal }: Props) {
  const [confirming, setConfirming] = useState(false)

  const stats = useMemo(() => {
    const m = new Map<string, { name: string; category: string; count: number }>()
    for (const r of records) {
      const cur = m.get(r.code) ?? { name: r.name, category: r.category, count: 0 }
      cur.count++
      m.set(r.code, cur)
    }
    return m
  }, [records])

  const rarity = useMemo(() =>
    [...stats.entries()]
      .map(([code, v]) => ({ code, ...v }))
      .sort((a, b) => a.count - b.count || a.code.localeCompare(b.code)),
  [stats])

  const maxCount = Math.max(1, ...[...stats.values()].map(v => v.count))

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {offline && (
        <div className="flex items-center justify-center gap-3 rounded-xl border-2 border-black bg-neutral-200 px-4 py-2.5 text-sm font-black text-neutral-600 shadow-[3px_3px_0_#000]">
          <span>📴 离线模式：仅显示本机数据</span>
          <button
            onClick={onRefresh}
            className="rounded-lg border-2 border-black bg-white px-3 py-1 text-xs font-black hover:bg-yellow-100"
          >重试</button>
        </div>
      )}

      {records.length === 0 ? (
        <div className={`${cardCls()} mx-auto max-w-xl p-10 text-center`}>
          <div className="text-5xl">🍃</div>
          <p className="mt-4 font-black text-neutral-500">{loading ? '正在从云端拉取…' : '排行榜空空如也'}</p>
          <p className="mt-1 text-sm text-neutral-400">快去测一个，成为全服第一人</p>
        </div>
      ) : (
        <>
          {/* 参与者列表 */}
          <div className={`${cardCls()} overflow-hidden`}>
            <div className="flex items-center justify-between gap-2 border-b-2 border-black bg-yellow-200 px-4 py-3 sm:px-5">
              <span className="font-black">参与者（{records.length}）{loading && <span className="ml-1 text-xs font-normal text-neutral-500">刷新中…</span>}</span>
              <span className="flex items-center gap-2">
                <button
                  onClick={onRefresh}
                  className="rounded-lg border-2 border-black bg-white px-3 py-1.5 text-xs font-black hover:bg-yellow-100"
                >🔄 刷新</button>
                {confirming ? (
                  <>
                    <span className="text-xs font-bold text-rose-600">清空本机记录？</span>
                    <button
                      onClick={() => { onClearLocal(); setConfirming(false) }}
                      className="rounded-lg border-2 border-black bg-rose-500 px-3 py-1.5 text-xs font-black text-white"
                    >确认</button>
                    <button
                      onClick={() => setConfirming(false)}
                      className="rounded-lg border-2 border-black bg-white px-3 py-1.5 text-xs font-black"
                    >取消</button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirming(true)}
                    className="rounded-lg border-2 border-black bg-white px-3 py-1.5 text-xs font-black text-rose-600 hover:bg-rose-100"
                  >清空本机</button>
                )}
              </span>
            </div>
            <ul className="divide-y-2 divide-black/10">
              {records.map(r => (
                <li key={r.id} className="flex items-center gap-2 px-4 py-3 sm:gap-3">
                  <span className={`shrink-0 rounded-md border border-black px-2 py-0.5 font-mono text-xs font-black ${CATEGORY_COLOR[r.category] ?? 'bg-neutral-200'}`}>
                    {r.code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-black">{r.nickname}</span>
                    <span className="ml-2 text-sm text-neutral-500">{r.name}</span>
                    {r.source === 'cloud' && <span className="ml-1 text-xs" title="来自云端">☁️</span>}
                  </div>
                  <span className="shrink-0 font-mono text-sm font-bold text-rose-600">{r.match}%</span>
                  <span className="hidden shrink-0 font-mono text-xs text-neutral-400 sm:inline">{fmtTime(r.ts)}</span>
                  {r.source === 'local' && (
                    <button
                      onClick={() => onRemoveLocal(r.id)}
                      title="删除本机该记录"
                      className="shrink-0 rounded-md border border-black/30 px-1.5 text-xs text-neutral-400 hover:border-rose-500 hover:text-rose-500"
                    >✕</button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* 人格分布 */}
          <div className={`${cardCls()} p-5`}>
            <h3 className="mb-4 font-black">人格分布</h3>
            <div className="space-y-2">
              {[...stats.entries()].sort((a, b) => b[1].count - a[1].count).map(([code, v]) => (
                <div key={code} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 truncate font-mono text-xs font-black">{code}</span>
                  <div className="h-5 flex-1 overflow-hidden rounded-md border border-black/20 bg-neutral-100">
                    <div
                      className={`flex h-full items-center px-1.5 ${CATEGORY_COLOR[v.category] ?? 'bg-neutral-300'}`}
                      style={{ width: `${(v.count / maxCount) * 100}%` }}
                    >
                      <span className="font-mono text-[10px] font-black">{v.count}</span>
                    </div>
                  </div>
                  <span className="w-16 shrink-0 truncate text-xs text-neutral-500">{v.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 稀有度榜 */}
          <div className={`${cardCls()} p-5`}>
            <h3 className="mb-1 font-black">稀有度榜</h3>
            <p className="mb-4 text-xs text-neutral-400">人数越少越稀有，恭喜各位天选之子</p>
            <ol className="space-y-2">
              {rarity.map((v, i) => (
                <li key={v.code} className="flex items-center gap-3 rounded-xl border-2 border-black/10 bg-neutral-50 px-3 py-2">
                  <span className={`w-8 text-center font-mono text-lg font-black ${i === 0 ? 'text-rose-500' : 'text-neutral-300'}`}>
                    {i + 1}
                  </span>
                  <span className={`rounded-md border border-black px-2 py-0.5 font-mono text-xs font-black ${CATEGORY_COLOR[v.category] ?? 'bg-neutral-200'}`}>
                    {v.code}
                  </span>
                  <span className="flex-1 font-bold">{v.name}</span>
                  <span className={`text-xs font-black ${v.count === 1 ? 'text-rose-500' : 'text-neutral-400'}`}>
                    全服仅 {v.count} 人
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </div>
  )
}
