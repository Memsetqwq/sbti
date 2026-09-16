import { useMemo, useState } from 'react'
import DimBars from '@/components/DimBars'
import { PERSONALITIES } from '@/lib/sbti'
import { onColor, personalityColor } from '@/lib/personality-colors'
import type { MergedRecord } from '@/lib/useRecords'

interface Props {
  records: MergedRecord[]
}

export default function PersonalityWall({ records }: Props) {
  const [open, setOpen] = useState<Set<string>>(new Set())

  const byCode = useMemo(() => {
    const m = new Map<string, MergedRecord[]>()
    for (const r of records) {
      const arr = m.get(r.code) ?? []
      arr.push(r)
      m.set(r.code, arr)
    }
    for (const arr of m.values()) arr.sort((a, b) => b.match - a.match || b.ts - a.ts)
    return m
  }, [records])

  // 人数从多到少，同数按代号字典序
  const cards = useMemo(() =>
    [...PERSONALITIES].sort((a, b) => {
      const d = (byCode.get(b.code)?.length ?? 0) - (byCode.get(a.code)?.length ?? 0)
      return d !== 0 ? d : a.code.localeCompare(b.code)
    }), [byCode])

  const toggle = (code: string) => {
    setOpen(prev => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(p => {
        const members = byCode.get(p.code) ?? []
        const color = personalityColor(p.code)
        const fg = onColor(color)
        const empty = members.length === 0
        const expanded = open.has(p.code)
        return (
          <div
            key={p.code}
            className={`overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#000] ${empty ? 'opacity-50 saturate-50' : ''}`}
          >
            {/* 卡片头：人格主题色块 */}
            <div className="flex items-center gap-2 border-b-2 border-black px-4 py-3" style={{ backgroundColor: color, color: fg }}>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-2xl font-black tracking-wide leading-none">{p.code}</div>
                <div className="mt-1 text-sm font-bold opacity-90">{p.name}</div>
              </div>
              <span className="shrink-0 rounded-full border-2 px-2 py-0.5 font-mono text-xs font-black" style={{ borderColor: fg }}>
                {empty ? '虚位以待' : `${members.length} 人`}
              </span>
              <button
                onClick={() => toggle(p.code)}
                title={expanded ? '收起档案' : '展开完整档案'}
                className="shrink-0 rounded-lg border-2 px-2 py-1 font-mono text-sm font-black transition-transform hover:-translate-y-0.5"
                style={{ borderColor: fg, color: fg }}
              >
                {expanded ? '▲' : '▼'}
              </button>
            </div>

            {/* 专属排行榜 */}
            {!empty && (
              <ol className="divide-y divide-black/5">
                {members.map((m, i) => (
                  <li key={m.id} className="flex items-center gap-2 px-4 py-2">
                    {i === 0 ? (
                      <span className="shrink-0 rounded border border-black px-1.5 py-0.5 font-mono text-[10px] font-black" style={{ backgroundColor: color, color: fg }}>
                        NO.1
                      </span>
                    ) : (
                      <span className="w-9 shrink-0 text-center font-mono text-xs font-black text-neutral-300">#{i + 1}</span>
                    )}
                    <span className="min-w-0 flex-1 truncate font-bold">{m.nickname}</span>
                    <span className="shrink-0 font-mono text-sm font-black" style={{ color }}>{m.match}%</span>
                  </li>
                ))}
              </ol>
            )}

            {/* 展开：完整档案 */}
            {expanded && (
              <div className="border-t-2 border-black/10 bg-amber-50/60 px-4 py-3">
                <p className="text-sm font-bold text-neutral-700">「{p.quote}」</p>
                <p className="mt-2 text-xs leading-relaxed text-neutral-500">{p.roast}</p>
                <p className="mt-2 text-xs font-bold text-neutral-400">所属分类：{p.category}</p>
                <div className="mt-3">
                  <p className="mb-2 text-xs font-black text-neutral-400">15 维签名光谱</p>
                  <DimBars vector={p.signature} compact />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
