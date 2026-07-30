import type { AnalysisPayload } from "../server/analysis"

export type UrbanSceneId = "arcade" | "square" | "waterfront" | "alley" | "campus" | "transit"
export type BudgetId = "tactical" | "balanced" | "systemic"
export type PriorityId = "stay" | "walk" | "shade" | "wayfinding" | "inclusive" | "night" | "heritage" | "ecology"

export type AgentInput = {
  mode: "urban"
  scene: UrbanSceneId
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
  group: "层级与中心" | "边界与连接" | "节奏与变化" | "张力与平静"
  score: number
  target: number
  insight: string
}

export type UrbanAction = {
  title: string
  rationale: string
  propertyIds: string[]
  properties: string
}

export type UrbanScheme = {
  id: string
  title: string
  tagline: string
  concept: string
  propertyIds: string[]
  properties: string
  audience: string
  intensity: "微介入" | "协同更新" | "重点重塑"
  projectedScore: number
  actions: UrbanAction[]
}

export type AgentStep = {
  id: string
  name: string
  summary: string
  evidence: string
}

export type AgentResult = {
  traceId: string
  createdAt: string
  summary: string
  baseline: number
  target: number
  properties: PropertyScore[]
  schemes: UrbanScheme[]
  budgetRange: string
  deliveryCycle: string
  risks: AnalysisPayload["risks"]
  decisionGate: string[]
  evidence: Array<{ name: string; type: string; usage: string }>
  steps: AgentStep[]
  input: AgentInput
  analysis: {
    provider: "yinhe-ai"
    model: string
    mode: "multimodal" | "brief-only"
    confidence: "高" | "中" | "低"
    basis: string
    visibleElements: string[]
    knowledgeBaseId: string
    knowledgeStatus: "retrieved" | "configured-missing-key" | "retrieval-fallback"
    knowledgeProvider: string
  }
}

export const urbanScenes: Array<{ id: UrbanSceneId; name: string; note: string }> = [
  { id: "arcade", name: "骑楼与街道", note: "连续界面、灰空间与慢行" },
  { id: "square", name: "广场与节点", note: "停留中心、活动与边界" },
  { id: "waterfront", name: "滨水空间", note: "亲水层级、遮阴与安全" },
  { id: "alley", name: "街巷与转角", note: "方向、尺度与日常交往" },
  { id: "campus", name: "校园公共空间", note: "学习、交流与场所识别" },
  { id: "transit", name: "交通与入口", note: "换乘、等候与可达性" },
]

export const priorities: Array<{ id: PriorityId; name: string }> = [
  { id: "stay", name: "停留与交往" },
  { id: "walk", name: "步行连续性" },
  { id: "shade", name: "遮阴与热舒适" },
  { id: "wayfinding", name: "识别与导向" },
  { id: "inclusive", name: "全龄与无障碍" },
  { id: "night", name: "夜间安全" },
  { id: "heritage", name: "场所记忆" },
  { id: "ecology", name: "生态与雨洪" },
]

export const budgets: Array<{ id: BudgetId; name: string; note: string; range: string; cycle: string }> = [
  { id: "tactical", name: "轻量试点", note: "可移动、可撤回", range: "3–8 万元", cycle: "2–4 周" },
  { id: "balanced", name: "协同更新", note: "设施与空间织补", range: "8–20 万元", cycle: "4–8 周" },
  { id: "systemic", name: "系统改造", note: "多专业共同推进", range: "20–45 万元", cycle: "8–12 周" },
]

export const propertyDefinitions: Array<Omit<PropertyScore, "score" | "target" | "insight">> = [
  { id: "levels", index: 1, name: "尺度层级", english: "Levels of Scale", group: "层级与中心" },
  { id: "centers", index: 2, name: "强中心", english: "Strong Centers", group: "层级与中心" },
  { id: "boundaries", index: 3, name: "厚边界", english: "Thick Boundaries", group: "边界与连接" },
  { id: "repetition", index: 4, name: "交替重复", english: "Alternating Repetition", group: "节奏与变化" },
  { id: "positive", index: 5, name: "正空间", english: "Positive Space", group: "层级与中心" },
  { id: "shape", index: 6, name: "良好形状", english: "Good Shape", group: "层级与中心" },
  { id: "symmetry", index: 7, name: "局部对称", english: "Local Symmetries", group: "节奏与变化" },
  { id: "interlock", index: 8, name: "深度交织与模糊性", english: "Deep Interlock and Ambiguity", group: "边界与连接" },
  { id: "contrast", index: 9, name: "对比", english: "Contrast", group: "张力与平静" },
  { id: "gradients", index: 10, name: "渐变", english: "Gradients", group: "节奏与变化" },
  { id: "roughness", index: 11, name: "粗糙性", english: "Roughness", group: "张力与平静" },
  { id: "echoes", index: 12, name: "共鸣", english: "Echoes", group: "节奏与变化" },
  { id: "void", index: 13, name: "虚空", english: "The Void", group: "张力与平静" },
  { id: "calm", index: 14, name: "简洁与内在平静", english: "Simplicity and Inner Calm", group: "张力与平静" },
  { id: "whole", index: 15, name: "非分离性", english: "Not-Separateness", group: "边界与连接" },
]

