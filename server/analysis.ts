export const YINHE_API_BASE = "https://api.lk888.ai/api"
export const DEFAULT_ANALYSIS_MODEL = "gpt-5.6-terra"
export const DEFAULT_KNOWLEDGE_BASE_ID = "eer8g1tr73"

export const livingStructureProperties = [
  { id: "levels", name: "尺度层级", english: "Levels of Scale", principle: "从城市片区、街道、活动节点、构筑物到身体尺度形成连续层级。" },
  { id: "centers", name: "强中心", english: "Strong Centers", principle: "一个清晰的主要活动中心得到周围次级中心共同支持。" },
  { id: "boundaries", name: "厚边界", english: "Thick Boundaries", principle: "边缘具有可停留、可使用、可感知的厚度，并强化两侧中心。" },
  { id: "repetition", name: "交替重复", english: "Alternating Repetition", principle: "相似元素以有差异的节奏交替出现，形成秩序而非机械复制。" },
  { id: "positive", name: "正空间", english: "Positive Space", principle: "空间自身具有完整、可理解、可使用的形状，而不是剩余缝隙。" },
  { id: "shape", name: "良好形状", english: "Good Shape", principle: "局部形状清楚、紧凑，并支持正在发生的真实活动。" },
  { id: "symmetry", name: "局部对称", english: "Local Symmetries", principle: "在入口、树下、座椅组或停留点建立自然平衡，不追求僵硬镜像。" },
  { id: "interlock", name: "深度交织与模糊性", english: "Deep Interlock and Ambiguity", principle: "相邻区域彼此伸入、借景或共享边缘，使连接本身成为空间。" },
  { id: "contrast", name: "对比", english: "Contrast", principle: "明暗、软硬、新旧或开合差异帮助识别中心，同时服从整体。" },
  { id: "gradients", name: "渐变", english: "Gradients", principle: "尺度、光线、私密度或活动强度出现连续过渡。" },
  { id: "roughness", name: "粗糙性", english: "Roughness", principle: "允许材料、手作和长期使用产生适应性的非机械差异。" },
  { id: "echoes", name: "共鸣", english: "Echoes", principle: "相似比例、轮廓、材质或色泽在不同位置呼应，延续场所记忆。" },
  { id: "void", name: "虚空", english: "The Void", principle: "保留安静、未被占满的中心或停顿，让周围关系更加清晰。" },
  { id: "calm", name: "简洁与内在平静", english: "Simplicity and Inner Calm", principle: "减少无关竞争和多余表达，使整体自然、直接而安定。" },
  { id: "whole", name: "非分离性", english: "Not-Separateness", principle: "空间、物件、使用者与环境相互连接，没有孤立或贴附感。" },
] as const

export type AnalysisInput = {
  mode: "urban"
  scene: string
  location: string
  budget: string
  priorities: string[]
  mission: string
  hasImage: boolean
}

export type AnalysisPayload = {
  summary: string
  confidence: "高" | "中" | "低"
  analysisBasis: string
  visibleElements: string[]
  properties: Array<{
    id: string
    score: number
    target: number
    insight: string
  }>
  schemes: Array<{
    id: string
    title: string
    tagline: string
    concept: string
    propertyIds: string[]
    audience: string
    intensity: "微介入" | "协同更新" | "重点重塑"
    projectedScore: number
    actions: Array<{
      title: string
      rationale: string
      propertyIds: string[]
    }>
  }>
  risks: Array<{ risk: string; level: "高" | "中" | "低"; mitigation: string }>
  decisionGate: string[]
  meta: {
    provider: "yinhe-ai"
    model: string
    mode: "multimodal" | "brief-only"
    knowledgeBaseId: string
    knowledgeStatus: "retrieved" | "configured-missing-key" | "retrieval-fallback"
    knowledgeProvider: "阿里云百炼" | "内置 Living Structure 理论语料"
    promptTokens?: number
    completionTokens?: number
  }
}

