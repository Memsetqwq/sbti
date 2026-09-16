import { useEffect, useMemo, useState } from 'react'
import { ADMIN_PASSWORD, deleteCloudRecord, clearCloudRecords } from '@/lib/cloud'
import type { MergedRecord } from '@/lib/useRecords'
import Groups from '@/sections/Groups'
import { CATEGORY_COLOR, cardCls } from '@/lib/style'

interface Props {
  records: MergedRecord[]
  offline: boolean
  loading: boolean
  refresh: (force?: boolean) => Promise<void>
}

const AUTH_KEY = 'sbti-admin-ok'

type SortKey = 'ts' | 'match'

function fmtFull(ts: number) {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function csvCell(v: string | number) {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export default function Admin({ records, offline, loading, refresh }: Props) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === '1')
  const [pwd, setPwd] = useState('')
  const [pwdErr, setPwdErr] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('ts')
  const [sortDesc, setSortDesc] = useState(true)
  const [confirmClear, setConfirmClear] = useState(false)
  const [busy, setBusy] = useState(false)
  const [bigScreen, setBigScreen] = useState(false)

  const cloudOnly = useMemo(() => records.filter(r => r.source === 'cloud'), [records])

  // 大屏模式：每 30 秒自动刷新
  useEffect(() => {
    if (!bigScreen) return
    const t = setInterval(() => { void refresh(true) }, 30_000)
    return () => clearInterval(t)
  }, [bigScreen, refresh])

  const sorted = useMemo(() => {
    const arr = [...records]
    arr.sort((a, b) => (sortDesc ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]))
    return arr
  }, [records, sortKey, sortDesc])

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

  // ─── 口令门 ───
  if (!authed) {
    return (
      <div className="mx-auto max-w-sm">
        <div className={`${cardCls()} p-8 text-center`}>
          <div className="text-4xl">🔐</div>
          <h2 className="mt-3 text-xl font-black">管理后台</h2>
          <p className="mt-1 text-xs text-neutral-400">口令请咨询组织者</p>
          <input
            type="password"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setPwdErr(false) }}
            onKeyDown={e => {
              if (e.key !== 'Enter') return
              if (pwd === ADMIN_PASSWORD) { sessionStorage.setItem(AUTH_KEY, '1'); setAuthed(true) }
              else setPwdErr(true)
            }}
            placeholder="输入管理口令"
            className={`mt-5 w-full rounded-xl border-2 px-4 py-3 text-center font-bold outline-none ${pwdErr ? 'border-rose-500 bg-rose-50' : 'border-black focus:shadow-[3px_3px_0_#000]'}`}
          />
          {pwdErr && <p className="mt-2 text-xs font-bold text-rose-500">口令不对，再想想</p>}
          <button
            onClick={() => {
              if (pwd === ADMIN_PASSWORD) { sessionStorage.setItem(AUTH_KEY, '1'); setAuthed(true) }
              else setPwdErr(true)
            }}
            className="mt-4 w-full rounded-xl border-2 border-black bg-black px-6 py-3 font-black text-yellow-300 shadow-[3px_3px_0_#f43f5e] transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            进入
          </button>
        </div>
      </div>
    )
  }

  // ─── 大屏模式（投屏） ───
  if (bigScreen) {
    const dist = [...statsDist(records)]
    const maxC = Math.max(1, ...dist.map(d => d.count))
    return (
      <div className="mx-auto max-w-5xl space-y-8 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-4xl font-black sm:text-5xl">SBTI 团建实时榜单</h2>
            <p className="mt-2 text-lg font-bold text-neutral-500">
              已测 {stats.total} 人 · {stats.kinds} 种人格 {offline && '· 📴 离线'} · 每 30 秒自动刷新
            </p>
          </div>
          <button
            onClick={() => setBigScreen(false)}
            className="shrink-0 rounded-lg border-2 border-black bg-white px-3 py-1.5 text-xs font-black opacity-60 hover:opacity-100"
          >退出大屏</button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[['总人数', stats.total], ['人格种类', stats.kinds], ['最多人', stats.top], ['最稀有', stats.rare]].map(([k, v]) => (
            <div key={k} className={`${cardCls('bg-yellow-200')} p-5 text-center`}>
              <div className="text-sm font-bold text-neutral-500">{k}</div>
              <div className="mt-1 text-2xl font-black sm:text-3xl">{v}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className={`${cardCls()} p-6`}>
            <h3 className="mb-4 text-2xl font-black">最新提交</h3>
            <ul className="space-y-3">
              {records.slice(0, 10).map(r => (
                <li key={r.id} className="flex items-center gap-3 text-xl">
                  <span className={`shrink-0 rounded-md border border-black px-2 py-0.5 font-mono text-sm font-black ${CATEGORY_COLOR[r.category] ?? 'bg-neutral-200'}`}>{r.code}</span>
                  <span className="truncate font-black">{r.nickname}</span>
                  <span className="ml-auto shrink-0 font-mono font-black text-rose-600">{r.match}%</span>
                </li>
              ))}
              {records.length === 0 && <li className="text-lg text-neutral-400">等待第一位勇士…</li>}
            </ul>
          </div>
          <div className={`${cardCls()} p-6`}>
            <h3 className="mb-4 text-2xl font-black">人格分布</h3>
            <div className="space-y-3">
              {dist.sort((a, b) => b.count - a.count).map(d => (
                <div key={d.code} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 font-mono text-lg font-black">{d.code}</span>
                  <div className="h-7 flex-1 overflow-hidden rounded-md border border-black/20 bg-neutral-100">
                    <div className={`flex h-full items-center px-2 ${CATEGORY_COLOR[d.category] ?? 'bg-neutral-300'}`} style={{ width: `${(d.count / maxC) * 100}%` }}>
                      <span className="font-mono text-sm font-black">{d.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── 常规管理界面 ───
  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDesc(!sortDesc)
    else { setSortKey(k); setSortDesc(true) }
  }

  const exportJSON = () => {
    const data = records.map(({ nickname, code, name, category, match, ts, source }) => ({ nickname, code, name, category, match, ts, time: fmtFull(ts), source }))
    download(`sbti-records-${Date.now()}.json`, JSON.stringify(data, null, 2), 'application/json')
  }

  const exportCSV = () => {
    const header = '时间,昵称,人格代号,绰号,分类,匹配度,来源'
    const lines = records.map(r => [fmtFull(r.ts), r.nickname, r.code, r.name, r.category, r.match, r.source === 'cloud' ? '云端' : '本机'].map(csvCell).join(','))
    download(`sbti-records-${Date.now()}.csv`, '﻿' + [header, ...lines].join('\n'), 'text/csv;charset=utf-8')
  }

  const handleDelete = async (r: MergedRecord) => {
    if (!r.basket) return
    if (!window.confirm(`删除 ${r.nickname}（${r.code}）这条云端记录？`)) return
    setBusy(true)
    await deleteCloudRecord(r.basket)
    await refresh(true)
    setBusy(false)
  }

  const handleClearAll = async () => {
    setBusy(true)
    await clearCloudRecords()
    await refresh(true)
    setConfirmClear(false)
    setBusy(false)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {offline && (
        <div className="rounded-xl border-2 border-black bg-neutral-200 px-4 py-2.5 text-center text-sm font-black text-neutral-600 shadow-[3px_3px_0_#000]">
          📴 离线模式：仅显示本机数据
        </div>
      )}

      {/* 汇总统计 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['总人数', stats.total], ['人格种类', stats.kinds], ['最多人', stats.top], ['最稀有', stats.rare]].map(([k, v]) => (
          <div key={k} className={`${cardCls('bg-yellow-200')} p-4 text-center`}>
            <div className="text-xs font-bold text-neutral-500">{k}</div>
            <div className="mt-1 text-xl font-black">{v}</div>
          </div>
        ))}
      </div>

      {/* 操作栏 */}
      <div className={`${cardCls()} flex flex-wrap items-center gap-2 p-4`}>
        <button onClick={() => void refresh(true)} disabled={loading} className="rounded-lg border-2 border-black bg-white px-4 py-2 text-sm font-black shadow-[2px_2px_0_#000] hover:bg-yellow-100 disabled:opacity-50">
          {loading ? '刷新中…' : '🔄 刷新数据'}
        </button>
        <button onClick={exportJSON} className="rounded-lg border-2 border-black bg-sky-200 px-4 py-2 text-sm font-black shadow-[2px_2px_0_#000] hover:-translate-y-0.5">导出 JSON</button>
        <button onClick={exportCSV} className="rounded-lg border-2 border-black bg-lime-200 px-4 py-2 text-sm font-black shadow-[2px_2px_0_#000] hover:-translate-y-0.5">导出 CSV</button>
        <button onClick={() => setBigScreen(true)} className="rounded-lg border-2 border-black bg-black px-4 py-2 text-sm font-black text-yellow-300 shadow-[2px_2px_0_#f43f5e] hover:-translate-y-0.5">📺 大屏模式</button>
        <span className="ml-auto flex items-center gap-2">
          {confirmClear ? (
            <>
              <span className="text-xs font-bold text-rose-600">确定清空全部云端数据？不可恢复！</span>
              <button onClick={() => void handleClearAll()} disabled={busy} className="rounded-lg border-2 border-black bg-rose-500 px-3 py-2 text-xs font-black text-white disabled:opacity-50">确认清空</button>
              <button onClick={() => setConfirmClear(false)} className="rounded-lg border-2 border-black bg-white px-3 py-2 text-xs font-black">取消</button>
            </>
          ) : (
            <button onClick={() => setConfirmClear(true)} className="rounded-lg border-2 border-black bg-white px-3 py-2 text-xs font-black text-rose-600 hover:bg-rose-100">⚠️ 清空云端</button>
          )}
        </span>
      </div>

      {/* 记录表格 */}
      <div className={`${cardCls()} overflow-hidden`}>
        <div className="border-b-2 border-black bg-violet-200 px-4 py-3 font-black">
          全部记录（{records.length}，云端 {cloudOnly.length}）
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-black/10 bg-neutral-50 text-left text-xs text-neutral-500">
                <th className="cursor-pointer px-4 py-2.5 select-none" onClick={() => toggleSort('ts')}>
                  时间 {sortKey === 'ts' && (sortDesc ? '↓' : '↑')}
                </th>
                <th className="px-4 py-2.5">昵称</th>
                <th className="px-4 py-2.5">人格</th>
                <th className="cursor-pointer px-4 py-2.5 select-none" onClick={() => toggleSort('match')}>
                  匹配度 {sortKey === 'match' && (sortDesc ? '↓' : '↑')}
                </th>
                <th className="px-4 py-2.5">来源</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {sorted.map(r => (
                <tr key={r.id} className="hover:bg-yellow-50">
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-neutral-500">{fmtFull(r.ts)}</td>
                  <td className="px-4 py-2.5 font-black">{r.nickname}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <span className={`mr-1.5 rounded border border-black px-1.5 font-mono text-[10px] font-black ${CATEGORY_COLOR[r.category] ?? 'bg-neutral-200'}`}>{r.code}</span>
                    <span className="text-neutral-600">{r.name}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono font-bold text-rose-600">{r.match}%</td>
                  <td className="px-4 py-2.5 text-xs text-neutral-400">{r.source === 'cloud' ? '☁️ 云端' : '本机'}</td>
                  <td className="px-4 py-2.5">
                    {r.source === 'cloud' && (
                      <button
                        onClick={() => void handleDelete(r)}
                        disabled={busy}
                        className="rounded-md border border-black/30 px-1.5 text-xs text-neutral-400 hover:border-rose-500 hover:text-rose-500 disabled:opacity-40"
                      >✕</button>
                    )}
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-neutral-400">暂无记录</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分组（基于云端全量数据） */}
      <div>
        <h3 className="mb-3 text-lg font-black">团建分组（基于全量数据）</h3>
        <Groups records={records} />
      </div>
    </div>
  )
}

function statsDist(records: MergedRecord[]) {
  const m = new Map<string, { code: string; category: string; count: number }>()
  for (const r of records) {
    const cur = m.get(r.code) ?? { code: r.code, category: r.category, count: 0 }
    cur.count++
    m.set(r.code, cur)
  }
  return m.values()
}
