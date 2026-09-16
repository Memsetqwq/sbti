import { DIMENSION_GROUPS, type Level } from '@/lib/sbti'

const LEVEL_PCT: Record<Level, number> = { L: 33, M: 66, H: 100 }
const LEVEL_COLOR: Record<Level, string> = {
  L: 'bg-sky-400',
  M: 'bg-amber-400',
  H: 'bg-rose-500',
}

export default function DimBars({ vector }: { vector: Level[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {DIMENSION_GROUPS.map(g => (
        <div key={g.label} className="rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0_#000]">
          <div className="mb-2 text-center text-sm font-black">{g.label}</div>
          <div className="space-y-2">
            {g.dims.map(d => {
              const idx = ['S1','S2','S3','E1','E2','E3','A1','A2','A3','Ac1','Ac2','Ac3','So1','So2','So3'].indexOf(d)
              const lv = vector[idx]
              return (
                <div key={d} className="flex items-center gap-2">
                  <span className="w-8 shrink-0 font-mono text-xs font-bold">{d}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full border border-black/20 bg-neutral-100">
                    <div
                      className={`h-full ${LEVEL_COLOR[lv]} transition-all`}
                      style={{ width: `${LEVEL_PCT[lv]}%` }}
                    />
                  </div>
                  <span className="w-4 shrink-0 text-center font-mono text-xs font-black">{lv}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
