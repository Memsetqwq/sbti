// ─────────────────────────────────────────────────────────────────────────────
// SBTI (Silly Big Personality Test) · 数据与计分逻辑
// 维度顺序：自我 S1-S3 / 情感 E1-E3 / 态度 A1-A3 / 行动 Ac1-Ac3 / 社交 So1-So3
// ─────────────────────────────────────────────────────────────────────────────

export type Level = 'L' | 'M' | 'H'

export const DIMENSIONS = [
  'S1', 'S2', 'S3',
  'E1', 'E2', 'E3',
  'A1', 'A2', 'A3',
  'Ac1', 'Ac2', 'Ac3',
  'So1', 'So2', 'So3',
] as const

export type Dimension = (typeof DIMENSIONS)[number]

export const DIMENSION_GROUPS: { label: string; dims: Dimension[] }[] = [
  { label: '自我', dims: ['S1', 'S2', 'S3'] },
  { label: '情感', dims: ['E1', 'E2', 'E3'] },
  { label: '态度', dims: ['A1', 'A2', 'A3'] },
  { label: '行动', dims: ['Ac1', 'Ac2', 'Ac3'] },
  { label: '社交', dims: ['So1', 'So2', 'So3'] },
]

export interface Personality {
  code: string
  name: string // 中文绰号
  quote: string // 台词
  roast: string // 毒舌/自嘲解读
  category: string // 所属分类
  signature: Level[] // 15 维签名
}

function sig(s: string): Level[] {
  return s.replace(/-/g, '').split('') as Level[]
}

export const CATEGORIES = ['掌控高能组', '情感组', '抽象自嘲组', '社交面具组', '特殊组'] as const

