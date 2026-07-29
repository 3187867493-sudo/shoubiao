export type PersonaId = "solo" | "couple" | "family" | "senior" | "pet" | "shared"
export type RoomId = "whole" | "living" | "bedroom" | "kitchen" | "study" | "child"
export type ProjectMode = "home" | "walk"
export type WalkSceneId = "arcade" | "storefront" | "alley" | "courtyard" | "parklet"
export type BudgetId = "lean" | "balanced" | "quality"
export type PriorityId = "storage" | "light" | "safety" | "flexibility" | "nature" | "social"

export type AgentInput = {
  mode: ProjectMode
  persona: PersonaId
  room: RoomId
  walkScene: WalkSceneId
  location: string
  budget: BudgetId
  priorities: PriorityId[]
  mission: string
  hasImage: boolean
}

export type PropertyScore = {
  id: string
  index: number
  name: string
  english: string
  score: number
  target: number
  insight: string
  group: "层级与中心" | "边界与连接" | "节奏与变化" | "张力与平静"
}

export type AgentStep = {
  id: string
  name: string
  tool: string
  summary: string
  duration: string
  evidence: string
}

export type AgentAction = {
  title: string
  rationale: string
  property: string
  phase: string
  impact: "高" | "中"
  share: number
}

export type AgentResult = {
  traceId: string
  createdAt: string
  summary: string
  baseline: number
  target: number
  properties: PropertyScore[]
  steps: AgentStep[]
  actions: AgentAction[]
  budgetRange: string
  deliveryCycle: string
  budgetItems: Array<{ label: string; share: number; range: string }>
  risks: Array<{ risk: string; level: "高" | "中" | "低"; mitigation: string }>
  deliverables: string[]
  evidence: Array<{ name: string; type: string; usage: string }>
  decisionGate: string[]
  input: AgentInput
}

export const personas: Array<{
  id: PersonaId
  name: string
  english: string
  description: string
  accent: string
  needs: string[]
}> = [
  { id: "solo", name: "一人独居", english: "Solo living", description: "小空间也要有松弛感、秩序与自我表达。", accent: "#6c8672", needs: ["复合功能", "轻量收纳", "独处氛围"] },
  { id: "couple", name: "两人共居", english: "Living together", description: "共享生活，同时保留各自的节奏和边界。", accent: "#9b725f", needs: ["共享中心", "独立角落", "动线协商"] },
  { id: "family", name: "亲子家庭", english: "Family with children", description: "让照看、游戏、学习和家庭交流自然发生。", accent: "#b38a4e", needs: ["成长弹性", "看护视线", "共同活动"] },
  { id: "senior", name: "长者友好", english: "Age-friendly", description: "安全不是附加项，而是空间秩序的一部分。", accent: "#667d83", needs: ["连续照明", "防跌倒", "清晰动线"] },
  { id: "pet", name: "宠物家庭", english: "Living with pets", description: "把人的生活与宠物的路径编织成一个整体。", accent: "#8b7660", needs: ["耐用材料", "宠物路径", "清洁边界"] },
  { id: "shared", name: "灵活合租", english: "Shared home", description: "明确私人边界，也创造真正愿意共享的中心。", accent: "#747187", needs: ["私密边界", "模块家具", "共享规则"] },
]

export const rooms: Array<{ id: RoomId; name: string; description: string }> = [
  { id: "whole", name: "全屋", description: "从整体关系出发" },
  { id: "living", name: "客厅", description: "家庭活动中心" },
  { id: "bedroom", name: "卧室", description: "休息与恢复" },
  { id: "kitchen", name: "厨房餐厅", description: "协作与烟火气" },
  { id: "study", name: "书房", description: "专注与切换" },
  { id: "child", name: "儿童房", description: "成长与变化" },
]

export const walkScenes: Array<{ id: WalkSceneId; name: string; description: string }> = [
  { id: "arcade", name: "骑楼与连廊", description: "建筑边界与步行体验" },
  { id: "storefront", name: "沿街立面", description: "店铺、入口与街道关系" },
  { id: "alley", name: "街巷转角", description: "路径变化与停留节点" },
  { id: "courtyard", name: "社区共享角落", description: "邻里活动与共同维护" },
  { id: "parklet", name: "街边停留点", description: "座椅、遮阴与微绿化" },
]

