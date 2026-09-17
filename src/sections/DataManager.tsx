import { useMemo, useState } from 'react'
import { deleteCloudRecord, clearCloudRecords } from '@/lib/cloud'
import { CATEGORY_COLOR, cardCls } from '@/lib/style'
import type { MergedRecord } from '@/lib/useRecords'

interface Props {
  records: MergedRecord[]
  refresh: (force?: boolean) => Promise<void>
}

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

export default function DataManager({ records, refresh }: Props) {
  const [open, setOpen] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('ts')
  const [sortDesc, setSortDesc] = useState(true)
  const [confirmClear, setConfirmClear] = useState(false)
  const [busy, setBusy] = useState(false)

  const cloudCount = useMemo(() => records.filter(r => r.source === 'cloud').length, [records])

  const sorted = useMemo(() => {
    const arr = [...records]
    arr.sort((a, b) => (sortDesc ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]))
    return arr
  }, [records, sortKey, sortDesc])

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
    if (r.source !== 'cloud') return
    if (!window.confirm(`删除 ${r.nickname}（${r.code}）这条云端记录？`)) return
    setBusy(true)
    await deleteCloudRecord({ name: r.nickname, ts: r.ts })
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
    <div className={`${cardCls()} overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between border-black bg-violet-200 px-5 py-3 font-black"
      >
        <span>数据管理（{records.length} 条，云端 {cloudCount}）</span>
        <span className="font-mono">{open ? '▲ 收起' : '▼ 展开'}</span>
      </button>

      {open && (
        <div className="border-t-2 border-black">
          {/* 操作栏 */}
          <div className="flex flex-wrap items-center gap-2 border-b-2 border-black/10 p-4">
            <button onClick={exportJSON} className="rounded-lg border-2 border-black bg-sky-200 px-4 py-2 text-sm font-black shadow-[2px_2px_0_#000] hover:-translate-y-0.5">导出 JSON</button>
            <button onClick={exportCSV} className="rounded-lg border-2 border-black bg-lime-200 px-4 py-2 text-sm font-black shadow-[2px_2px_0_#000] hover:-translate-y-0.5">导出 CSV</button>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-black/10 bg-neutral-50 text-left text-xs text-neutral-500">
                  <th className="cursor-pointer select-none px-4 py-2.5" onClick={() => toggleSort('ts')}>
                    时间 {sortKey === 'ts' && (sortDesc ? '↓' : '↑')}
                  </th>
                  <th className="px-4 py-2.5">昵称</th>
                  <th className="px-4 py-2.5">人格</th>
                  <th className="cursor-pointer select-none px-4 py-2.5" onClick={() => toggleSort('match')}>
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
      )}
    </div>
  )
}
