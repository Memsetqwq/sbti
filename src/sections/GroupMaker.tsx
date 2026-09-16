import { useState } from 'react'
import { optimalGroup, totalCost, type GroupMember } from '@/lib/grouping'
import { publishGroups } from '@/lib/cloud'
import { onColor, personalityColor } from '@/lib/personality-colors'
import { cardCls } from '@/lib/style'
import type { MergedRecord } from '@/lib/useRecords'

interface Props {
  records: MergedRecord[]
}

export default function GroupMaker({ records }: Props) {
  const [n, setN] = useState(3)
  const [groups, setGroups] = useState<GroupMember[][] | null>(null)
  const [cost, setCost] = useState(0)
  const [publishState, setPublishState] = useState<'idle' | 'busy' | 'ok' | 'fail'>('idle')

  const run = () => {
    const members: GroupMember[] = records.map(r => ({ id: r.id, nickname: r.nickname, code: r.code }))
    const g = optimalGroup(members, n)
    setGroups(g)
    setCost(totalCost(g))
    setPublishState('idle')
  }

  const publish = async () => {
    if (!groups) return
    setPublishState('busy')
    const payload = groups.map(g => g.map(m => ({ name: m.nickname, code: m.code })))
    setPublishState(await publishGroups(payload) ? 'ok' : 'fail')
  }

  return (
    <div className="space-y-4">
      <div className={`${cardCls('bg-yellow-200')} p-5`}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <label className="font-black">分成</label>
            <div className="flex gap-1.5">
              {[2, 3, 4, 5, 6].map(k => (
                <button
                  key={k}
                  onClick={() => setN(k)}
                  className={`h-9 w-9 rounded-lg border-2 border-black font-mono font-black transition-all
                    ${n === k ? 'bg-black text-yellow-300 shadow-[2px_2px_0_#f43f5e]' : 'bg-white hover:bg-yellow-100'}`}
                >{k}</button>
              ))}
            </div>
            <span className="font-black">组</span>
          </div>
          <button
            onClick={run}
            disabled={records.length === 0}
            className="rounded-xl border-2 border-black bg-rose-500 px-6 py-2.5 font-black text-white shadow-[4px_4px_0_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0_#000] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:shadow-none"
          >
            🎲 自动分组
          </button>
          {groups && (
            <button
              onClick={() => void publish()}
              disabled={publishState === 'busy'}
              className="rounded-xl border-2 border-black bg-black px-6 py-2.5 font-black text-yellow-300 shadow-[4px_4px_0_#f43f5e] transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              {publishState === 'busy' ? '发布中…' : publishState === 'ok' ? '✓ 已发布到大屏' : publishState === 'fail' ? '✗ 发布失败（离线？）' : '📺 发布到大屏'}
            </button>
          )}
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          算法：随机贪心 × 300 轮 · 代价 = 同组重复人格×3 + 冲突对×2 + 人数不均，取最优解（300 轮内出现 0 代价方案则提前收工）
        </p>
      </div>

      {groups && (
        <>
          <p className="text-sm font-bold text-neutral-500">
            本方案总代价：<span className={`font-black ${cost === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>{cost}</span>
            {cost === 0 ? '（完美：无重复人格、无冲突对、人数均匀）' : '（人数少/人格扎堆时无法完全避免）'}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g, i) => (
              <div key={i} className={`${cardCls()} p-4`}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-lg font-black">第 {i + 1} 组</span>
                  <span className="text-xs font-bold text-neutral-400">{g.length} 人</span>
                </div>
                {g.length === 0 ? (
                  <p className="text-xs text-black/40">（本组轮空）</p>
                ) : (
                  <ul className="space-y-1.5">
                    {g.map(m => {
                      const c = personalityColor(m.code)
                      return (
                        <li key={m.id} className="flex items-center gap-2 rounded-lg border-2 border-black/10 bg-neutral-50 px-2.5 py-1.5">
                          <span className="h-3.5 w-3.5 shrink-0 rounded border border-black" style={{ backgroundColor: c }} />
                          <span className="font-bold">{m.nickname}</span>
                          <span
                            className="ml-auto rounded border border-black px-1.5 font-mono text-[10px] font-black"
                            style={{ backgroundColor: c, color: onColor(c) }}
                          >
                            {m.code}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