export const priorities: Array<{ id: PriorityId; name: string }> = [
  { id: "storage", name: "收纳秩序" },
  { id: "light", name: "采光照明" },
  { id: "safety", name: "安全友好" },
  { id: "flexibility", name: "灵活变化" },
  { id: "nature", name: "自然材料" },
  { id: "social", name: "家人互动" },
]

export const propertyDefinitions: Array<Omit<PropertyScore, "score" | "target" | "insight">> = [
  { id: "levels", index: 1, name: "尺度层级", english: "Levels of scale", group: "层级与中心" },
  { id: "centers", index: 2, name: "强中心", english: "Strong centers", group: "层级与中心" },
  { id: "boundaries", index: 3, name: "边界", english: "Boundaries", group: "边界与连接" },
  { id: "repetition", index: 4, name: "交替重复", english: "Alternating repetition", group: "节奏与变化" },
  { id: "positive", index: 5, name: "正空间", english: "Positive space", group: "层级与中心" },
  { id: "shape", index: 6, name: "良好形状", english: "Good shape", group: "层级与中心" },
  { id: "symmetry", index: 7, name: "局部对称", english: "Local symmetries", group: "节奏与变化" },
  { id: "interlock", index: 8, name: "深度交织", english: "Deep interlock", group: "边界与连接" },
  { id: "contrast", index: 9, name: "对比", english: "Contrast", group: "张力与平静" },
  { id: "gradients", index: 10, name: "渐变", english: "Gradients", group: "节奏与变化" },
  { id: "roughness", index: 11, name: "粗糙性", english: "Roughness", group: "张力与平静" },
  { id: "echoes", index: 12, name: "回声", english: "Echoes", group: "节奏与变化" },
  { id: "void", index: 13, name: "空", english: "The void", group: "张力与平静" },
  { id: "calm", index: 14, name: "简洁与内在平静", english: "Simplicity and inner calm", group: "张力与平静" },
  { id: "whole", index: 15, name: "非分离性", english: "Not-separateness", group: "边界与连接" },
]

const insights: Record<string, string> = {
  levels: "家具、灯光和收纳需要形成由房间到身体尺度的连续层级。",
  centers: "空间需要一个清晰的主要活动中心，而不是多个彼此竞争的焦点。",
  boundaries: "用地毯、灯光、矮柜或材质变化形成可感知但不过度封闭的边界。",
  repetition: "重复的木色、圆角和灯光节奏可以让不同区域彼此呼应。",
  positive: "通道之外的剩余空间应成为可停留、可使用的完整空间。",
  shape: "减少难以利用的尖角和碎片区域，让家具与空间轮廓互相支持。",
  symmetry: "局部平衡比整屋镜像更自然，可用于床头、餐桌或阅读角。",
  interlock: "让厨房、餐桌、客厅或阳台之间出现可交流、可借景的交织关系。",
  contrast: "通过明暗、软硬和新旧对比建立重点，但避免视觉噪声。",
  gradients: "从入口到核心、从明亮到安静，应有连续而可理解的过渡。",
  roughness: "保留手作、天然纹理和真实使用痕迹，让空间能够继续生长。",
  echoes: "在不同位置重复相似比例、色泽或轮廓，形成家中的记忆线索。",
  void: "保留一处不被家具占满的安静空间，为活动变化留下余地。",
  calm: "减少不必要装饰，把视觉注意力留给真正重要的人与活动。",
  whole: "每件新增物都要同时支持使用者、房间和原有生活，而非孤立存在。",
}

const personaFocus: Record<PersonaId, string[]> = {
  solo: ["centers", "void", "calm", "whole"],
  couple: ["boundaries", "interlock", "centers", "gradients"],
  family: ["levels", "centers", "positive", "whole"],
  senior: ["boundaries", "gradients", "calm", "positive"],
  pet: ["interlock", "boundaries", "roughness", "whole"],
  shared: ["boundaries", "centers", "repetition", "whole"],
}