export class AnalysisServiceError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type AnalysisOptions = {
  apiKey: string
  model?: string
  bailianApiKey?: string
  knowledgeBaseId?: string
}

const localTheory = livingStructureProperties
  .map((property, index) => `${index + 1}. ${property.name} (${property.english})：${property.principle}`)
  .join("\n")

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

function cleanText(value: unknown, fallback: string, maxLength = 500) {
  const text = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : ""
  return (text || fallback).slice(0, maxLength)
}

function extractJson(value: unknown) {
  if (typeof value !== "string") throw new AnalysisServiceError(502, "GPT-5.6 未返回可解析的分析结果")
  const stripped = value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
  const start = stripped.indexOf("{")
  const end = stripped.lastIndexOf("}")
  if (start < 0 || end <= start) throw new AnalysisServiceError(502, "GPT-5.6 返回的结构化结果不完整")
  try {
    return JSON.parse(stripped.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    throw new AnalysisServiceError(502, "GPT-5.6 返回的 JSON 无法解析，请重试")
  }
}

async function safeJson(response: Response) {
  const text = await response.text()
  try {
    return JSON.parse(text) as Record<string, any>
  } catch {
    return { error: text.slice(0, 400) || `HTTP ${response.status}` }
  }
}

function validateRequest(body: unknown) {
  if (!body || typeof body !== "object") throw new AnalysisServiceError(400, "缺少空间分析请求")
  const request = body as { input?: AnalysisInput; image?: string | null }
  const input = request.input
  if (!input || typeof input !== "object") throw new AnalysisServiceError(400, "缺少城市空间诊断简报")
  if (input.mode !== "urban") throw new AnalysisServiceError(400, "当前版本仅支持城市公共空间诊断")
  if (typeof input.mission !== "string" || input.mission.trim().length < 12 || input.mission.length > 600) {
    throw new AnalysisServiceError(400, "请用 12–600 个字描述真实需求")
  }
  if (!Array.isArray(input.priorities) || input.priorities.length > 6) throw new AnalysisServiceError(400, "优先需求格式无效")
  const image = typeof request.image === "string" && request.image.startsWith("data:image/") ? request.image : null
  if (request.image && !image) throw new AnalysisServiceError(400, "空间图片格式无效")
  return { input: { ...input, mission: input.mission.trim(), hasImage: Boolean(image) }, image }
}

async function retrieveBailianGrounding(input: AnalysisInput, options: AnalysisOptions) {
  const knowledgeBaseId = options.knowledgeBaseId || DEFAULT_KNOWLEDGE_BASE_ID
  if (!options.bailianApiKey) {
    return { context: "", status: "configured-missing-key" as const, provider: "内置 Living Structure 理论语料" as const }
  }

  const prompt = `请从知识库中检索与以下城市公共空间微更新任务最相关的 Living Structure 理论证据，尤其是 Christopher Alexander 的 15 个属性。只返回简洁、可追溯的理论依据，不生成最终方案。\n任务：${input.mission}\n场景：${input.location}，${input.scene}`
  try {
    const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${options.bailianApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.BAILIAN_MODEL || "qwen-plus",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        tools: [{ type: "file_search", file_search: { vector_store_ids: [knowledgeBaseId] } }],
      }),
    })
    const payload = await safeJson(response)
    const content = payload?.choices?.[0]?.message?.content
    if (!response.ok || typeof content !== "string" || !content.trim()) {
      return { context: "", status: "retrieval-fallback" as const, provider: "内置 Living Structure 理论语料" as const }
    }
    return { context: content.trim().slice(0, 6000), status: "retrieved" as const, provider: "阿里云百炼" as const }
  } catch {
    return { context: "", status: "retrieval-fallback" as const, provider: "内置 Living Structure 理论语料" as const }
  }
}