export const PERSONALITIES: Personality[] = [
  // 分类一「掌控高能组」
  { code: 'CTRL', name: '拿捏者', quote: '怎么样，被我拿捏了吧？', category: '掌控高能组', signature: sig('HHH-HMH-MHH-HHH-MHM'),
    roast: '你的人生信条是"一切尽在掌握"，哪怕掌握的是一地鸡毛。别人焦虑时你在布局，别人布局时你已经收网。小心别把自己也拿捏进去。' },
  { code: 'BOSS', name: '领导者', quote: '方向盘给我，我来开。', category: '掌控高能组', signature: sig('HHH-HMH-MMH-HHH-LHL'),
    roast: '天生的司机位选手，坐副驾都嫌手痒。你带队时大家很安心，你不在时大家……其实也挺安心。' },
  { code: 'GOGO', name: '行者', quote: 'gogogo~出发咯', category: '掌控高能组', signature: sig('HHM-HMH-MMH-HHH-MHM'),
    roast: '你的字典里没有"等等"，只有"走你"。计划？先出发，路上再编。跟你混的人不是在赶路，就是在赶路。' },
  { code: 'SEXY', name: '尤物', quote: '您就是天生的尤物！', category: '掌控高能组', signature: sig('HMH-HHL-HMM-HMM-HLH'),
    roast: '你路过的地方空气都会变得昂贵三分。魅力这东西你拿来当日用品，别人当奢侈品。请克制，凡人心脏受不了。' },
  { code: 'THAN-K', name: '感恩者', quote: '我感谢苍天！我感谢大地！', category: '掌控高能组', signature: sig('MHM-HMM-HHM-MMH-MHL'),
    roast: '你的感恩额度没有上限，从苍天大地到楼下外卖。世界欠你一个拥抱，你先给了世界十个。' },
  // 分类二「情感组」
  { code: 'LOVE-R', name: '多情者', quote: '爱意太满，现实显得有点贫瘠', category: '情感组', signature: sig('MLH-LHL-HLH-MLM-MLH'),
    roast: '你的心动是批发式的，见一个爱一个，爱一个深一个。建议你给心脏装个分流器，不然早晚短路。' },
  { code: 'MUM', name: '妈妈', quote: '或许…我可以叫你妈妈吗….?', category: '情感组', signature: sig('MMH-MHL-HMM-LMM-HLL'),
    roast: '你浑身散发着母性的光辉，朋友失恋找你、猫生病找你、WiFi 断了也找你。你不是妈，你是人形 120。' },
  { code: 'ATM-er', name: '送钱者', quote: '你以为我很有钱吗？', category: '情感组', signature: sig('HHH-HHM-HHH-HMH-MHL'),
    roast: '你的钱包对朋友永远敞开，对自己永远"下次一定"。银行看了都想给你发好人卡。' },
  // 分类三「抽象自嘲组」
  { code: 'MALO', name: '吗喽', quote: '人生是个副本，而我只是一只吗喽', category: '抽象自嘲组', signature: sig('MLH-MHM-MLH-MLH-LMH'),
    roast: '你已参透宇宙的真相：大家都是吗喽，只不过有的吗喽香蕉多一点。躺得很安详，笑得很大声。' },
  { code: 'SHIT', name: '愤世者', quote: '这个世界，构石一坨', category: '抽象自嘲组', signature: sig('HHL-HLH-LMM-HHM-LHH'),
    roast: '你眼里的世界像没冲的厕所，但你依然每天坚持冲水。愤怒是你的有氧运动，请继续保持肺活量。' },
  { code: 'DEAD', name: '死者', quote: '我，还活着吗？', category: '抽象自嘲组', signature: sig('LLL-LLM-LML-LLL-LHM'),
    roast: '生命体征：存疑。精神状态：已注销。你是行走的省流模式，活着全靠惯性。记得按时呼吸。' },
  { code: 'ZZZZ', name: '装死者', quote: '我没死，我只是在睡觉', category: '抽象自嘲组', signature: sig('MHL-MLH-LML-MML-LHM'),
    roast: '你不是摆烂，你是在待机充电。虽然这个"充电"已经充了三年，但姿势很专业，勿扰。' },
  { code: 'FUCK', name: '草者', quote: '操！这是什么人格？', category: '抽象自嘲组', signature: sig('MLL-LHL-LLM-MLL-HLH'),
    roast: '你的语言系统由语气驱物驱动，一个"操"字能表达八百种情绪。文学大师，以字服人。' },
  { code: 'WOC!', name: '握草人', quote: '卧槽，我怎么是这个人格？', category: '抽象自嘲组', signature: sig('HHL-HMH-MMH-HHM-LHH'),
    roast: '卧槽是你的逗号、句号和感叹号。世界在你眼里处处是惊喜（吓），你的反射弧随时准备加班。' },
  { code: 'OH-NO', name: '哦不人', quote: '哦不！我怎么会是这个人格？！', category: '抽象自嘲组', signature: sig('HHL-LMH-LHH-HHM-LHL'),
    roast: '哦不，你点开了这个测试；哦不，你测出了这个人格；哦不，你居然觉得挺准。人生就是一连串优雅的翻车。' },
  { code: 'OJBK', name: '无所谓人', quote: '我说随便，是真的随便', category: '抽象自嘲组', signature: sig('MMH-MMM-HML-LMM-MML'),
    roast: '别人嘴里的"随便"是送命题，你的"随便"是真的无欲无求。佛系到让佛祖都想跟你学习。' },
  { code: 'Dior-s', name: '屌丝', quote: '等着我屌丝逆袭', category: '抽象自嘲组', signature: sig('MHM-MMH-MHM-HMH-LHL'),
    roast: '开局一条内裤，装备全靠等。但别笑，逆袭剧本的男主角都是你这种画风的。稳住，我们能赢。' },
  { code: 'POOR', name: '贫困者', quote: '我穷，但我很专', category: '抽象自嘲组', signature: sig('HHL-MLH-LMH-HHH-LHL'),
    roast: '钱包空空，赛道专一。你把所有的天赋点都加在了一件事上，除了赚钱。财富会迟到，但专一会陪你到老。' },
  { code: 'IMFW', name: '废物', quote: '我真的…是废物吗？', category: '抽象自嘲组', signature: sig('LLH-LHL-LML-LLL-MLL'),
    roast: '首先，能做完 32 道题的废物，执行力已经超过 80% 的人类。其次，废物是放错位置的资源，你只是还没被回收。' },
  { code: 'IMSB', name: '自我攻击者', quote: '认真的么？我真的是傻逼么？', category: '抽象自嘲组', signature: sig('LLM-LMM-LLL-LLL-MLM'),
    roast: '你攻击自己的火力比全世界的喷子加起来都猛。建议把这份严苛分一点给别人，或者干脆放过自己。' },
  // 分类四「社交面具组」
  { code: 'FAKE', name: '伪人', quote: '已经，没有人类了', category: '社交面具组', signature: sig('HLM-MML-MLM-MLM-HLH'),
    roast: '你的社交模式运行得像一个训练过度的 AI：礼貌、标准、无懈可击，就是不太像人。摘下面具记得喘口气。' },
  { code: 'JOKE-R', name: '小丑', quote: '原来我们都是小丑', category: '社交面具组', signature: sig('LLH-LHL-LML-LLL-MLM'),
    roast: '你把快乐批发给所有人，把深夜留给自己。剧场散场后，记得给自己也鼓个掌。' },
  { code: 'SOLO', name: '孤儿', quote: '我哭了，我怎么会是孤儿？', category: '社交面具组', signature: sig('LML-LLH-LHL-LML-LHM'),
    roast: '组队永远缺人，拼单永远差一位。但 solo 也是一种超能力：不用等人、不用迁就、厕所永远有纸。' },
  { code: 'MONK', name: '僧人', quote: '没有那种世俗的欲望', category: '社交面具组', signature: sig('HHL-LLH-LLM-MML-LHM'),
    roast: '红尘与你之间隔着一层钢化玻璃。别人内耗时你在冥想，别人抢红包时你已四大皆空。善哉。' },
  { code: 'THIN-K', name: '思考者', quote: '已深度思考100s', category: '社交面具组', signature: sig('HHL-HMH-MLH-MHM-LHH'),
    roast: '你的大脑 24 小时后台高负载运行，别人问你"想什么呢"，你答"没什么"——因为说完全部内容需要三天。' },
  // 特殊
  { code: 'HHHH', name: '傻乐者', quote: '哈哈哈哈哈哈', category: '特殊组', signature: sig('HHH-HHH-HHH-HHH-HHH'),
    roast: '15 个维度全部拉满，你是测试系统都懒得分析的纯种乐天派。世界是你的游乐园，哈哈就完事了。' },
  { code: 'DRUNK', name: '酒鬼', quote: '烈酒烧喉，不得不醉', category: '特殊组', signature: sig('HHH-HHH-HHH-HHH-HHH'),
    roast: '保温杯里泡白酒，酒精是你的人生导师。测什么人格，你的人格早在第三杯的时候就离家出走了。' },
]