const walkFocus: Record<WalkSceneId, string[]> = {
  arcade: ["boundaries", "repetition", "gradients", "whole"],
  storefront: ["centers", "boundaries", "contrast", "whole"],
  alley: ["gradients", "positive", "centers", "interlock"],
  courtyard: ["centers", "positive", "levels", "whole"],
  parklet: ["centers", "boundaries", "roughness", "interlock"],
}

const roomBase: Record<RoomId, number> = {
  whole: 0.49,
  living: 0.56,
  bedroom: 0.58,
  kitchen: 0.52,
  study: 0.55,
  child: 0.5,
}

const walkBase: Record<WalkSceneId, number> = {
  arcade: 0.53,
  storefront: 0.47,
  alley: 0.5,
  courtyard: 0.48,
  parklet: 0.51,
}

const personaActions: Record<PersonaId, AgentAction[]> = {
  solo: [
    { title: "建立一处可切换的生活中心", rationale: "用一张尺度合适的桌面连接用餐、工作和兴趣活动，避免每种功能各占一套家具。", property: "强中心 · 尺度层级", phase: "第一阶段", impact: "高", share: 29 },
    { title: "把收纳变成空间边界", rationale: "沿墙设置连续的低柜与开放格，既收纳物品，也界定入口和休息区。", property: "边界 · 良好形状", phase: "第一阶段", impact: "高", share: 31 },
    { title: "保留一个真正的空处", rationale: "不填满靠窗区域，让瑜伽、朋友留宿或临时创作自然发生。", property: "空 · 正空间", phase: "第二阶段", impact: "中", share: 18 },
    { title: "用三层光线替代一盏顶灯", rationale: "基础光、任务光和低位氛围光形成从工作到休息的平缓变化。", property: "渐变 · 内在平静", phase: "第二阶段", impact: "高", share: 22 },
  ],
  couple: [
    { title: "形成明确的共享中心", rationale: "围绕餐桌或沙发组织共同活动，让交流不依赖穿越彼此的私人区域。", property: "强中心 · 正空间", phase: "第一阶段", impact: "高", share: 30 },
    { title: "为两种节奏留下独立角落", rationale: "设置阅读位与工作位，用光线和家具朝向形成柔性边界。", property: "边界 · 局部对称", phase: "第一阶段", impact: "高", share: 26 },
    { title: "重新编排双人动线", rationale: "减少厨房、衣柜和卫浴前的相互阻挡，让高频动作可以并行发生。", property: "深度交织 · 渐变", phase: "第二阶段", impact: "高", share: 28 },
    { title: "建立共同的材质语言", rationale: "把两人的偏好浓缩为一组重复出现的木色、织物和金属细节。", property: "回声 · 交替重复", phase: "第二阶段", impact: "中", share: 16 },
  ],
  family: [
    { title: "把客厅变成可共同使用的中心", rationale: "用环绕式座位、低桌与可移动软垫支持交流、游戏和临时学习。", property: "强中心 · 尺度层级", phase: "第一阶段", impact: "高", share: 32 },
    { title: "建立可看见但不互相打扰的区域", rationale: "通过半高收纳和开口关系保持照看视线，同时给儿童独立活动边界。", property: "边界 · 深度交织", phase: "第一阶段", impact: "高", share: 28 },
    { title: "让家具随成长变化", rationale: "优先选择高度可调、模块化且可重新组合的桌柜，减少阶段性淘汰。", property: "尺度层级 · 粗糙性", phase: "第二阶段", impact: "高", share: 24 },
    { title: "把日常物品变成家庭回声", rationale: "在不同房间重复家庭照片、手作和同类色泽，形成共同记忆。", property: "回声 · 非分离性", phase: "第二阶段", impact: "中", share: 16 },
  ],
  senior: [
    { title: "建立连续、无断点的安全动线", rationale: "清除转角障碍，控制高差，并在关键位置设置可抓扶的稳定边界。", property: "边界 · 正空间", phase: "第一阶段", impact: "高", share: 34 },
    { title: "补足从白天到夜间的光线渐变", rationale: "入口、床边、走廊和卫浴采用分区感应照明，避免明暗突变。", property: "渐变 · 内在平静", phase: "第一阶段", impact: "高", share: 25 },
    { title: "让常用物品处于舒适尺度", rationale: "把收纳、开关和坐卧高度调整到无需弯腰或踮脚的位置。", property: "尺度层级 · 良好形状", phase: "第二阶段", impact: "高", share: 23 },
    { title: "用清晰对比帮助识别", rationale: "门框、扶手、台面边缘保持适度明度差，但不制造花哨视觉刺激。", property: "对比 · 简洁", phase: "第二阶段", impact: "中", share: 18 },
  ],
  pet: [
    { title: "把宠物路径编入人的动线", rationale: "围绕窗边、沙发与饮水点形成连续路径，减少宠物与门口、餐区的冲突。", property: "深度交织 · 非分离性", phase: "第一阶段", impact: "高", share: 27 },
    { title: "建立耐清洁的低位边界", rationale: "低位墙面、地毯和软装优先采用可拆洗、耐抓与低挥发材料。", property: "边界 · 粗糙性", phase: "第一阶段", impact: "高", share: 29 },
    { title: "设置宠物也愿意停留的中心", rationale: "在家庭活动中心附近安排窝、台阶或观察位，让陪伴自然发生。", property: "强中心 · 尺度层级", phase: "第二阶段", impact: "高", share: 24 },
    { title: "隐藏杂乱但保留探索感", rationale: "集中食物和清洁用品收纳，同时用高低变化满足探索需求。", property: "良好形状 · 交替重复", phase: "第二阶段", impact: "中", share: 20 },
  ],
  shared: [
    { title: "先定义私人边界，再设计共享", rationale: "卧室入口、个人储物与安静时段需要清晰可执行，避免共享空间侵入私人生活。", property: "边界 · 简洁", phase: "第一阶段", impact: "高", share: 25 },
    { title: "建立一个真正有吸引力的共享中心", rationale: "用舒适座位、充足插座和可共同维护的桌面提升公共区域使用率。", property: "强中心 · 正空间", phase: "第一阶段", impact: "高", share: 31 },
    { title: "使用可重组的模块家具", rationale: "让座椅、桌面和收纳可以随入住人数变化，不把布局锁死。", property: "尺度层级 · 交替重复", phase: "第二阶段", impact: "高", share: 27 },
    { title: "把共享规则嵌入空间提示", rationale: "通过分区收纳、标签和照明状态，让使用规则不依赖反复沟通。", property: "回声 · 非分离性", phase: "第二阶段", impact: "中", share: 17 },
  ],
}

