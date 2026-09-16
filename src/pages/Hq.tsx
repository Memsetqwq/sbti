import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ADMIN_USER, ADMIN_PASSWORD } from '@/lib/cloud'
import { useRecords } from '@/lib/useRecords'
import PersonalityWall from '@/sections/PersonalityWall'
import GroupMaker from '@/sections/GroupMaker'
import DataManager from '@/sections/DataManager'
import { cardCls } from '@/lib/style'

const AUTH_KEY = 'sbti-hq-ok'

export default function Hq() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === '1')
  const [user, setUser] = useState('')
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState(false)
  const { records, offline, loading, refresh } = useRecords()

  const stats = useMemo(() => {
    const byCode = new Map<string, { name: string; count: number }>()
    for (const r of records) {
      const cur = byCode.get(r.code) ?? { name: r.name, count: 0 }
      cur.count++
      byCode.set(r.code, cur)
    }
    const list = [...byCode.entries()].map(([code, v]) => ({ code, ...v }))
    const top = [...list].sort((a, b) => b.count - a.count)[0]
    const rare = [...list].sort((a, b) => a.count - b.count)[0]
    return {
      total: records.length,
      kinds: byCode.size,
      top: top ? `${top.code} ${top.name}（${top.count}人）` : '—',
      rare: rare ? `${rare.code} ${rare.name}（${rare.count}人）` : '—',
    }
  }, [records])

  const tryLogin = () => {
    if (user.trim() === ADMIN_USER && pwd === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, '1')
      setAuthed(true)
    } else {
      setErr(true)
    }
  }

  // ─── 登录门 ───
  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50 bg-[radial-gradient(#0000000d_1px,transparent_1px)] [background-size:20px_20px] px-4">
        <div className={`${cardCls()} w-full max-w-sm p-8`}>
          <div className="text-center">
            <div className="text-4xl">🎖️</div>
            <h1 className="mt-3 text-2xl font-black">SBTI 指挥部</h1>
            <p className="mt-1 text-xs text-neutral-400">仅限组织者 · 账号口令请咨询活动负责人</p>
          </div>
          <div className="mt-6 space-y-3">
            <input
              value={user}
              onChange={e => { setUser(e.target.value); setErr(false) }}
              placeholder="账号"
              autoComplete="username"
              className={`w-full rounded-xl border-2 px-4 py-3 font-bold outline-none ${err ? 'border-rose-500 bg-rose-50' : 'border-black focus:shadow-[3px_3px_0_#000]'}`}
            />
            <input
              type="password"
              value={pwd}
              onChange={e => { setPwd(e.target.value); setErr(false) }}
              onKeyDown={e => e.key === 'Enter' && tryLogin()}
              placeholder="密码"
              autoComplete="current-password"
              className={`w-full rounded-xl border-2 px-4 py-3 font-bold outline-none ${err ? 'border-rose-500 bg-rose-50' : 'border-black focus:shadow-[3px_3px_0_#000]'}`}
            />
            {err && <p className="text-xs font-bold text-rose-500">账号或密码不对，再想想</p>}
            <button
              onClick={tryLogin}
              className="w-full rounded-xl border-2 border-black bg-black px-6 py-3 font-black text-yellow-300 shadow-[3px_3px_0_#f43f5e] transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              进入指挥部
            </button>
            <p className="text-center">
              <Link to="/" className="text-xs font-bold text-neutral-400 underline">← 返回测试</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ─── 指挥部主体 ───
  return (
    <div className="min-h-screen bg-amber-50 bg-[radial-gradient(#0000000d_1px,transparent_1px)] [background-size:20px_20px] font-sans text-neutral-900">
      <header className="sticky top-0 z-10 border-b-2 border-black bg-amber-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <span className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-black font-mono text-sm font-black text-yellow-300 shadow-[2px_2px_0_#f43f5e]">HQ</span>
            <span className="font-black">SBTI 指挥部</span>
          </span>
          <nav className="flex items-center gap-2">
            <Link to="/" className="rounded-lg border-2 border-black bg-white px-3 py-2 text-sm font-black shadow-[2px_2px_0_#000] hover:-translate-y-0.5">测试页</Link>
            <Link to="/screen" className="rounded-lg border-2 border-black bg-white px-3 py-2 text-sm font-black shadow-[2px_2px_0_#000] hover:-translate-y-0.5">📺 大屏</Link>
            <button
              onClick={() => { sessionStorage.removeItem(AUTH_KEY); setAuthed(false) }}
              className="rounded-lg border-2 border-black bg-white px-3 py-2 text-sm font-black text-rose-600 shadow-[2px_2px_0_#000] hover:bg-rose-100"
            >退出</button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-6 sm:py-8">
        {offline && (
          <div className="rounded-xl border-2 border-black bg-neutral-200 px-4 py-2.5 text-center text-sm font-black text-neutral-600 shadow-[3px_3px_0_#000]">
            📴 离线模式：仅显示本机数据
          </div>
        )}

        {/* 统计卡片 + 刷新 */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-black">总览</h2>
            <button
              onClick={() => void refresh(true)}
              disabled={loading}
              className="rounded-lg border-2 border-black bg-white px-4 py-2 text-sm font-black shadow-[2px_2px_0_#000] hover:bg-yellow-100 disabled:opacity-50"
            >
              {loading ? '刷新中…' : '🔄 刷新数据'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[['总人数', stats.total], ['已出现人格', stats.kinds], ['最多人人格', stats.top], ['最稀有人格', stats.rare]].map(([k, v]) => (
              <div key={k} className={`${cardCls('bg-yellow-200')} p-4 text-center`}>
                <div className="text-xs font-bold text-neutral-500">{k}</div>
                <div className="mt-1 text-xl font-black">{v}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 板块一：人格卡片墙 */}
        <section>
          <h2 className="mb-3 text-xl font-black">人格卡片墙 <span className="text-sm font-normal text-neutral-400">点 ▼ 展开完整档案</span></h2>
          <PersonalityWall records={records} />
        </section>

        {/* 板块二：自动分组 */}
        <section>
          <h2 className="mb-3 text-xl font-black">自动分组</h2>
          <GroupMaker records={records} />
        </section>

        {/* 板块三：数据管理 */}
        <section>
          <h2 className="mb-3 text-xl font-black">数据管理</h2>
          <DataManager records={records} refresh={refresh} />
        </section>
      </main>

      <footer className="border-t-2 border-black/10 py-6 text-center text-xs text-neutral-400">
        SBTI 团建镜像版 · 仅供娱乐
      </footer>
    </div>
  )
}