function buildPrompt(input: AnalysisInput, knowledgeContext: string, hasImage: boolean) {
  const propertyOrder = livingStructureProperties.map((property) => property.id).join(", ")
  const context = knowledgeContext
    ? `以下是阿里云百炼知识库检索到的补充依据，请与固定 15 属性规范共同使用：\n${knowledgeContext}`
    : "当前未取得外部知识库检索结果，请严格使用下方内置的 Living Structure 结构化理论语料。"

  return `你是“栖构 Urban Aliveness”的城市公共空间评估与微更新引擎。产品不处理室内家居。你的任务不是判断流行审美，也不是套装修风格，而是依据 Christopher Alexander 的 Living Structure 理论，分析城市空间关系、公共活动与整体性，并给出三套方向明确、可以比较的城市干预方案。

固定 15 属性及定义（名称、顺序不可修改）：
${localTheory}

${context}

评估规则：
1. properties 必须恰好 15 项，id 顺序必须是：${propertyOrder}。
2. 每项 score 和 target 为 0–1 小数；score 是当前状态，target 是完成本方案后的谨慎目标，target 不得低于 score，且不得高于 0.96。
3. ${hasImage ? "必须真正阅读图片。每一项 insight 都要指出图中可见的建筑界面、开口、边缘、铺地、绿化、照明、路径、尺度、停留或空间关系；不要臆测画面外信息。" : "没有实景图，只能依据场地简报做低置信度前期判断；每项 insight 必须明确这是需要现场验证的假设。"}
4. 总分由服务端对 15 项求和，不要把主观漂亮程度、昂贵材料或某种风格当成高分依据。
5. schemes 必须恰好 3 套，形成真实取舍：微介入、协同更新、重点重塑各一套；不是同一方案换名字。
6. 每套方案恰好 3 个相互支持的动作，必须说明主要受益公众和对应的 15 属性；建议具体到放置、调整、保留、连接或试用动作，避免“提升质感、优化体验”等空话。
7. 结构安全、承重、管线、消防、产权和正式价格不可由照片断言，必须进入 risks 和 decision_gate。
8. 控制输出长度：summary 70–120 字；每项 insight 20–48 字；每套 concept 45–80 字；每项 rationale 25–55 字；risks 恰好 3 项；decision_gate 恰好 4 项；visible_elements 3–7 项。所有中文文本合计不超过 2400 字。
9. 仅输出 JSON，不要 Markdown，不要在 JSON 前后解释。

用户简报：
${JSON.stringify(input)}

JSON 结构：
{
  "summary": "基于可见证据和使用需求的总体诊断，80–140字",
  "confidence": "高|中|低",
  "analysis_basis": "本次评分使用了哪些图片证据、需求与理论依据",
  "visible_elements": ["3–8个图中可见元素；无图片时为空数组"],
  "properties": [
    { "id": "levels", "score": 0.62, "target": 0.82, "insight": "具体证据与判断" }
  ],
  "schemes": [
    {
      "id": "gentle",
      "title": "方案名称",
      "tagline": "一句话差异",
      "concept": "空间策略与取舍",
      "property_ids": ["centers", "boundaries", "gradients"],
      "audience": "主要受益公众",
      "intensity": "微介入|协同更新|重点重塑",
      "projected_score": 11.8,
      "actions": [
        { "title": "具体动作", "rationale": "为什么这样做及其公共使用关系", "property_ids": ["centers", "boundaries"] }
      ]
    }
  ],
  "risks": [
    { "risk": "不可由图片确认的事项", "level": "高|中|低", "mitigation": "人工复核方式" }
  ],
  "decision_gate": ["进入采购或施工前必须确认的事项"]
}`
}