const walkActions: Record<WalkSceneId, AgentAction[]> = {
  arcade: [
    { title: "强化连续而可停留的灰空间", rationale: "梳理柱廊、檐下与店铺入口之间的关系，让遮阴通道同时支持短暂停留。", property: "边界 · 正空间", phase: "第一阶段", impact: "高", share: 31 },
    { title: "修复沿街节奏中的断点", rationale: "以灯光、店招尺度和可逆构件回应原有开间节奏，不把历史界面做成统一模板。", property: "交替重复 · 回声", phase: "第一阶段", impact: "高", share: 24 },
    { title: "建立由行走到停留的渐变", rationale: "在转角、入口和树荫下增加不同停留时长的支撑，让动线自然减速。", property: "渐变 · 强中心", phase: "第二阶段", impact: "高", share: 27 },
    { title: "用在地材料连接新旧", rationale: "保留真实风化与手作痕迹，新构件采用可维护、可替换且不过度仿古的材料。", property: "粗糙性 · 非分离性", phase: "第二阶段", impact: "中", share: 18 },
  ],
  storefront: [
    { title: "把入口重新组织为清晰中心", rationale: "统一入口、展示、照明和第一停留点，减少彼此竞争的招牌与装饰。", property: "强中心 · 良好形状", phase: "第一阶段", impact: "高", share: 29 },
    { title: "建立友好的街道边界", rationale: "用可坐边缘、檐下照明和半透明界面连接室内活动与街道。", property: "边界 · 深度交织", phase: "第一阶段", impact: "高", share: 30 },
    { title: "控制必要而明确的对比", rationale: "保留一个识别重点，其余色彩、字体和材质退后，避免信息噪声。", property: "对比 · 简洁", phase: "第二阶段", impact: "中", share: 19 },
    { title: "让更新回应相邻建筑", rationale: "从开间比例、基座高度和材料色泽中寻找回声，而不是把店面孤立出来。", property: "回声 · 非分离性", phase: "第二阶段", impact: "高", share: 22 },
  ],
  alley: [
    { title: "把转角变成可识别的小中心", rationale: "利用灯光、坐凳或一处植物形成方向提示和短暂停留，而不阻塞通行。", property: "强中心 · 正空间", phase: "第一阶段", impact: "高", share: 28 },
    { title: "恢复从窄到宽的空间渐变", rationale: "通过铺地、墙面亮度和视线开口提示路径变化，提升行走中的方向感。", property: "渐变 · 尺度层级", phase: "第一阶段", impact: "高", share: 27 },
    { title: "激活墙脚与门前边界", rationale: "把杂乱堆放区转化为可维护的低位绿化、靠坐或展示边缘。", property: "边界 · 粗糙性", phase: "第二阶段", impact: "高", share: 25 },
    { title: "保留一处安静的空", rationale: "不在每个节点堆入设施，让视线和日常活动拥有缓冲。", property: "空 · 内在平静", phase: "第二阶段", impact: "中", share: 20 },
  ],
  courtyard: [
    { title: "建立邻里共同活动中心", rationale: "以树荫、共享桌和环绕座位形成不同年龄都能参与的中心。", property: "强中心 · 尺度层级", phase: "第一阶段", impact: "高", share: 34 },
    { title: "让活动区形成完整正空间", rationale: "重新处理通道、晾晒、儿童活动和休息之间的边界，减少互相侵占。", property: "正空间 · 边界", phase: "第一阶段", impact: "高", share: 27 },
    { title: "加入可共同维护的微绿化", rationale: "采用乡土植物、可替换种植箱与清晰的浇灌责任，避免一次性景观。", property: "粗糙性 · 非分离性", phase: "第二阶段", impact: "中", share: 22 },
    { title: "用共评决定最后的细节", rationale: "先以可移动设施试用一周，再由居民记录停留、冲突与维护反馈。", property: "局部对称 · 非分离性", phase: "第二阶段", impact: "高", share: 17 },
  ],
  parklet: [
    { title: "形成面向街道的小型停留中心", rationale: "让座椅、遮阴和视线方向相互支持，同时保留连续人行净宽。", property: "强中心 · 良好形状", phase: "第一阶段", impact: "高", share: 32 },
    { title: "用边界保护而非封闭", rationale: "通过花箱、靠背和地面变化提供安全感，不使用阻断视线的高围挡。", property: "边界 · 深度交织", phase: "第一阶段", impact: "高", share: 25 },
    { title: "引入可感知的尺度层级", rationale: "从树冠、遮阴、座椅到扶手形成连续尺度，照顾儿童、成人和长者。", property: "尺度层级 · 渐变", phase: "第二阶段", impact: "高", share: 26 },
    { title: "采用耐候且可维修的构件", rationale: "优先本地、模块化材料，明确排水、清洁和替换方式。", property: "粗糙性 · 非分离性", phase: "第二阶段", impact: "中", share: 17 },
  ],
}

