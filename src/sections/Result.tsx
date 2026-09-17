import { useState } from 'react'
import DimBars from '@/components/DimBars'
import { type TestResult } from '@/lib/sbti'
import { CATEGORY_COLOR, cardCls } from '@/lib/style'

interface Props {
  nickname: string
  result: TestResult
  saved: boolean
  onSave: () => Promise<'cloud' | 'local'>
  onRetake: () => void
  pendingCount: number
  onRetrySync: () => Promise<boolean>
}

export default function Result({ nickname, result, saved, onSave, onRetake, pendingCount, onRetrySync }: Props) {
  const p = result.personality
  const [justSaved, setJustSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const catColor = CATEGORY_COLOR[p.category] ?? 'bg-neutral-200'

  const handleSave = async () => {
    setSaving(true)
    try {
      const where = await onSave()
      setJustSaved(true)
      setSaveMsg(where === 'cloud' ? '☁️ 已同步到云端排行榜' : '⏳ 云端拥挤，已存本机，稍后可重试')
    } finally {
      setSaving(false)
    }
  }

  const handleRetry = async () => {
    setRetrying(true)
    try {
      const ok = await onRetrySync()
      setSaveMsg(ok ? '☁️ 已同步到云端排行榜' : '⏳ 云端仍然拥挤，过会儿再试')
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className={`${cardCls()} overflow-hidden`}>
        <div className={`${catColor} border-b-2 border-black px-6 py-3 text-sm font-black`}>
          {nickname} 的 SBTI 人格 · {p.category}
        </div>
        <div className="p-6 sm:p-8 text-center">
          <div className="inline-block -rotate-2 rounded-2xl border-2 border-black bg-black px-6 py-2 font-mono text-4xl sm:text-5xl font-black tracking-wider text-yellow-300 shadow-[4px_4px_0_#f43f5e]">
            {p.code}
          </div>
          <h2 className="mt-4 text-3xl font-black">{p.name}</h2>
          <p className="mt-2 text-lg font-bold text-neutral-600">「{p.quote}」</p>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-neutral-500">{p.roast}</p>

          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="rounded-xl border-2 border-black bg-yellow-200 px-5 py-3 shadow-[3px_3px_0_#000]">
              <div className="text-xs font-bold text-neutral-500">匹配度</div>
              <div className="font-mono text-3xl font-black text-rose-600">{result.match}%</div>
            </div>
            {(result.isDrunk || result.isAllH) && (
              <div className="rounded-xl border-2 border-black bg-fuchsia-200 px-5 py-3 shadow-[3px_3px_0_#000]">
                <div className="text-xs font-bold text-neutral-500">稀有成就</div>
                <div className="text-lg font-black">{result.isDrunk ? '🍺 酒鬼认证' : '🎉 全 H 通关'}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-center text-lg font-black">你的 15 维人格光谱</h3>
        <DimBars vector={result.vector} />
        <div className="mt-2 flex justify-center gap-4 text-xs font-bold text-neutral-500">
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-sky-400" />L 低</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />M 中</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500" />H 高</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <button
          disabled={saved || justSaved || saving}
          onClick={() => { void handleSave() }}
          className="rounded-xl border-2 border-black bg-rose-500 px-8 py-3 font-black text-white shadow-[4px_4px_0_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0_#000] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:shadow-none"
        >
          {saving ? '同步中…' : saved || justSaved ? '✓ 已保存到排行榜' : '保存到排行榜'}
        </button>
        {justSaved && pendingCount > 0 && (
          <button
            disabled={retrying}
            onClick={() => { void handleRetry() }}
            className="rounded-xl border-2 border-black bg-sky-300 px-8 py-3 font-black shadow-[4px_4px_0_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0_#000] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:shadow-none"
          >
            {retrying ? '重试中…' : `重试同步（${pendingCount} 条未同步）`}
          </button>
        )}
        <button
          onClick={onRetake}
          className="rounded-xl border-2 border-black bg-white px-8 py-3 font-black shadow-[4px_4px_0_#000] transition-transform hover:-translate-y-0.5 hover:bg-yellow-100 active:translate-y-0 active:shadow-[1px_1px_0_#000]"
        >
          再测一次
        </button>
      </div>
      {saveMsg && (
        <p className="text-center text-sm font-bold text-emerald-600">{saveMsg}</p>
      )}
    </div>
  )
}
