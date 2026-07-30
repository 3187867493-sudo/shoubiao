export const YINHE_API_BASE = "https://api.lk888.ai/api"
export const DEFAULT_ANALYSIS_MODEL = "gpt-5.6-terra"
export const DEFAULT_KNOWLEDGE_BASE_ID = "eer8g1tr73"

export const livingStructureProperties = [
  { id: "levels", name: "尺度层级", english: "Levels of Scale", principle: "从城市片区、街道、公共节点、建筑界面到铺装与构造细节形成连贯的大小层级。" },
  { id: "centers", name: "强中心", english: "Strong Centers", principle: "清晰的公共活动、交往或停留中心得到沿街界面、路径和次级节点共同支持。" },
  { id: "boundaries", name: "厚边界", english: "Thick Boundaries", principle: "边缘具有可停留、可使用、可感知的厚度，并强化两侧中心。" },
  { id: "repetition", name: "交替重复", english: "Alternating Repetition", principle: "相似元素以有差异的节奏交替出现，形成秩序而非机械复制。" },
  { id: "positive", name: "正空间", english: "Positive Space", principle: "空间自身具有完整、可理解、可使用的形状，而不是剩余缝隙。" },
  { id: "shape", name: "良好形状", english: "Good Shape", principle: "广场、街角、入口、步行区等局部形状清楚、紧凑，并支持真实城市活动。" },
  { id: "symmetry", name: "局部对称", english: "Local Symmetries", principle: "在入口、树阵、骑楼、座椅或停留节点建立自然平衡，不追求僵硬的城市轴线。" },
  { id: "interlock", name: "深度交织与模糊性", english: "Deep Interlock and Ambiguity", principle: "相邻区域彼此伸入、借景或共享边缘，使连接本身成为空间。" },
  { id: "contrast", name: "对比", english: "Contrast", principle: "明暗、软硬、新旧或开合差异帮助识别中心，同时服从整体。" },
  { id: "gradients", name: "渐变", english: "Gradients", principle: "尺度、光线、私密度或活动强度出现连续过渡。" },
  { id: "roughness", name: "粗糙性", english: "Roughness", principle: "允许材料、手作和长期使用产生适应性的非机械差异。" },
  { id: "echoes", name: "共鸣", english: "Echoes", principle: "相似比例、轮廓、材质或色泽在建筑、街道和细部之间呼应，形成场所记忆与地域线索。" },
  { id: "void", name: "虚空", english: "The Void", principle: "保留安静、未被占满的中心或停顿，让周围关系更加清晰。" },
  { id: "calm", name: "简洁与内在平静", english: "Simplicity and Inner Calm", principle: "减少无关竞争和多余表达，使整体自然、直接而安定。" },
  { id: "whole", name: "非分离性", english: "Not-Separateness", principle: "公共空间、建筑界面、行人、经营活动、自然与城市文脉相互连接，没有孤立或贴附感。" },
] as const