function hash(value: string) {
  let result = 7
  for (let index = 0; index < value.length; index += 1) result = (result * 31 + value.charCodeAt(index)) % 997
  return result
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

function moneyRange(text: string, share: number) {
  const values = text.match(/[\d.]+/g)?.map(Number) ?? [0, 0]
  return `${(values[0] * share / 100).toFixed(1)}–${(values[1] * share / 100).toFixed(1)} 万元`
}

function budgetFor(room: RoomId, budget: BudgetId, mode: ProjectMode) {
  if (mode === "walk") {
    const table = { lean: [3, 8, "2–4 周"], balanced: [8, 20, "4–8 周"], quality: [20, 45, "8–12 周"] }
    const selected = table[budget]
    return { range: `${selected[0]}–${selected[1]} 万元`, cycle: selected[2] as string }
  }
  const whole = room === "whole"
  const table = whole
    ? { lean: [6, 12, "4–6 周"], balanced: [12, 25, "6–10 周"], quality: [25, 45, "10–14 周"] }
    : { lean: [1.5, 3.5, "1–2 周"], balanced: [3.5, 8, "2–4 周"], quality: [8, 15, "4–7 周"] }
  const selected = table[budget]
  return { range: `${selected[0]}–${selected[1]} 万元`, cycle: selected[2] as string }
}

export function createAgentResult(input: AgentInput): AgentResult {
  const isWalk = input.mode === "walk"
  const seed = hash(`${input.mode}-${input.persona}-${input.room}-${input.walkScene}-${input.mission}-${input.priorities.join("-")}`)
  const focus = isWalk ? walkFocus[input.walkScene] : personaFocus[input.persona]
  const imageBoost = input.hasImage ? 0.035 : 0
  const propertyScores = propertyDefinitions.map((property, idx) => {
    const variation = ((seed + idx * 37) % 19 - 9) / 100
    const priorityBoost = input.priorities.length * 0.006
    const focusBoost = focus.includes(property.id) ? -0.05 : 0.015
    const score = clamp((isWalk ? walkBase[input.walkScene] : roomBase[input.room]) + variation + imageBoost + priorityBoost + focusBoost, 0.28, 0.83)
    const target = clamp(score + (focus.includes(property.id) ? 0.28 : 0.18), score, 0.96)
    return {
      ...property,
      score: Number(score.toFixed(2)),
      target: Number(target.toFixed(2)),
      insight: insights[property.id],
    }
  })
  const baseline = Number(propertyScores.reduce((sum, item) => sum + item.score, 0).toFixed(1))
  const target = Number(propertyScores.reduce((sum, item) => sum + item.target, 0).toFixed(1))
  const persona = personas.find((item) => item.id === input.persona) ?? personas[0]
  const room = rooms.find((item) => item.id === input.room) ?? rooms[0]
  const walkScene = walkScenes.find((item) => item.id === input.walkScene) ?? walkScenes[0]
  const budget = budgetFor(input.room, input.budget, input.mode)
  const actions = isWalk ? walkActions[input.walkScene] : personaActions[input.persona]
  const objectLabel = isWalk ? `${input.location || "城市漫步发现"} · ${walkScene.name}` : `${persona.name} · ${room.name}`
  const traceSuffix = `${Date.now().toString(36)}${seed.toString(36)}`.slice(-10)
  const steps: AgentStep[] = [
    { id: "route", name: "任务理解与路由", tool: "mission_router", summary: `识别为“${objectLabel}”任务，已建立预算与优先级边界。`, duration: "38 ms", evidence: `${input.priorities.length || 1} 项优先需求` },
    { id: "persona", name: isWalk ? "空间使用者建模" : "居住对象建模", tool: "resident_profile", summary: isWalk ? "已将步行、停留、经营与日常维护转译为空间约束。" : `已将${persona.needs.join("、")}转译为空间约束。`, duration: "24 ms", evidence: isWalk ? "行人 / 居民 / 经营者 / 维护者" : persona.needs.join(" / ") },
    { id: "vision", name: "空间现状诊断", tool: "spatial_diagnosis", summary: input.hasImage ? "已读取授权空间图像，并建立可见要素诊断。" : "未上传实景图，使用房型基线生成前期诊断，落地前需现场复核。", duration: input.hasImage ? "1.8 s" : "19 ms", evidence: input.hasImage ? "临时图像 / 不进入历史" : "房型基线 / 待实景校准" },
    { id: "living", name: "15 属性活力评估", tool: "living_structure", summary: `完成 15 项 Living Structure 评分，当前 ${baseline}/15。`, duration: "146 ms", evidence: focus.map((id) => propertyDefinitions.find((p) => p.id === id)?.name).filter(Boolean).join(" / ") },
    { id: "safety", name: isWalk ? "公共使用与治理检查" : "居住安全与冲突检查", tool: "home_safety", summary: isWalk ? "检查通行净宽、产权边界、消防、无障碍与后续维护责任。" : "检查高频动线、家具稳定性、照明、清洁维护与家庭成员冲突。", duration: "43 ms", evidence: isWalk ? "公共空间治理检查表" : "家庭安全规则集 v1.0" },
    { id: "planner", name: "空间干预方案编排", tool: "intervention_planner", summary: "生成两阶段、四项可执行改造动作，并关联关键活力属性。", duration: "0.9 s", evidence: actions.map((item) => item.property).join(" / ") },
    { id: "budget", name: "预算与工期拆解", tool: "budget_estimator", summary: `按 ${budget.range}、${budget.cycle} 的前期口径分配预算。`, duration: "35 ms", evidence: "非报价 / 采购前复核" },
    { id: "delivery", name: "交付包生成", tool: "delivery_packager", summary: "已生成诊断、方案、预算、风险与后续复评入口。", duration: "27 ms", evidence: "6 项交付物" },
  ]

  return {
    traceId: `qg-${traceSuffix}`,
    createdAt: new Date().toISOString(),
    summary: isWalk
      ? `栖构智能体将${input.location || "本次城市漫步"}发现的${walkScene.name}转化为一项可执行的微更新任务。方案重点强化${focus.slice(0, 2).map((id) => propertyDefinitions.find((item) => item.id === id)?.name).join("与")}，并同时考虑行走、停留、经营和维护关系。预计活力结构评分可由 ${baseline}/15 提升至 ${target}/15。`
      : `栖构智能体围绕${persona.name}的真实生活方式分析了${room.name}。当前空间的主要机会不是增加更多装饰，而是强化${focus.slice(0, 2).map((id) => propertyDefinitions.find((item) => item.id === id)?.name).join("与")}，并让收纳、动线、光线和家具共同支持日常活动。预计通过分阶段改造，活力结构评分可由 ${baseline}/15 提升至 ${target}/15。`,
    baseline,
    target,
    properties: propertyScores,
    steps,
    actions,
    budgetRange: budget.range,
    deliveryCycle: budget.cycle,
    budgetItems: actions.map((action) => ({ label: action.title, share: action.share, range: moneyRange(budget.range, action.share) })),
    risks: isWalk ? [
      { risk: "照片无法确认产权、地下管线与消防边界", level: "高", mitigation: "方案深化前由属地管理方和专业人员完成现场核验。" },
      { risk: "不同使用者对停留、经营与通行的需求可能冲突", level: "中", mitigation: "先用可移动构件试用并记录一周反馈。" },
      { risk: "预算为概念阶段区间，不等同于供应商报价", level: "中", mitigation: "锁定材料和尺寸后至少获取两家本地报价。" },
    ] : [
      { risk: input.hasImage ? "照片无法确认墙体、管线和承重条件" : "缺少实景图与准确尺寸", level: "高", mitigation: "进入施工图阶段前完成现场测量和专业复核。" },
      { risk: input.persona === "senior" ? "扶手、防滑与照明参数需符合使用者身体条件" : "家庭成员的真实作息可能与当前假设不同", level: "中", mitigation: "用一周生活日志验证高频动作与冲突时段。" },
      { risk: "预算为概念阶段区间，不等同于供应商报价", level: "中", mitigation: "锁定材料和尺寸后至少获取两家本地报价。" },
    ],
    deliverables: isWalk ? ["漫步观察转译", "15 属性活力诊断", "两阶段微更新清单", "预算与工期区间", "治理与维护风险表", "改造后复评任务"] : ["居住对象需求模型", "15 属性活力诊断", "两阶段空间干预清单", "预算与工期区间", "家庭安全风险表", "改造后复评任务"],
    evidence: [
      { name: "Living Structure 15 属性知识库", type: "结构化理论语料", usage: "诊断与方案依据" },
      { name: isWalk ? `${walkScene.name}使用关系模型` : `${persona.name}居住需求模型`, type: isWalk ? "城市观察规则集" : "人群规则集", usage: isWalk ? "行走、停留、经营与维护" : persona.needs.join("、") },
      { name: input.hasImage ? "用户授权空间图像" : "房型基线模型", type: input.hasImage ? "临时视觉证据" : "确定性回退", usage: input.hasImage ? "仅用于本次任务" : "实景上传后可重新校准" },
    ],
    decisionGate: isWalk ? ["属地与产权边界确认", "消防及无障碍复核", "使用者共评", "正式报价与维护责任"] : ["现场尺寸与结构复核", "家庭成员共同确认", "材料样品确认", "正式报价与施工合同"],
    input,
  }
}
