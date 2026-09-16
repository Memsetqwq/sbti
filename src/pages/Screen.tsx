import { useEffect, useMemo, useRef, useState } from 'react'
import { PERSONALITIES } from '@/lib/sbti'
import { fetchGroups, type PublishedGroups } from '@/lib/cloud'
import { useRecords } from '@/lib/useRecords'
import { onColor, personalityColor } from '@/lib/personality-colors'

const REFRESH_MS = 25_000

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const p = (n: number) => String(n).padStart(2, '0')
  return (
    <span className="font-mono">{p(now.getHours())}:{p(now.getMinutes())}:{p(now.getSeconds())}</span>
  )
}

export default function Screen() {
  const { records, offline, refresh } = useRecords()
  const [groupsData, setGroupsData] = useState<PublishedGroups | null>(null)
  const seenMaxTs = useRef(0)
  const [freshSince, setFreshSince] = useState(0)

  // 定时刷新：记录 + 分组结果
  useEffect(() => {
    const pull = async () => {
      await refresh(true)
      setGroupsData(await fetchGroups())
    }
    void pull()
    const t = setInterval(() => { void pull() }, REFRESH_MS)
    return () => clearInterval(t)
  }, [refresh])

  // 新记录高亮：以上一轮刷新看到的最大 ts 为基准
  useEffect(() => {
    const maxTs = records.reduce((m, r) => Math.max(m, r.ts), 0)
    if (seenMaxTs.current === 0) {
      seenMaxTs.current = maxTs // 首次加载不高亮历史数据
    } else if (maxTs > seenMaxTs.current) {
      setFreshSince(seenMaxTs.current)
      seenMaxTs.current = maxTs
    }
  }, [records])

  const stats = useMemo(() => ({
    total: records.length,
    kinds: new Set(records.map(r => r.code)).size,
  }), [records])

  // 人格卡片墙精简版：有人的，按人数排序
  const wall = useMemo(() => {
    const cnt = new Map<string, number>()
    for (const r of records) cnt.set(r.code, (cnt.get(r.code) ?? 0) + 1)
    return PERSONALITIES
      .filter(p => cnt.has(p.code))
      .map(p => ({ p, count: cnt.get(p.code)! }))
      .sort((a, b) => b.count - a.count || a.p.code.localeCompare(b.p.code))
  }, [records])

  const qrSrc = `${import.meta.env.BASE_URL}sbti-qr.png`

  return (
    <div className="min-h-screen bg-[#16130f] font-sans text-amber-50 selection:bg-rose-500">
      {/* 顶部 */}
      <header className="border-b-4 border-black bg-[#1e1a15] px-6 py-5 sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              SBTI 人格测试 <span className="text-rose-500">· 现场直击</span>
            </h1>
            <p className="mt-2 text-lg font-bold text-amber-200/60">
              MBTI 已经过时，SBTI 来了
              {offline && <span className="ml-3 rounded border border-amber-500/50 px-2 py-0.5 text-sm text-amber-400">📴 离线模式：仅显示本机数据</span>}
            </p>
          </div>
          <div className="flex gap-3 sm:gap-4">
            <div className="rounded-xl border-2 border-black bg-rose-500 px-5 py-3 text-center shadow-[4px_4px_0_#000]">
              <div className="text-xs font-bold text-white/70">已测人数</div>
              <div className="font-mono text-3xl font-black">{stats.total}</div>
            </div>
            <div className="rounded-xl border-2 border-black bg-sky-400 px-5 py-3 text-center text-neutral-900 shadow-[4px_4px_0_#000]">
              <div className="text-xs font-bold text-neutral-700">已出现人格</div>
              <div className="font-mono text-3xl font-black">{stats.kinds}<span className="text-lg">/27</span></div>
            </div>
            <div className="hidden rounded-xl border-2 border-black bg-amber-300 px-5 py-3 text-center text-neutral-900 shadow-[4px_4px_0_#000] sm:block">
              <div className="text-xs font-bold text-neutral-700">当前时间</div>
              <div className="text-2xl font-black"><Clock /></div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-8 sm:px-10 lg:grid-cols-3">
        {/* 主区：人格墙精简版 */}
        <section className="lg:col-span-2">
          <h2 className="mb-4 text-2xl font-black text-amber-200/80">人格势力分布</h2>
          {wall.length === 0 ? (
            <p className="rounded-2xl border-2 border-dashed border-amber-200/20 p-10 text-center text-xl font-bold text-amber-200/40">
              虚位以待 —— 扫码开测，抢占第一个人格席位
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {wall.map(({ p, count }) => {
                const c = personalityColor(p.code)
                return (
                  <div
                    key={p.code}
                    className="rounded-xl border-2 border-black p-4 shadow-[4px_4px_0_#000]"
                    style={{ backgroundColor: c, color: onColor(c) }}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-2xl font-black tracking-wide">{p.code}</span>
                      <span className="font-mono text-3xl font-black">{count}</span>
                    </div>
                    <div className="mt-1 text-sm font-bold opacity-85">{p.name}</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* 分组结果（若已发布） */}
          {groupsData && (
            <div className="mt-10">
              <h2 className="mb-1 text-2xl font-black text-amber-200/80">分组结果</h2>
              <p className="mb-4 text-sm font-bold text-amber-200/40">
                发布于 {new Date(groupsData.ts).toLocaleTimeString('zh-CN')}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {groupsData.groups.map((g, i) => (
                  <div key={i} className="rounded-xl border-2 border-black bg-amber-50 p-4 text-neutral-900 shadow-[4px_4px_0_#f43f5e]">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xl font-black">第 {i + 1} 组</span>
                      <span className="text-xs font-bold text-neutral-400">{g.length} 人</span>
                    </div>
                    <ul className="space-y-1.5">
                      {g.map((m, j) => {
                        const c = personalityColor(m.code)
                        return (
                          <li key={j} className="flex items-center gap-2 text-base">
                            <span className="h-3 w-3 shrink-0 rounded border border-black" style={{ backgroundColor: c }} />
                            <span className="font-bold">{m.name}</span>
                            <span className="ml-auto rounded border border-black px-1.5 font-mono text-[10px] font-black" style={{ backgroundColor: c, color: onColor(c) }}>
                              {m.code}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 右侧：实时榜单 */}
        <aside>
          <h2 className="mb-4 text-2xl font-black text-amber-200/80">最新战报</h2>
          <ul className="space-y-2.5">
            {records.slice(0, 12).map(r => {
              const c = personalityColor(r.code)
              const fresh = freshSince > 0 && r.ts > freshSince
              return (
                <li
                  key={r.id}
                  className={`flex items-center gap-3 rounded-xl border-2 border-black px-4 py-3 shadow-[3px_3px_0_#000] ${fresh ? 'bg-amber-300 text-neutral-900' : 'bg-[#241f19] text-amber-50'}`}
                >
                  <span className="shrink-0 rounded-md border border-black px-2 py-0.5 font-mono text-sm font-black" style={{ backgroundColor: c, color: onColor(c) }}>
                    {r.code}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-lg font-black">{r.nickname}</span>
                  {fresh && <span className="shrink-0 rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-black text-white">NEW</span>}
                  <span className={`shrink-0 font-mono text-lg font-black ${fresh ? 'text-rose-600' : 'text-rose-400'}`}>{r.match}%</span>
                </li>
              )
            })}
            {records.length === 0 && (
              <li className="rounded-xl border-2 border-dashed border-amber-200/20 p-6 text-center font-bold text-amber-200/40">
                等待第一位勇士…
              </li>
            )}
          </ul>

          {/* 二维码 */}
          <div className="mt-8 rounded-2xl border-2 border-black bg-amber-50 p-5 text-center text-neutral-900 shadow-[4px_4px_0_#f43f5e]">
            <img
              src={qrSrc}
              alt="扫码上车"
              className="mx-auto w-36 rounded-lg border-2 border-black sm:w-44"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <p className="mt-3 text-xl font-black">扫码上车</p>
            <p className="mt-1 break-all font-mono text-xs text-neutral-500">memsetqwq.github.io/sbti/</p>
          </div>
        </aside>
      </main>

      <footer className="px-6 pb-6 text-center text-xs font-bold text-amber-200/30">
        SBTI 团建镜像版 · 仅供娱乐
      </footer>
    </div>
  )
}