export const REGULAR_PERSONALITIES = PERSONALITIES.filter(p => p.category !== '特殊组')

// ─── 题库 ────────────────────────────────────────────────────────────────────

export interface Question {
  id: number
  text: string
  dimension: Dimension | null // 特殊题为 null
  style: '正经' | '无厘头' | '元恶搞' | '特殊'
  options: { label: string; level: Level | null }[]
}

// 30 道常规题：每维度 2 题；A/B/C 对应 level
export const REGULAR_QUESTIONS: Question[] = [
  // —— 真实原题（10 道）——
  { id: 1, dimension: 'S1', style: '无厘头', text: '我是一只阴暗的老鼠，一只爬行的蟑螂，这辈子没谈过一场恋爱……求求大家给我们这种在被窝里偷窥的人一点活路吧',
    options: [{ label: '我哭了', level: 'L' }, { label: '这是什么', level: 'M' }, { label: '这不是我！', level: 'H' }] },
  { id: 2, dimension: 'S1', style: '正经', text: '我不够好，周围的人都比我优秀',
    options: [{ label: '确实', level: 'L' }, { label: '有时', level: 'M' }, { label: '不是', level: 'H' }] },
  { id: 3, dimension: 'A1', style: '正经', text: '我一定要不断往上爬、变得更厉害',
    options: [{ label: '不认同', level: 'L' }, { label: '中立', level: 'M' }, { label: '认同', level: 'H' }] },
  { id: 4, dimension: 'E1', style: '无厘头', text: '对象超过5小时没回消息，说自己窜稀了，你会怎么想？',
    options: [{ label: '拉稀不可能5小时，也许ta隐瞒了我', level: 'H' }, { label: '在信任和怀疑之间摇摆', level: 'M' }, { label: '也许今天ta真的不太舒服', level: 'L' }] },
  { id: 5, dimension: 'E2', style: '正经', text: '你的恋爱对象是一个尊老爱幼、温柔敦厚、玉树临风、风流倜傥（再堆砌十几个褒义成语）的人，此时你会？',
    options: [{ label: '就算ta再优秀我也不会陷入太深', level: 'L' }, { label: '介于A和C之间', level: 'M' }, { label: '会非常珍惜ta，也许会变成恋爱脑', level: 'H' }] },
  { id: 6, dimension: 'E3', style: '无厘头', text: '你走在街上，一位萌萌的小女孩递给你一根棒棒糖，你作何感想？',
    options: [{ label: '呜呜她真好真可爱', level: 'H' }, { label: '一脸懵逼作挠头状', level: 'M' }, { label: '这也许是一种新型诈骗？', level: 'L' }] },
  { id: 7, dimension: 'Ac2', style: '无厘头', text: '你因便秘坐在马桶上已长达30分钟，拉不出很难受。此时你更像',
    options: [{ label: '再坐三十分钟看看', level: 'L' }, { label: '用力拍打自己的屁股说"死屁股，快拉啊！"', level: 'H' }, { label: '使用开塞露', level: 'M' }] },
  { id: 8, dimension: 'S3', style: '元恶搞', text: '此题没有题目，请盲选',
    options: [{ label: '反复思考后感觉应该选A？', level: 'H' }, { label: '啊，要不选B？', level: 'M' }, { label: '不会就选C？', level: 'L' }] },
  { id: 9, dimension: 'Ac1', style: '正经', text: '别人说你"执行力强"，你内心更接近哪句？',
    options: [{ label: '我被逼到最后确实执行力超强。。。', level: 'L' }, { label: '啊，有时候吧', level: 'M' }, { label: '是的，事情本来就该被推进', level: 'H' }] },
  { id: 10, dimension: 'So1', style: '正经', text: '我和人相处主打一个电子围栏，靠太近会自动报警',
    options: [{ label: '认同', level: 'H' }, { label: '中立', level: 'M' }, { label: '不认同', level: 'L' }] },
  // —— 同风格补全（20 道）——
  { id: 11, dimension: 'S2', style: '正经', text: '在群里发了消息没人回，你的内心戏是',
    options: [{ label: '大家肯定在偷偷讨厌我', level: 'L' }, { label: '可能都在忙吧', level: 'M' }, { label: '已读不回是你们的损失', level: 'H' }] },
  { id: 12, dimension: 'S2', style: '无厘头', text: '你照镜子时，镜子里的你突然竖起了一个大拇指，你的第一反应是',
    options: [{ label: '它认错人了吧', level: 'L' }, { label: '愣住，然后回一个大拇指', level: 'M' }, { label: '当然，我值得', level: 'H' }] },
  { id: 13, dimension: 'E1', style: '正经', text: '朋友深夜发来一句"在吗"，你的第一反应是',
    options: [{ label: '出什么事了？！', level: 'H' }, { label: '看看情况再说', level: 'M' }, { label: '假装已经睡了', level: 'L' }] },
  { id: 14, dimension: 'E2', style: '无厘头', text: '喜欢的人给你发来一个"。"，你会',
    options: [{ label: '这已是爱情的尽头', level: 'L' }, { label: '一个句号而已，想啥呢', level: 'M' }, { label: '开始逐字分析并写出千字解读', level: 'H' }] },
  { id: 15, dimension: 'E3', style: '正经', text: '看悲剧电影时，你通常',
    options: [{ label: '毫无波澜，甚至想快进', level: 'L' }, { label: '眼眶微微湿润', level: 'M' }, { label: '哭到邻座给我递纸', level: 'H' }] },
  { id: 16, dimension: 'A1', style: '正经', text: '对于"卷"这件事，你的态度是',
    options: [{ label: '躺平也是一种人生智慧', level: 'L' }, { label: '偶尔卷一下，劳逸结合', level: 'M' }, { label: '不卷就会被卷死', level: 'H' }] },
  { id: 17, dimension: 'A2', style: '正经', text: '周一早上醒来，你的第一个念头是',
    options: [{ label: '毁灭吧，赶紧的', level: 'L' }, { label: '叹口气，起床', level: 'M' }, { label: '新的一天，冲了！', level: 'H' }] },
  { id: 18, dimension: 'A2', style: '无厘头', text: '买奶茶抽到"再来一杯"，店员却说活动昨天就结束了，你会想',
    options: [{ label: '果然，我的人生就是这样', level: 'L' }, { label: '哦，那算了', level: 'M' }, { label: '没事，好运攒着下次用', level: 'H' }] },
  { id: 19, dimension: 'A3', style: '正经', text: '出门旅行前，你的准备风格是',
    options: [{ label: '走到哪算哪，随缘', level: 'L' }, { label: '列个大概的清单', level: 'M' }, { label: '做精确到分钟的 Excel 攻略', level: 'H' }] },
  { id: 20, dimension: 'A3', style: '正经', text: '你的手机待办/备忘录通常',
    options: [{ label: '空的，全在脑子里（且经常忘）', level: 'L' }, { label: '只记重要的事', level: 'M' }, { label: '精确到几点喝水', level: 'H' }] },
  { id: 21, dimension: 'Ac1', style: '正经', text: '你收藏夹里"稍后再看"的视频数量大概是',
    options: [{ label: '上千，收藏等于学会', level: 'L' }, { label: '几十个吧', level: 'M' }, { label: '0，看完才会收藏', level: 'H' }] },
  { id: 22, dimension: 'Ac2', style: '无厘头', text: '距离 deadline 还有3小时，你的文档还是一片空白，你会',
    options: [{ label: '先发个朋友圈："今晚注定不眠"', level: 'L' }, { label: '泡杯咖啡开始肝', level: 'M' }, { label: '已经提前写完了，正在检查第三遍', level: 'H' }] },
  { id: 23, dimension: 'Ac3', style: '正经', text: '看到很喜欢但有点贵的东西，你会',
    options: [{ label: '加购物车放三个月再说', level: 'L' }, { label: '纠结一晚上', level: 'M' }, { label: '三秒内下单', level: 'H' }] },
  { id: 24, dimension: 'Ac3', style: '无厘头', text: '路边有一个写着"不要按"的红色按钮，你会',
    options: [{ label: '绕开走，保命要紧', level: 'L' }, { label: '拍照发群里问能不能按', level: 'M' }, { label: '已经按下去了', level: 'H' }] },
  { id: 25, dimension: 'So1', style: '无厘头', text: '电梯里只有你和一位不太熟的同事，你会',
    options: [{ label: '热情攀谈，从天气聊到人生', level: 'L' }, { label: '点头微笑，然后各自沉默', level: 'M' }, { label: '紧盯楼层数字，如老僧入定', level: 'H' }] },
  { id: 26, dimension: 'So2', style: '正经', text: '聚会时的你通常是',
    options: [{ label: '角落里的一盆绿植', level: 'L' }, { label: '小圈子里聊得还行', level: 'M' }, { label: '全场的气氛组组长', level: 'H' }] },
  { id: 27, dimension: 'So2', style: '无厘头', text: 'KTV 里轮到你点歌了，你会',
    options: [{ label: '把麦递给别人："你们唱"', level: 'L' }, { label: '点一首安静的歌混过去', level: 'M' }, { label: '已经站起来唱第三首了', level: 'H' }] },
  { id: 28, dimension: 'So3', style: '正经', text: '你的微信置顶通常是',
    options: [{ label: '文件传输助手', level: 'L' }, { label: '两三个好朋友', level: 'M' }, { label: '置不下，群太多了', level: 'H' }] },
  { id: 29, dimension: 'So3', style: '正经', text: '很久不联系的朋友突然找你，你会',
    options: [{ label: '警惕：不会是要借钱吧', level: 'L' }, { label: '正常聊聊近况', level: 'M' }, { label: '高兴！直接约饭！', level: 'H' }] },
  { id: 30, dimension: 'S3', style: '元恶搞', text: '做完这个测试，你准备',
    options: [{ label: '看个结果图一乐', level: 'L' }, { label: '顺便思考一下人生', level: 'M' }, { label: '逐题复盘自己为什么这么选', level: 'H' }] },
]

