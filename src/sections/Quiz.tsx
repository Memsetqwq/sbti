import { useMemo, useState } from 'react'
import {
  DRINK_QUESTION, HOBBY_QUESTION, OPTION_LETTERS, REGULAR_QUESTIONS,
  type Question,
} from '@/lib/sbti'
import { cardCls } from '@/lib/style'

const STYLE_TAG: Record<string, string> = {
  正经: 'bg-sky-200',
  无厘头: 'bg-lime-200',
  元恶搞: 'bg-fuchsia-200',
  特殊: 'bg-yellow-300',
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Quiz({ onDone }: { onDone: (answers: Record<number, number>) => void }) {
  // 30 道常规题随机排序，爱好题与饮酒态度题随机插入
  const questions = useMemo<Question[]>(() => {
    const qs = shuffle(REGULAR_QUESTIONS)
    const specials = shuffle([HOBBY_QUESTION, DRINK_QUESTION])
    for (const s of specials) {
      qs.splice(Math.floor(Math.random() * (qs.length + 1)), 0, s)
    }
    return qs
  }, [])

  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [picked, setPicked] = useState<number | null>(null)

  const q = questions[index]
  const total = questions.length
  const pct = Math.round((index / total) * 100)

  const pick = (optIdx: number) => {
    if (picked !== null) return
    setPicked(optIdx)
    const next = { ...answers, [q.id]: optIdx }
    setAnswers(next)
    setTimeout(() => {
      setPicked(null)
      if (index + 1 >= total) onDone(next)
      else setIndex(index + 1)
    }, 260)
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* 进度条 */}
      <div className="mb-4 flex items-center gap-3">
        <div className="h-4 flex-1 overflow-hidden rounded-full border-2 border-black bg-white">
          <div className="h-full bg-rose-400 transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        <span className="font-mono text-sm font-black">{index + 1}/{total}</span>
      </div>

      <div key={q.id} className={`${cardCls()} p-6 sm:p-8`}>
        <div className="mb-3 flex items-center gap-2">
          <span className={`rounded-md border border-black px-2 py-0.5 text-xs font-black ${STYLE_TAG[q.style]}`}>
            {q.style}题
          </span>
          {q.dimension && (
            <span className="rounded-md border border-black bg-neutral-100 px-2 py-0.5 font-mono text-xs font-bold text-neutral-500">
              {q.dimension}
            </span>
          )}
        </div>
        <h2 className="mb-6 text-lg sm:text-xl font-black leading-relaxed">{q.text}</h2>
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => pick(i)}
              className={`flex w-full items-start gap-3 rounded-xl border-2 border-black px-4 py-3 text-left font-bold transition-all
                ${picked === i
                  ? 'bg-rose-400 text-white shadow-[2px_2px_0_#000] scale-[1.01]'
                  : 'bg-white shadow-[3px_3px_0_#000] hover:-translate-y-0.5 hover:bg-yellow-100 active:translate-y-0 active:shadow-[1px_1px_0_#000]'}`}
            >
              <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-black font-mono text-xs font-black
                ${picked === i ? 'bg-white text-rose-500' : 'bg-yellow-300'}`}>
                {OPTION_LETTERS[i]}
              </span>
              <span className="leading-snug">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-neutral-400">
        别思考，凭直觉。思考也没用，反正不准。
      </p>
    </div>
  )
}