export type AnalysisInput = {
  mode: "home" | "walk"
  persona: string
  room: string
  walkScene: string
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
  actions: Array<{
    title: string
    rationale: string
    propertyIds: string[]
    phase: "第一阶段" | "第二阶段"
    impact: "高" | "中"
    share: number
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
  if (!input || typeof input !== "object") throw new AnalysisServiceError(400, "缺少城市观察简报")
  if (input.mode !== "walk") throw new AnalysisServiceError(400, "当前版本仅支持城市空间活力诊断")
  if (typeof input.mission !== "string" || input.mission.trim().length < 12 || input.mission.length > 600) {
    throw new AnalysisServiceError(400, "请用 12–600 个字描述真实需求")
  }
  if (!Array.isArray(input.priorities) || input.priorities.length > 6) throw new AnalysisServiceError(400, "优先需求格式无效")
  const image = typeof request.image === "string" && /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(request.image) ? request.image : null
  if (!image) throw new AnalysisServiceError(400, "请上传有效的城市实景照片（JPG、PNG 或 WebP）")
  if (image.length < 10_000) throw new AnalysisServiceError(400, "照片数据不完整，请重新选择原图上传")
  return { input: { ...input, mode: "walk" as const, mission: input.mission.trim(), hasImage: true }, image }
}

async function retrieveBailianGrounding(input: AnalysisInput, options: AnalysisOptions) {
  const knowledgeBaseId = options.knowledgeBaseId || DEFAULT_KNOWLEDGE_BASE_ID
  if (!options.bailianApiKey) {
    return { context: "", status: "configured-missing-key" as const, provider: "内置 Living Structure 理论语料" as const }
  }

  const prompt = `请从知识库中检索与以下城市空间活力诊断最相关的 Living Structure 理论证据，尤其是 Christopher Alexander 的 15 个属性。只返回简洁、可追溯的理论依据，不生成最终方案。\n任务：${input.mission}\n城市场景：${input.location}，${input.walkScene}`
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

  return `你是“栖构 Living City”的城市活力结构视觉评估引擎。当前产品只分析城市空间，不分析住宅室内，也不套用室内装修风格。你必须依据 Christopher Alexander 的 Living Structure 理论，分析街道、广场、骑楼、沿街立面、社区公共空间中的结构关系、公共活动与整体性，并给出可执行的城市微更新依据。

固定 15 属性及定义（名称、顺序不可修改）：
${localTheory}

${context}

评估规则：
1. properties 必须恰好 15 项，id 顺序必须是：${propertyOrder}。
2. 每项 score 和 target 为 0–1 小数；score 是当前状态，target 是完成本方案后的谨慎目标，target 不得低于 score，且不得高于 0.96。
3. 必须真正阅读上传的城市照片。先在 visible_elements 中列出至少 5 个图中实际可见的城市元素，例如建筑层数、骑楼柱廊、店铺开口、行道树、座椅、铺装、台阶、路缘、机动车、行人活动或遮阴。每一项 insight 都必须引用至少一个可见元素或它们之间的空间关系；禁止使用“可能存在”“根据简报推测”等逃避读图的表述，禁止分析住宅家具。
4. 总分由服务端对 15 项求和，不要把主观漂亮程度、昂贵材料或某种风格当成高分依据。
5. 只提出一套相互支持的改造方案。actions 恰好 4 项，分两个阶段，预算 share 合计 100。
6. 建议要具体到空间关系与可执行动作，避免“提升质感、优化体验”等空话。
7. 结构安全、承重、管线、消防、产权和正式价格不可由照片断言，必须进入 risks 和 decision_gate。
8. 控制输出长度：summary 80–140 字；每项 insight 25–60 字；每项 rationale 35–80 字；risks 恰好 3 项；decision_gate 恰好 4 项；visible_elements 5–10 项。所有中文文本合计不超过 1800 字。
9. 仅输出 JSON，不要 Markdown，不要在 JSON 前后解释。

用户简报：
${JSON.stringify(input)}

JSON 结构：
{
  "summary": "基于可见证据和使用需求的总体诊断，80–140字",
  "confidence": "高|中|低",
  "analysis_basis": "本次评分使用了哪些图片证据、需求与理论依据",
  "visible_elements": ["5–10个照片中真实可见的城市元素，使用具体名词与方位"],
  "properties": [
    { "id": "levels", "score": 0.62, "target": 0.82, "insight": "具体证据与判断" }
  ],
  "actions": [
    { "title": "具体动作", "rationale": "为什么这样做及其使用关系", "property_ids": ["centers", "boundaries"], "phase": "第一阶段", "impact": "高", "share": 25 }
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

  const rawActions = Array.isArray(raw.actions) ? raw.actions.slice(0, 4) : []
  if (rawActions.length !== 4) throw new AnalysisServiceError(502, "GPT-5.6 未返回完整的四项改造行动")
  const actions = rawActions.map((item: any, index) => {
    const ids = Array.isArray(item?.property_ids)
      ? item.property_ids.map(String).filter((id: string) => livingStructureProperties.some((property) => property.id === id)).slice(0, 3)
      : []
    return {
      title: cleanText(item?.title, `空间改造行动 ${index + 1}`, 80),
      rationale: cleanText(item?.rationale, "结合现场尺寸和使用者反馈后深化。", 360),
      propertyIds: ids.length ? ids : [livingStructureProperties[index % livingStructureProperties.length].id],
      phase: item?.phase === "第二阶段" ? "第二阶段" as const : "第一阶段" as const,
      impact: item?.impact === "中" ? "中" as const : "高" as const,
      share: clamp(Number(item?.share) || 25, 5, 70),
    }
  })
  const shareTotal = actions.reduce((sum, action) => sum + action.share, 0) || 100
  let assigned = 0
  actions.forEach((action, index) => {
    action.share = index === actions.length - 1 ? 100 - assigned : Math.round((action.share / shareTotal) * 100)
    assigned += action.share
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

  const visibleElements = (Array.isArray(raw.visible_elements) ? raw.visible_elements : [])
    .map((item) => cleanText(item, "", 100))
    .filter(Boolean)
    .slice(0, 10)
  if (visibleElements.length < 5) {
    throw new AnalysisServiceError(502, "模型未能从照片中识别出足够的城市元素，请换用清晰、完整的城市实景照片重试")
  }

  return {
    summary: cleanText(raw.summary, "已依据 Living Structure 的 15 个属性完成空间诊断。", 700),
    confidence: (["高", "中", "低"].includes(raw.confidence as string) ? raw.confidence : input.hasImage ? "中" : "低") as "高" | "中" | "低",
    analysisBasis: cleanText(raw.analysis_basis, input.hasImage ? "基于授权空间图像、使用需求与 Living Structure 15 属性。" : "基于使用需求和房型假设，尚待实景核验。", 420),
    visibleElements,
    properties,
    actions,
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
  if (image) userContent.push({ type: "image_url", image_url: { url: image, detail: "high" } })

  const upstream = await fetch(`${YINHE_API_BASE}/v1/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${options.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "你是严谨、可解释的 Living Structure 城市空间视觉评估器。必须读取用户照片，只分析城市空间，并严格按 JSON 契约输出。若无法读取图像，应明确报错，不得伪装成已完成视觉识别。" },
        { role: "user", content: userContent },
      ],
      temperature: 0.2,
      max_completion_tokens: 2400,
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

