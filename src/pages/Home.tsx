import { useState } from 'react'
import Intro from '@/sections/Intro'
import Quiz from '@/sections/Quiz'
import Result from '@/sections/Result'
import Leaderboard from '@/sections/Leaderboard'
import { computeResult, type TestResult } from '@/lib/sbti'
import { pushCloudRecord } from '@/lib/cloud'
import { useRecords } from '@/lib/useRecords'

type Tab = 'test' | 'board'
type Stage = 'intro' | 'quiz' | 'result'

const TABS: { key: Tab; label: string }[] = [
  { key: 'test', label: '开始测试' },
  { key: 'board', label: '排行榜' },
]

export default function Home() {
  const [tab, setTab] = useState<Tab>('test')
  const [stage, setStage] = useState<Stage>('intro')
  const [nickname, setNickname] = useState('')
  const [result, setResult] = useState<TestResult | null>(null)
  const { records, pendingLocal, offline, loading, refresh, addLocal, markSynced, removeLocal, clearLocal } = useRecords()

  const startTest = (name: string) => {
    setNickname(name)
    setStage('quiz')
  }

  const finishQuiz = (answers: Record<number, number>) => {
    setResult(computeResult(answers))
    setStage('result')
  }

  // 写本机 + 提交云端；返回实际保存位置用于结果页提示
  const saveResult = async (): Promise<'cloud' | 'local'> => {
    if (!result) return 'local'
    const rec = addLocal({
      nickname,
      code: result.personality.code,
      name: result.personality.name,
      category: result.personality.category,
      match: result.match,
    }, false)
    const ok = await pushCloudRecord({
      name: rec.nickname,
      type: rec.code,
      match: rec.match,
      ts: rec.ts,
    })
    if (ok) markSynced([rec.id])
    void refresh(true)
    return ok ? 'cloud' : 'local'
  }

  // 重试同步所有本机未同步记录
  const retrySync = async (): Promise<boolean> => {
    const okIds: string[] = []
    for (const r of pendingLocal) {
      const ok = await pushCloudRecord({ name: r.nickname, type: r.code, match: r.match, ts: r.ts })
      if (ok) okIds.push(r.id)
    }
    if (okIds.length > 0) markSynced(okIds)
    void refresh(true)
    return okIds.length === pendingLocal.length
  }

  const retake = () => {
    setResult(null)
    setStage('intro')
  }

  return (
    <div className="min-h-screen bg-amber-50 bg-[radial-gradient(#0000000d_1px,transparent_1px)] [background-size:20px_20px] font-sans text-neutral-900">
      {/* 顶栏 */}
      <header className="sticky top-0 z-10 border-b-2 border-black bg-amber-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <button
            onClick={() => { setTab('test'); setStage('intro') }}
            className="flex items-center gap-2"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-rose-500 font-mono text-sm font-black text-white shadow-[2px_2px_0_#000]">SB</span>
            <span className="hidden font-black sm:inline">SBTI · 团建版</span>
          </button>
          <nav className="flex flex-wrap gap-1.5">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-lg border-2 border-black px-3 py-2 text-sm font-black transition-all sm:px-4
                  ${tab === t.key
                    ? 'bg-black text-yellow-300 shadow-[2px_2px_0_#f43f5e]'
                    : 'bg-white shadow-[2px_2px_0_#000] hover:-translate-y-0.5'}`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        {tab === 'test' && (
          <>
            {stage === 'intro' && <Intro onStart={startTest} />}
            {stage === 'quiz' && <Quiz onDone={finishQuiz} />}
            {stage === 'result' && result && (
              <Result
                nickname={nickname}
                result={result}
                saved={false}
                onSave={saveResult}
                onRetake={retake}
                pendingCount={pendingLocal.length}
                onRetrySync={retrySync}
              />
            )}
          </>
        )}
        {tab === 'board' && (
          <Leaderboard
            records={records}
            offline={offline}
            loading={loading}
            onRefresh={() => void refresh(true)}
            onRemoveLocal={removeLocal}
            onClearLocal={clearLocal}
          />
        )}
      </main>

      <footer className="border-t-2 border-black/10 py-6 text-center text-xs text-neutral-400">
        SBTI · Silly Big Personality Test · 仅供娱乐，别太当真
        <br />
        SBTI 团建镜像版 · 仅供娱乐
      </footer>
    </div>
  )
}