export function createUrbanResult(input: AgentInput, analysis: AnalysisPayload): AgentResult {
  const definitions = new Map(propertyDefinitions.map((property) => [property.id, property]))
  const properties: PropertyScore[] = analysis.properties.map((property) => {
    const definition = definitions.get(property.id)
    if (!definition) throw new Error(`未知的活力结构属性：${property.id}`)
    return { ...definition, score: property.score, target: property.target, insight: property.insight }
  })
  const baseline = Number(properties.reduce((sum, property) => sum + property.score, 0).toFixed(1))
  const schemes: UrbanScheme[] = analysis.schemes.map((scheme) => ({
    ...scheme,
    properties: scheme.propertyIds.map((id) => definitions.get(id)?.name).filter(Boolean).join(" · "),
    actions: scheme.actions.map((action) => ({
      ...action,
      properties: action.propertyIds.map((id) => definitions.get(id)?.name).filter(Boolean).join(" · "),
    })),
  }))
  const target = Math.max(...schemes.map((scheme) => scheme.projectedScore), baseline)
  const budget = budgets.find((item) => item.id === input.budget) ?? budgets[1]
  const scene = urbanScenes.find((item) => item.id === input.scene) ?? urbanScenes[0]
  const knowledgeRetrieved = analysis.meta.knowledgeStatus === "retrieved"

  return {
    traceId: `ua-${Date.now().toString(36).slice(-8)}`,
    createdAt: new Date().toISOString(),
    summary: analysis.summary,
    baseline,
    target,
    properties,
    schemes,
    budgetRange: budget.range,
    deliveryCycle: budget.cycle,
    risks: analysis.risks,
    decisionGate: analysis.decisionGate,
    evidence: [
      { name: `GPT-5.6 · ${analysis.meta.model}`, type: input.hasImage ? "真实城市图像分析" : "场地简报分析", usage: analysis.analysisBasis },
      knowledgeRetrieved
        ? { name: `阿里云百炼 · ${analysis.meta.knowledgeBaseId}`, type: "实时 RAG 理论检索", usage: "Living Structure 理论依据" }
        : { name: "Living Structure 15 属性规范语料", type: "内置结构化理论", usage: `百炼知识库 ${analysis.meta.knowledgeBaseId} 待认证` },
      { name: input.hasImage ? "授权城市空间照片" : "城市空间任务简报", type: input.hasImage ? "临时视觉证据" : "无图前期依据", usage: input.hasImage ? "仅用于本次诊断，不写入方案历史" : "上传实景图后可重新评估" },
    ],
    steps: [
      { id: "observe", name: "读取城市现场", summary: input.hasImage ? "识别照片中的界面、路径、边缘、停留与环境线索。" : "依据场地简报建立待核验的空间假设。", evidence: analysis.visibleElements.join(" / ") || scene.name },
      { id: "diagnose", name: "15 属性活力诊断", summary: `逐项评估城市空间关系，当前活力 ${baseline}/15。`, evidence: properties.slice().sort((a, b) => a.score - b.score).slice(0, 3).map((item) => item.name).join(" / ") },
      { id: "diverge", name: "生成三套更新方向", summary: "从微介入、协同更新和重点重塑形成可比较的真实取舍。", evidence: schemes.map((item) => item.title).join(" / ") },
      { id: "visualize", name: "效果图与 3M VAS", summary: "选择方案生成改造图，再由公众标记三个视觉关注位置。", evidence: "GPT Image 2 / 3M VAS-inspired visual attention feedback" },
    ],
    input,
    analysis: {
      provider: "yinhe-ai",
      model: analysis.meta.model,
      mode: analysis.meta.mode,
      confidence: analysis.confidence,
      basis: analysis.analysisBasis,
      visibleElements: analysis.visibleElements,
      knowledgeBaseId: analysis.meta.knowledgeBaseId,
      knowledgeStatus: analysis.meta.knowledgeStatus,
      knowledgeProvider: analysis.meta.knowledgeProvider,
    },
  }
}