export const HOBBY_QUESTION: Question = {
  id: 31, dimension: null, style: '特殊', text: '您平时有什么爱好？',
  options: [
    { label: '吃喝拉撒', level: null },
    { label: '艺术爱好', level: null },
    { label: '饮酒', level: null },
    { label: '健身', level: null },
  ],
}

export const DRINK_QUESTION: Question = {
  id: 32, dimension: null, style: '特殊', text: '您对饮酒的态度是？',
  options: [
    { label: '小酌怡情', level: null },
    { label: '我习惯将白酒灌在保温杯当白开水喝，酒精令我信服', level: null },
  ],
}

export const OPTION_LETTERS = ['A', 'B', 'C', 'D']

// ─── 计分 ────────────────────────────────────────────────────────────────────

/** answers: { questionId -> optionIndex }。返回 15 维向量。 */
export function computeVector(answers: Record<number, number>): Level[] {
  const byDim: Record<string, Level[]> = {}
  for (const q of REGULAR_QUESTIONS) {
    const idx = answers[q.id]
    if (idx === undefined || !q.dimension) continue
    const level = q.options[idx].level
    if (!level) continue
    ;(byDim[q.dimension] ??= []).push(level)
  }
  return DIMENSIONS.map(d => {
    const ls = byDim[d] ?? []
    if (ls.length === 0) return 'M' as Level
    // 两题取众数，平票（一题一个样）取 M
    const allSame = ls.every(l => l === ls[0])
    return allSame ? ls[0] : ('M' as Level)
  })
}

