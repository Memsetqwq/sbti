import { useMemo, useState } from 'react'
import { CATEGORIES } from '@/lib/sbti'
import { CATEGORY_COLOR, CATEGORY_TEXT, cardCls } from '@/lib/style'
import type { SavedRecord } from '@/lib/sbti'

interface Props {
  records: SavedRecord[]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 按类别打散、轮流发牌到 N 组：每组人数均匀、类别尽量多样 */
function autoGroup(records: SavedRecord[], n: number): SavedRecord[][] {
  const groups: SavedRecord[][] = Array.from({ length: n }, () => [])
  for (const cat of CATEGORIES) {
    const members = shuffle(records.filter(r => r.category === cat))
    // 每次从当前人最少的组开始发，保证人数均匀
    let targets = [...groups.keys()].sort((a, b) => groups[a].length - groups[b].length)
    members.forEach((m, i) => {
      groups[targets[i % n]].push(m)
      if ((i + 1) % n === 0) {
        targets = [...groups.keys()].sort((a, b) => groups[a].length - groups[b].length)
      }
    })
  }
  return groups
}

const GROUP_COLORS = ['bg-rose-200', 'bg-sky-200', 'bg-lime-200', 'bg-violet-200', 'bg-amber-200', 'bg-fuchsia-200']

export default function Groups({ records }: Props) {
  const [n, setN] = useState(3)
  const [groups, setGroups] = useState<SavedRecord[][] | null>(null)

  const byCategory = useMemo(() => {
    const m = new Map<string, SavedRecord[]>()
    for (const cat of CATEGORIES) m.set(cat, [])
    for (const r of records) m.get(r.category)?.push(r)
    return m
  }, [records])

  if (records.length === 0) {
    return (
      <div className={`${cardCls()} mx-auto max-w-xl p-10 text-center`}>
        <div className="text-5xl">🫥</div>
        <p className="mt-4 font-black text-neutral-500">还没有参与者</p>
        <p className="mt-1 text-sm text-neutral-400">先让大伙儿去测一轮，再来分组</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* 分类名册 */}
      <div className={`${cardCls()} p-5`}>
        <h3 className="mb-4 font-black">五大分类名册（{records.length} 人）</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map(cat => {
            const members = byCategory.get(cat) ?? []
            return (
              <div key={cat} className={`rounded-xl border-2 border-black p-3 ${CATEGORY_COLOR[cat]}`}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-black">{cat}</span>
                  <span className="rounded-full border border-black bg-white px-2 font-mono text-xs font-black">{members.length}</span>
                </div>
                {members.length === 0 ? (
                  <p className="text-xs text-black/40">虚位以待</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {members.map(m => (
                      <span key={m.id} className="rounded-md border border-black bg-white px-2 py-0.5 text-xs font-bold">
                        {m.nickname}·{m.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 分组控制 */}
      <div className={`${cardCls('bg-yellow-200')} p-5`}>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
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
            onClick={() => setGroups(autoGroup(records, n))}
            className="rounded-xl border-2 border-black bg-rose-500 px-6 py-2.5 font-black text-white shadow-[4px_4px_0_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0_#000]"
          >
            🎲 自动分组
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-neutral-500 sm:text-left">
          规则：按人格类别打散、轮流发牌，每组人数尽量均匀、类别尽量多样
        </p>
      </div>

      {/* 分组结果 */}
      {groups && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g, i) => {
            const catCount = new Set(g.map(m => m.category)).size
            return (
              <div key={i} className={`${cardCls(GROUP_COLORS[i % GROUP_COLORS.length])} p-4`}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-lg font-black">第 {i + 1} 组</span>
                  <span className="text-xs font-bold text-black/50">{g.length} 人 · {catCount} 类</span>
                </div>
                {g.length === 0 ? (
                  <p className="text-xs text-black/40">（本组轮空）</p>
                ) : (
                  <ul className="space-y-1.5">
                    {g.map(m => (
                      <li key={m.id} className="flex items-center gap-2 rounded-lg border border-black/20 bg-white/80 px-2.5 py-1.5">
                        <span className="font-bold">{m.nickname}</span>
                        <span className={`ml-auto rounded border border-black px-1.5 font-mono text-[10px] font-black ${CATEGORY_COLOR[m.category]}`}>
                          {m.code}
                        </span>
                        <span className={`text-xs ${CATEGORY_TEXT[m.category]}`}>{m.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
