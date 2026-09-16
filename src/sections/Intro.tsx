import { useState } from 'react'
import { cardCls } from '@/lib/style'

export default function Intro({ onStart }: { onStart: (nickname: string) => void }) {
  const [nickname, setNickname] = useState('')

  return (
    <div className="mx-auto max-w-xl">
      <div className={`${cardCls('bg-yellow-200')} p-6 sm:p-10 text-center`}>
        <div className="mb-2 inline-block -rotate-2 rounded-lg border-2 border-black bg-rose-400 px-3 py-1 text-xs font-black text-white shadow-[2px_2px_0_#000]">
          仅供娱乐 · 概不负责
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight">
          SBTI <span className="text-rose-500">人格测试</span>
        </h1>
        <p className="mt-3 text-lg sm:text-xl font-bold text-neutral-700">
          MBTI 已经过时，<span className="underline decoration-wavy decoration-rose-500">SBTI 来了</span>
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          32 道题 · 15 个维度 · 27 种人格 · 0 个科学依据
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <input
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && nickname.trim() && onStart(nickname.trim())}
            maxLength={12}
            placeholder="输入你的昵称（用于排行榜和分组）"
            className="flex-1 rounded-xl border-2 border-black bg-white px-4 py-3 text-center font-bold outline-none placeholder:font-normal placeholder:text-neutral-400 focus:shadow-[3px_3px_0_#000]"
          />
          <button
            disabled={!nickname.trim()}
            onClick={() => onStart(nickname.trim())}
            className="rounded-xl border-2 border-black bg-rose-500 px-6 py-3 font-black text-white shadow-[4px_4px_0_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0_#000] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:shadow-none"
          >
            开始测试 →
          </button>
        </div>
      </div>

      <div className={`${cardCls()} mt-6 p-4 text-xs leading-relaxed text-neutral-500`}>
        <span className="font-black text-neutral-700">免责声明：</span>
        本测试仅供娱乐，别拿它当诊断、面试、相亲、分手……或人生判决书。你可以笑，但别太当真。
      </div>
    </div>
  )
}