function normalizeAnalysis(raw: Record<string, unknown>, input: AnalysisInput, meta: AnalysisPayload["meta"]): AnalysisPayload {
  const rawProperties = Array.isArray(raw.properties) ? raw.properties : []
  const byId = new Map(rawProperties.map((item: any) => [String(item?.id || ""), item]))
  const properties = livingStructureProperties.map((property) => {
    const source = byId.get(property.id) as any
    if (!source) throw new AnalysisServiceError(502, `GPT-5.6 缺少“${property.name}”评分`)
    const score = clamp(Number(source.score))
    if (!Number.isFinite(score)) throw new AnalysisServiceError(502, `“${property.name}”评分无效`)
    const target = clamp(Number(source.target))
    return {
      id: property.id,
      score: Number(score.toFixed(2)),
      target: Number(Math.max(score, Number.isFinite(target) ? target : score).toFixed(2)),
      insight: cleanText(source.insight, `${property.name}需要结合现场进一步核验。`, 360),
    }
  })

  const baseline = Number(properties.reduce((sum, property) => sum + property.score, 0).toFixed(1))
  const rawSchemes = Array.isArray(raw.schemes) ? raw.schemes.slice(0, 3) : []
  const schemeDefaults = [
    { id: "gentle", title: "轻触修复", tagline: "以最小动作恢复日常秩序", intensity: "微介入" as const, delta: 1.2 },
    { id: "shared", title: "共生织补", tagline: "让停留、通行与邻里活动彼此支持", intensity: "协同更新" as const, delta: 1.8 },
    { id: "structural", title: "活力重构", tagline: "重新组织中心、边界与公共关系", intensity: "重点重塑" as const, delta: 2.4 },
  ]
  const schemes = schemeDefaults.map((fallback, schemeIndex) => {
    const source = rawSchemes[schemeIndex] as any
    const propertyIds = Array.isArray(source?.property_ids)
      ? source.property_ids.map(String).filter((id: string) => livingStructureProperties.some((property) => property.id === id)).slice(0, 4)
      : []
    const safePropertyIds = propertyIds.length ? propertyIds : properties
      .slice()
      .sort((a, b) => a.score - b.score)
      .slice(schemeIndex, schemeIndex + 3)
      .map((property) => property.id)
    const rawActions = Array.isArray(source?.actions) ? source.actions.slice(0, 3) : []
    const actions = Array.from({ length: 3 }, (_, actionIndex) => {
      const item = rawActions[actionIndex] as any
      const ids = Array.isArray(item?.property_ids)
        ? item.property_ids.map(String).filter((id: string) => livingStructureProperties.some((property) => property.id === id)).slice(0, 3)
        : []
      return {
        title: cleanText(item?.title, `城市微更新动作 ${actionIndex + 1}`, 80),
        rationale: cleanText(item?.rationale, "结合现场使用、通行与维护条件进一步深化。", 260),
        propertyIds: ids.length ? ids : [safePropertyIds[actionIndex % safePropertyIds.length]],
      }
    })
    const proposedScore = Number(source?.projected_score)
    const projectedScore = Number(Math.min(14.5, Math.max(baseline, Number.isFinite(proposedScore) ? proposedScore : baseline + fallback.delta)).toFixed(1))
    return {
      id: cleanText(source?.id, fallback.id, 32).replace(/[^a-zA-Z0-9-]/g, "") || fallback.id,
      title: cleanText(source?.title, fallback.title, 48),
      tagline: cleanText(source?.tagline, fallback.tagline, 72),
      concept: cleanText(source?.concept, "从公共活动、空间关系与长期维护出发形成可试用、可调整的更新方向。", 220),
      propertyIds: safePropertyIds,
      audience: cleanText(source?.audience, "居民、访客与日常维护者", 80),
      intensity: (["微介入", "协同更新", "重点重塑"].includes(source?.intensity) ? source.intensity : fallback.intensity) as "微介入" | "协同更新" | "重点重塑",
      projectedScore,
      actions,
    }
  })

  const risks = (Array.isArray(raw.risks) ? raw.risks : []).slice(0, 4).map((item: any) => ({
    risk: cleanText(item?.risk, "现场条件尚未复核", 180),
    level: (["高", "中", "低"].includes(item?.level) ? item.level : "中") as "高" | "中" | "低",
    mitigation: cleanText(item?.mitigation, "由专业人员现场核验后再进入实施。", 220),
  }))
  if (risks.length < 2) throw new AnalysisServiceError(502, "GPT-5.6 返回的风险说明不完整")

  const decisionGate = (Array.isArray(raw.decision_gate) ? raw.decision_gate : [])
    .map((item) => cleanText(item, "", 100))
    .filter(Boolean)
    .slice(0, 6)
  if (decisionGate.length < 2) decisionGate.push("现场尺寸与结构复核", "正式报价与施工责任确认")

  return {
    summary: cleanText(raw.summary, "已依据 Living Structure 的 15 个属性完成空间诊断。", 700),
    confidence: (["高", "中", "低"].includes(raw.confidence as string) ? raw.confidence : input.hasImage ? "中" : "低") as "高" | "中" | "低",
    analysisBasis: cleanText(raw.analysis_basis, input.hasImage ? "基于授权城市空间图像、场地简报与 Living Structure 15 属性。" : "基于场地简报与城市空间假设，尚待实景核验。", 420),
    visibleElements: (Array.isArray(raw.visible_elements) ? raw.visible_elements : []).map((item) => cleanText(item, "", 80)).filter(Boolean).slice(0, 8),
    properties,
    schemes,
    risks,
    decisionGate,
    meta,
  }
}