function dimDistance(a: Level, b: Level): number {
  if (a === b) return 0
  if (a === 'M' || b === 'M') return 0.5
  return 1
}

export interface TestResult {
  personality: Personality
  vector: Level[]
  distance: number
  match: number // 0-100
  isDrunk: boolean
  isAllH: boolean
}

export function computeResult(answers: Record<number, number>): TestResult {
  const vector = computeVector(answers)
  const isDrunk = answers[HOBBY_QUESTION.id] === 2 && answers[DRINK_QUESTION.id] === 1
  const isAllH = vector.every(l => l === 'H')

  if (isDrunk) {
    return { personality: PERSONALITIES.find(p => p.code === 'DRUNK')!, vector, distance: 0, match: 100, isDrunk, isAllH: false }
  }

  let best = REGULAR_PERSONALITIES[0]
  let bestDist = Infinity
  for (const p of REGULAR_PERSONALITIES) {
    const d = p.signature.reduce((sum, s, i) => sum + dimDistance(vector[i], s), 0)
    if (d < bestDist) {
      bestDist = d
      best = p
    }
  }

  if (isAllH) {
    const hhhh = PERSONALITIES.find(p => p.code === 'HHHH')!
    return { personality: hhhh, vector, distance: bestDist, match: 100, isDrunk: false, isAllH }
  }

  const match = Math.round((1 - bestDist / 15) * 100)
  return { personality: best, vector, distance: bestDist, match, isDrunk: false, isAllH }
}

// ─── localStorage 排行榜 ─────────────────────────────────────────────────────

export interface SavedRecord {
  id: string
  nickname: string
  code: string
  name: string
  category: string
  match: number
  ts: number
}

const STORAGE_KEY = 'sbti-leaderboard-v1'

export function loadRecords(): SavedRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export function saveRecords(records: SavedRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export function addRecord(r: Omit<SavedRecord, 'id' | 'ts'>): SavedRecord[] {
  const records = loadRecords()
  records.push({ ...r, id: crypto.randomUUID(), ts: Date.now() })
  saveRecords(records)
  return records
}

export function deleteRecord(id: string): SavedRecord[] {
  const records = loadRecords().filter(r => r.id !== id)
  saveRecords(records)
  return records
}

export function clearRecords(): void {
  localStorage.removeItem(STORAGE_KEY)
}
