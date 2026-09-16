export const CATEGORY_COLOR: Record<string, string> = {
  掌控高能组: 'bg-orange-300',
  情感组: 'bg-pink-300',
  抽象自嘲组: 'bg-violet-300',
  社交面具组: 'bg-sky-300',
  特殊组: 'bg-yellow-300',
}

export const CATEGORY_TEXT: Record<string, string> = {
  掌控高能组: 'text-orange-700',
  情感组: 'text-pink-700',
  抽象自嘲组: 'text-violet-700',
  社交面具组: 'text-sky-700',
  特殊组: 'text-yellow-700',
}

export function cardCls(color = 'bg-white') {
  return `rounded-2xl border-2 border-black ${color} shadow-[4px_4px_0_#000]`
}