export async function analyzeRenovation(body: unknown, options: AnalysisOptions): Promise<AnalysisPayload> {
  if (!options.apiKey) throw new AnalysisServiceError(503, "GPT-5.6 分析服务尚未配置")
  const { input, image } = validateRequest(body)
  const knowledgeBaseId = options.knowledgeBaseId || DEFAULT_KNOWLEDGE_BASE_ID

  const balanceResponse = await fetch(`${YINHE_API_BASE}/v1/skills/balance`, {
    headers: { Authorization: `Bearer ${options.apiKey}` },
  })
  const balance = await safeJson(balanceResponse)
  if (!balanceResponse.ok) throw new AnalysisServiceError(balanceResponse.status, cleanText(balance.error || balance.detail, "无法检查 GPT-5.6 额度"))
  if (Number(balance.balance || 0) <= 0) throw new AnalysisServiceError(402, "GPT-5.6 算力余额不足")

  const grounding = await retrieveBailianGrounding(input, { ...options, knowledgeBaseId })
  const model = options.model || DEFAULT_ANALYSIS_MODEL
  const userContent: Array<Record<string, unknown>> = [{ type: "text", text: buildPrompt(input, grounding.context, Boolean(image)) }]
  if (image) userContent.push({ type: "image_url", image_url: { url: image } })

  const upstream = await fetch(`${YINHE_API_BASE}/v1/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${options.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "你是严谨、可解释的 Living Structure 空间评估器。严格遵守用户提供的 JSON 契约，只根据可见证据和明确简报判断。" },
        { role: "user", content: userContent },
      ],
      temperature: 0.2,
      max_completion_tokens: 3600,
      response_format: { type: "json_object" },
    }),
  })
  const response = await safeJson(upstream)
  if (!upstream.ok) {
    throw new AnalysisServiceError(upstream.status || 502, cleanText(response.error?.message || response.error || response.detail || response.message, "GPT-5.6 空间分析失败"))
  }
  const content = response?.choices?.[0]?.message?.content
  const raw = extractJson(content)
  return normalizeAnalysis(raw, input, {
    provider: "yinhe-ai",
    model: String(response.model || model),
    mode: image ? "multimodal" : "brief-only",
    knowledgeBaseId,
    knowledgeStatus: grounding.status,
    knowledgeProvider: grounding.provider,
    promptTokens: Number(response?.usage?.prompt_tokens) || undefined,
    completionTokens: Number(response?.usage?.completion_tokens) || undefined,
  })
}
