import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react"
import {
  createAgentResultFromAnalysis,
  personas,
  priorities,
  propertyDefinitions,
  rooms,
  walkScenes,
  type AgentInput,
  type AgentResult,
  type BudgetId,
  type PersonaId,
  type PriorityId,
  type ProjectMode,
  type PropertyScore,
  type RoomId,
  type WalkSceneId,
} from "./agent"
import type { AnalysisPayload } from "../server/analysis"

type Tab = "studio" | "projects" | "properties" | "method"
type PlanVariant = "catalyst" | "balanced" | "living"
type IconName =
  | "home"
  | "projects"
  | "book"
  | "info"
  | "spark"
  | "solo"
  | "couple"
  | "family"
  | "senior"
  | "pet"
  | "shared"
  | "camera"
  | "check"
  | "arrow"
  | "clock"
  | "wallet"
  | "risk"
  | "download"
  | "refresh"
  | "layers"
  | "eye"
  | "close"
  | "shield"

const personaIcons: Record<PersonaId, IconName> = {
  solo: "solo",
  couple: "couple",
  family: "family",
  senior: "senior",
  pet: "pet",
  shared: "shared",
}

const runSteps = [
  "任务理解与路由",
  "城市地点与使用者建模",
  "实景照片视觉识别",
  "15 属性活力评估",
  "公共空间风险检查",
  "城市微更新编排",
  "预算与工期拆解",
  "交付包生成",
]

const defaultMission = "希望改善这里的步行、停留、遮阴与街道交流体验，保留场所原有文脉，避免把城市空间做成脱离日常生活的景观样板。"

const planVariants: Array<{ id: PlanVariant; name: string; subtitle: string; factor: number; focus: string; fit: string }> = [
  { id: "catalyst", name: "轻触媒介入", subtitle: "低成本、可逆、快速验证", factor: 0.45, focus: "优先使用座椅、遮阴、标识、微绿化和可移动设施，不改变永久结构", fit: "短期试点与社区共创" },
  { id: "balanced", name: "公共生活平衡", subtitle: "兼顾体验、维护与场所文脉", factor: 0.72, focus: "完整落实主要行动，并平衡步行、停留、经营、无障碍和日常维护", fit: "街区常规微更新" },
  { id: "living", name: "活力结构优先", subtitle: "系统强化十五项空间关系", factor: 1, focus: "在现场复核后系统加强尺度层级、中心、厚边界、正空间和非分离性", fit: "长期公共空间提升" },
]

function buildVisualizationPrompt(result: AgentResult, variant: PlanVariant) {
  const modeLabel = "urban public-space micro-renovation"
  const selectedVariant = planVariants.find((item) => item.id === variant) || planVariants[1]
  const actions = result.actions.map((action, index) => `${index + 1}. ${action.title}: ${action.rationale}`).join("\n")
  return `Edit the provided source photograph into one coherent, photorealistic ${modeLabel} proposal based strictly on the confirmed plan below.

PRESERVE: the original camera angle, perspective, street and facade geometry, buildings, columns, doors, windows, mature trees, surrounding context, local material character, and recognizable identity of the place. Do not move openings, erase heritage fabric, invent another city, or turn the scene into an interior. Keep all unchanged pixels and materials visually consistent where the plan does not require intervention.

CONFIRMED RENOVATION PLAN:
${actions}

SELECTED OPTION: ${selectedVariant.name}. ${selectedVariant.focus}. Intervention intensity: ${Math.round(selectedVariant.factor * 100)}%.

LIVING STRUCTURE INTENT: strengthen strong centers, boundaries, levels of scale, gradients, positive space, echoes, roughness, simplicity and not-separateness. The result should support walking, staying, local commerce, social contact, climate comfort and long-term maintenance. Use locally appropriate materials, realistic contact shadows and physically plausible daylight. Avoid generic plaza design, luxury staging, excessive decoration, glossy surfaces, blue-purple AI lighting, text, labels, watermarks, dramatic lens effects, and structural fantasy. Produce a high-quality urban design visualization of the exact same place after micro-renovation.`
}

async function fileToCompressedDataUrl(file: File, maxSide = 1280, quality = 0.78) {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("无法读取图片"))
    reader.onerror = () => reject(new Error("无法读取图片"))
    reader.readAsDataURL(file)
  })
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image()
    element.onload = () => resolve(element)
    element.onerror = () => reject(new Error("无法解析图片"))
    element.src = source
  })
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  const context = canvas.getContext("2d")
  if (!context) throw new Error("浏览器无法处理这张图片")
  context.fillStyle = "#f3f1e8"
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  const result = canvas.toDataURL("image/jpeg", quality)
  if (result.length > 2.8 * 1024 * 1024) return canvas.toDataURL("image/jpeg", 0.62)
  return result
}

type AnalysisTaskResponse = {
  task_id?: string
  status?: "pending" | "processing" | "complete" | "error"
  result?: AnalysisPayload
  error?: string
}

let sessionAiClientId = ""

function getAiClientId() {
  if (sessionAiClientId) return sessionAiClientId
  try {
    const saved = localStorage.getItem("qigou-ai-client-id")
    if (saved && /^[a-zA-Z0-9-]{16,80}$/.test(saved)) {
      sessionAiClientId = saved
      return saved
    }
    sessionAiClientId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem("qigou-ai-client-id", sessionAiClientId)
    return sessionAiClientId
  } catch {
    sessionAiClientId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
    return sessionAiClientId
  }
}

async function readJsonResponse(response: Response): Promise<AnalysisTaskResponse & Partial<AnalysisPayload>> {
  const text = await response.text()
  if (!text.trim()) return {}
  try {
    return JSON.parse(text) as AnalysisTaskResponse & Partial<AnalysisPayload>
  } catch {
    return { error: `AI 服务网关返回了非 JSON 响应（HTTP ${response.status}）` }
  }
}

function submissionError(response: Response, payload: AnalysisTaskResponse) {
  if (payload.error) return payload.error
  if (response.status === 413) return "照片数据超过公网提交限制，请换一张较小的图片后重试。"
  if (response.status === 429) return "当前设备或校园网络提交较频繁，请稍后再试。"
  if ([502, 503, 504].includes(response.status)) return "AI 服务暂时繁忙，请等待一分钟后重试。"
  return `GPT-5.6 城市照片分析任务提交失败（HTTP ${response.status}）`
}

async function waitForAnalysisTask(taskId: string) {
  for (let attempt = 0; attempt < 240; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, attempt < 3 ? 1500 : 3000))
    const response = await fetch(`/api/city/analysis-status?task_id=${encodeURIComponent(taskId)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
    const payload = await readJsonResponse(response)
    if (!response.ok && response.status !== 202) throw new Error(payload.error || "无法查询 GPT-5.6 分析进度")
    if (payload.status === "error") throw new Error(payload.error || "GPT-5.6 空间分析失败")
    if (payload.status === "complete" && payload.result) return payload.result
  }
  throw new Error("本次分析等待时间较长，请稍后重新运行。")
}

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="m3 11 9-7 9 7" /><path d="M5.5 10v10h13V10" /><path d="M9 20v-6h6v6" /></>,
    projects: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 9h8M8 13h8M8 17h5" /></>,
    book: <><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22z" /><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22z" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
    spark: <><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z" /><path d="m19 17 .7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7z" /></>,
    solo: <><circle cx="12" cy="7" r="3" /><path d="M6 20c.5-5 2.5-7 6-7s5.5 2 6 7" /></>,
    couple: <><circle cx="8" cy="8" r="2.5" /><circle cx="16" cy="8" r="2.5" /><path d="M3 20c.4-4.5 2-6.5 5-6.5 2 0 3.4.8 4 2.5.6-1.7 2-2.5 4-2.5 3 0 4.6 2 5 6.5" /></>,
    family: <><circle cx="7" cy="7" r="2.5" /><circle cx="17" cy="7" r="2.5" /><circle cx="12" cy="13" r="2" /><path d="M2.5 19c.4-4 2-6 4.5-6 1.4 0 2.5.5 3.2 1.4M21.5 19c-.4-4-2-6-4.5-6-1.4 0-2.5.5-3.2 1.4M8.5 21c.3-3.2 1.4-4.5 3.5-4.5s3.2 1.3 3.5 4.5" /></>,
    senior: <><circle cx="10" cy="6" r="2.5" /><path d="M10 9v6l-3 6M10 12l4 2 2 7M13 11l2-3M17 8v13" /></>,
    pet: <><circle cx="7" cy="8" r="2" /><circle cx="17" cy="8" r="2" /><circle cx="4.5" cy="13" r="1.8" /><circle cx="19.5" cy="13" r="1.8" /><path d="M7.5 19c0-3 2-5 4.5-5s4.5 2 4.5 5c0 2-1.5 3-4.5 3s-4.5-1-4.5-3Z" /></>,
    shared: <><rect x="3" y="5" width="8" height="14" rx="2" /><rect x="13" y="5" width="8" height="14" rx="2" /><path d="M7 12h.01M17 12h.01M11 9h2M11 15h2" /></>,
    camera: <><path d="M4 7h4l1.5-2h5L16 7h4v12H4z" /><circle cx="12" cy="13" r="4" /></>,
    check: <path d="m5 12 4 4 10-10" />,
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    wallet: <><path d="M4 6h14a2 2 0 0 1 2 2v10H4z" /><path d="M4 6V4h12v2M15 11h5v4h-5z" /></>,
    risk: <><path d="m12 3 9 17H3z" /><path d="M12 9v5M12 17h.01" /></>,
    download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M4 20h16" /></>,
    refresh: <><path d="M20 7V3h-4" /><path d="M20 3a9 9 0 1 0 1 10" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12" /><circle cx="12" cy="12" r="2.5" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6z" /><path d="m9 12 2 2 4-4" /></>,
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <i /><i /><i /><i /><i />
    </span>
  )
}

function TopNav({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  const items: Array<{ id: Tab; label: string; icon: IconName }> = [
    { id: "studio", label: "设计智能体", icon: "home" },
    { id: "projects", label: "我的方案", icon: "projects" },
    { id: "properties", label: "15 个属性", icon: "book" },
    { id: "method", label: "方法说明", icon: "info" },
  ]
  return (
    <header className="topbar">
      <button className="brand" onClick={() => onChange("studio")} aria-label="返回栖构首页">
        <BrandMark />
        <span><b>栖构</b><small>Living City</small></span>
      </button>
      <nav className="desktop-nav" aria-label="主要导航">
        {items.map((item) => (
          <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => onChange(item.id)}>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="lab-note"><span>Living Structure</span><b>×</b><span>AI</span></div>
      <nav className="mobile-nav" aria-label="移动端导航">
        {items.map((item) => (
          <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => onChange(item.id)}>
            <Icon name={item.icon} size={19} /><span>{item.label.replace("设计智能体", "设计").replace("我的方案", "方案").replace("15 个属性", "属性").replace("方法说明", "说明")}</span>
          </button>
        ))}
      </nav>
    </header>
  )
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow"><span>01</span> 为真实的城市生活诊断</p>
        <h1>看见一座城市<br /><em>正在发生的生命。</em></h1>
        <p className="hero-lead">上传街道、广场、骑楼、社区角落或公共空间的真实照片，城市活力智能体将依据 Christopher Alexander 的十五项属性识别可见结构、计算活力表现，并提出可追溯的微更新方案。</p>
        <div className="hero-facts">
          <div><strong>15</strong><span>项活力结构诊断</span></div>
          <div><strong>5</strong><span>类城市空间场景</span></div>
          <div><strong>AI</strong><span>真实照片视觉识别</span></div>
        </div>
      </div>
      <figure className="hero-visual">
        <img src="https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=86" alt="具有步行、停留和沿街活动的城市公共空间" />
        <figcaption>
          <span>空间观察 07</span>
          <b>城市中心不是一个地标，<br />而是一组彼此支持的公共生活。</b>
        </figcaption>
        <div className="hero-score"><strong>15</strong><span>项</span><small>规范属性索引</small></div>
      </figure>
    </section>
  )
}

function SectionLabel({ index, title, hint }: { index: string; title: string; hint?: string }) {
  return (
    <div className="section-label">
      <span>{index}</span>
      <div><h3>{title}</h3>{hint && <p>{hint}</p>}</div>
    </div>
  )
}

function BriefPanel({
  mode,
  setMode,
  persona,
  setPersona,
  room,
  setRoom,
  walkScene,
  setWalkScene,
  location,
  setLocation,
  budget,
  setBudget,
  selectedPriorities,
  togglePriority,
  mission,
  setMission,
  imageUrl,
  imageName,
  onImage,
  clearImage,
  imageAuthorized,
  setImageAuthorized,
  running,
  onRun,
  error,
}: {
  mode: ProjectMode
  setMode: (value: ProjectMode) => void
  persona: PersonaId
  setPersona: (value: PersonaId) => void
  room: RoomId
  setRoom: (value: RoomId) => void
  walkScene: WalkSceneId
  setWalkScene: (value: WalkSceneId) => void
  location: string
  setLocation: (value: string) => void
  budget: BudgetId
  setBudget: (value: BudgetId) => void
  selectedPriorities: PriorityId[]
  togglePriority: (value: PriorityId) => void
  mission: string
  setMission: (value: string) => void
  imageUrl: string | null
  imageName: string
  onImage: (event: ChangeEvent<HTMLInputElement>) => void
  clearImage: () => void
  imageAuthorized: boolean
  setImageAuthorized: (value: boolean) => void
  running: boolean
  onRun: () => void
  error: string
}) {
  return (
    <aside className="brief-panel" aria-label="城市活力诊断设置">
      <div className="brief-intro">
        <p className="eyebrow"><span>02</span> 建立城市观察简报</p>
        <h2>从一张真实照片，<br />看见场所关系。</h2>
        <p>地点、活动和可见证据共同决定尺度、中心、边界、动线与公共性。</p>
      </div>

      <>
        <section className="form-section">
          <SectionLabel index="A" title="城市观察地点" hint="填写城市、街区和具体路段" />
          <input className="location-input" value={location} onChange={(event) => setLocation(event.target.value)} maxLength={80} placeholder="例如：广州 · 恩宁路骑楼段" />
        </section>
        <section className="form-section">
          <SectionLabel index="B" title="城市空间类型" hint="帮助AI理解照片中的公共空间关系" />
          <div className="room-options walk-options">
            {walkScenes.map((item) => <button key={item.id} className={walkScene === item.id ? "selected" : ""} onClick={() => setWalkScene(item.id)}><b>{item.name}</b><small>{item.description}</small></button>)}
          </div>
        </section>
      </>

      <section className="form-section">
        <SectionLabel index="C" title="优先解决" hint="最多选择 4 项" />
        <div className="priority-options">
          {priorities.map((item) => <button key={item.id} className={selectedPriorities.includes(item.id) ? "selected" : ""} onClick={() => togglePriority(item.id)}>{selectedPriorities.includes(item.id) && <Icon name="check" size={13} />}{item.name}</button>)}
        </div>
      </section>

      <section className="form-section">
        <SectionLabel index="D" title="预算策略" />
        <div className="budget-options">
          {([
            ["lean", "克制更新", "先解决关键关系"],
            ["balanced", "平衡方案", "兼顾体验与耐用"],
            ["quality", "品质长期", "关注材料与细节"],
          ] as Array<[BudgetId, string, string]>).map(([id, label, hint]) => (
            <button key={id} className={budget === id ? "selected" : ""} onClick={() => setBudget(id)}><b>{label}</b><small>{hint}</small></button>
          ))}
        </div>
      </section>

      <section className="form-section">
        <SectionLabel index="E" title="城市观察与目标" hint="描述谁在使用、哪里冲突、希望改善什么" />
        <textarea value={mission} onChange={(event) => setMission(event.target.value)} maxLength={600} aria-label="描述城市空间问题" />
        <div className="char-count"><span>描述步行、停留、经营、交往和维护</span><span>{mission.length}/600</span></div>
      </section>

      <section className="form-section">
        <SectionLabel index="F" title="城市实景照片" hint="必需；AI将以照片中的可见证据进行诊断" />
        {imageUrl ? (
          <div className="image-preview">
            <img src={imageUrl} alt="用户上传的城市实景照片" />
            <div><b>{imageName}</b><span>图片已压缩并通过浏览器读取 · 等待AI识别</span></div>
            <button onClick={clearImage} aria-label="移除上传图片"><Icon name="close" size={17} /></button>
          </div>
        ) : (
          <label className="upload-box">
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onImage} />
            <span><Icon name="camera" size={23} /></span>
            <b>上传城市真实照片</b>
            <small>JPG、PNG 或 WebP · 支持街道、广场、建筑立面与社区空间</small>
          </label>
        )}
        {imageUrl && (
          <label className={`consent ${imageAuthorized ? "checked" : ""}`}>
            <input type="checkbox" checked={imageAuthorized} onChange={(event) => setImageAuthorized(event.target.checked)} />
            <span><Icon name={imageAuthorized ? "check" : "shield"} size={14} /></span>
            <p>我确认拥有该图片的使用权，并同意用于本次城市活力诊断。原图不会写入方案历史。</p>
          </label>
        )}
      </section>

      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="run-button" disabled={running} onClick={onRun}>
        <span><Icon name="spark" size={20} />{running ? "GPT-5.6 正在识别城市照片" : "识别照片并运行城市活力分析"}</span>
        <Icon name="arrow" size={20} />
      </button>
      <p className="run-note"><span />服务端真实模型 · 不自动执行采购或施工</p>
    </aside>
  )
}

function EmptyAgent({ mode, persona, walkScene, location }: { mode: ProjectMode; persona: PersonaId; walkScene: WalkSceneId; location: string }) {
  const selected = personas.find((item) => item.id === persona) ?? personas[0]
  const selectedWalkScene = walkScenes.find((item) => item.id === walkScene) ?? walkScenes[0]
  const objectName = mode === "walk" ? `${location || "城市漫步"}的${selectedWalkScene.name}` : `${selected.name}的家`
  return (
    <section className="agent-empty">
      <div className="agent-orbit" aria-hidden="true">
        <div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" />
        {Array.from({ length: 15 }).map((_, index) => <i key={index} style={{ "--i": index } as React.CSSProperties} />)}
        <strong>15</strong><span>properties</span>
      </div>
      <p className="eyebrow"><span>03</span> Aliveness home agent</p>
      <h2>准备理解<br /><em>{objectName}</em>。</h2>
      <p>智能体不会套用通用城市美化模板，而是依次完成城市图像识别、使用关系建模、Living Structure 检索、十五项诊断、多方案规划和风险门控。</p>
      <div className="empty-route">
        <div><span>01</span><b>理解生活</b><small>谁住在这里，如何使用</small></div>
        <div><span>02</span><b>诊断关系</b><small>15 项空间活力属性</small></div>
        <div><span>03</span><b>形成行动</b><small>方案、预算与复评</small></div>
      </div>
    </section>
  )
}

function RunningAgent({ activeStep }: { activeStep: number }) {
  const progress = Math.round(((activeStep + 1) / runSteps.length) * 100)
  return (
    <section className="running-agent" aria-live="polite">
      <div className="running-head">
        <div className="agent-pulse"><BrandMark /></div>
        <div><p>栖构智能体正在工作</p><h2>{runSteps[Math.min(activeStep, runSteps.length - 1)]}</h2></div>
        <strong>{progress}%</strong>
      </div>
      <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
      <div className="tool-trace">
        {runSteps.map((step, index) => {
          const status = index < activeStep ? "done" : index === activeStep ? "active" : "pending"
          return (
            <div key={step} className={`trace-row ${status}`}>
              <span>{status === "done" ? <Icon name="check" size={14} /> : String(index + 1).padStart(2, "0")}</span>
              <div><b>{step}</b><small>{status === "done" ? "已完成并写入执行证据" : status === "active" ? "正在调用对应工具…" : "等待上一步完成"}</small></div>
              <i />
            </div>
          )
        })}
      </div>
      <div className="privacy-strip"><Icon name="shield" size={17} /><p><b>真实模型 · 最小必要处理</b><span>图片经服务端临时发送给 GPT-5.6，只用于当前诊断，不进入本地方案历史。</span></p></div>
    </section>
  )
}

function ScoreDial({ value, target }: { value: number; target: number }) {
  const percent = Math.round((value / 15) * 100)
  return (
    <div className="score-dial" style={{ "--score": `${percent * 3.6}deg` } as React.CSSProperties}>
      <div><strong>{value.toFixed(1)}</strong><span>/15</span><small>活力结构评估</small></div>
      <p>目标 {target.toFixed(1)}</p>
    </div>
  )
}

function PropertyPanel({ properties, selected, onSelect }: { properties: PropertyScore[]; selected: PropertyScore | null; onSelect: (item: PropertyScore | null) => void }) {
  return (
    <section className="result-section property-section">
      <div className="result-section-head"><div><span>01</span><h3>15 项活力结构</h3></div><p>GPT-5.6 按固定理论逐项评估；每项 0–1 分，浅色部分是改造目标。</p></div>
      <div className="property-list">
        {properties.map((property) => (
          <button key={property.id} className={selected?.id === property.id ? "active" : ""} onClick={() => onSelect(selected?.id === property.id ? null : property)}>
            <span className="property-index">{String(property.index).padStart(2, "0")}</span>
            <span className="property-name"><b>{property.name}</b><small>{property.english}</small></span>
            <span className="property-bars"><i style={{ width: `${property.target * 100}%` }} /><b style={{ width: `${property.score * 100}%` }} /></span>
            <strong>{property.score.toFixed(2)}</strong>
          </button>
        ))}
      </div>
      {selected && (
        <div className="property-insight">
          <button onClick={() => onSelect(null)} aria-label="关闭属性说明"><Icon name="close" size={16} /></button>
          <span>{selected.group}</span><h4>{selected.name} <small>{selected.english}</small></h4><p>{selected.insight}</p>
          <div><b>当前 {selected.score.toFixed(2)}</b><Icon name="arrow" size={16} /><b>目标 {selected.target.toFixed(2)}</b></div>
        </div>
      )}
    </section>
  )
}

function RecommendationPlans({ result, selected, onSelect }: { result: AgentResult; selected: PlanVariant; onSelect: (value: PlanVariant) => void }) {
  return (
    <section className="result-section recommendation-section">
      <div className="result-section-head"><div><span>02</span><h3>三个推荐方向</h3></div><p>基于同一张真实照片和十五项诊断，按投入强度生成可比较的城市微更新方案。</p></div>
      <div className="recommendation-grid">
        {planVariants.map((plan, index) => {
          const target = Math.min(15, result.baseline + (result.target - result.baseline) * plan.factor)
          const budget = index === 0 ? "约为基准预算的 35–50%" : index === 1 ? result.budgetRange : "约为基准预算的 130–170%"
          return <button key={plan.id} className={selected === plan.id ? "selected" : ""} onClick={() => onSelect(plan.id)}>
            <header><span>方案 {String.fromCharCode(65 + index)}</span>{index === 1 && <em>推荐</em>}</header>
            <h4>{plan.name}</h4><small>{plan.subtitle}</small>
            <div className="option-score"><span><b>{target.toFixed(1)}</b>/15</span><i><b style={{ width: `${target / 15 * 100}%` }} /></i></div>
            <p>{plan.focus}</p><footer><span>{budget}</span><span>{plan.fit}</span></footer>
          </button>
        })}
      </div>
      <p className="recommendation-note">选择方案后，后续行动摘要与效果图生成会采用该强度；所有方案都需经过产权、消防、结构、管线和现场尺寸复核。</p>
    </section>
  )
}

type RenderState = {
  status: "idle" | "submitting" | "processing" | "complete" | "error"
  progress: number
  taskId?: string
  imageUrl?: string
  error?: string
}

function VisualizationWorkspace({ result, sourceImage, state, onGenerate, selectedPlan }: { result: AgentResult; sourceImage: string | null; state: RenderState; onGenerate: () => void; selectedPlan: PlanVariant }) {
  const [confirmed, setConfirmed] = useState(false)
  const [compare, setCompare] = useState(54)
  const isBusy = state.status === "submitting" || state.status === "processing"
  return (
    <section className="result-section visualize-section">
      <div className="result-section-head"><div><span>06</span><h3>AI 城市更新效果图</h3></div><p>当前选择：{planVariants.find((item) => item.id === selectedPlan)?.name}。AI会在原照片上保留场所身份并完成对应强度的微更新。</p></div>
      {!sourceImage ? (
        <div className="visual-empty"><span><Icon name="camera" size={24} /></span><div><h4>需要一张现状照片</h4><p>返回左侧上传空间实景图，再重新运行诊断；效果图会保留原有视角和主要结构。</p></div></div>
      ) : state.status === "complete" && state.imageUrl ? (
        <div className="comparison-workspace">
          <div className="comparison-frame" style={{ "--compare": `${compare}%` } as React.CSSProperties}>
            <img className="before-image" src={sourceImage} alt="改造前的空间" />
            <div className="after-clip"><img src={state.imageUrl} alt="AI 根据确认方案生成的改造后空间" /></div>
            <div className="compare-line"><span /></div>
            <span className="before-label">改造前</span><span className="after-label">方案后</span>
            <input type="range" min="8" max="92" value={compare} onChange={(event) => setCompare(Number(event.target.value))} aria-label="拖动查看改造前后对比" />
          </div>
          <div className="render-complete"><span><Icon name="check" size={15} /></span><div><b>改造效果图已生成</b><p>任务 {state.taskId} · 可拖动图片中的分界线比较前后状态</p></div><a href={state.imageUrl} target="_blank" rel="noreferrer">打开原图 <Icon name="arrow" size={15} /></a></div>
          <div className="reevaluation-strip"><div><small>视觉方案目标</small><strong>{result.target.toFixed(1)}<span>/15</span></strong></div><p>下一步可让使用者对效果图进行共评，再决定是否进入材料和施工深化。</p><button onClick={onGenerate}><Icon name="refresh" size={15} />重新生成</button></div>
        </div>
      ) : (
        <div className="generation-workspace">
          <div className="generation-preview"><img src={sourceImage} alt="即将用于 AI 改造的原始空间" /><span>输入图 · 保留原有结构和视角</span></div>
          <div className="generation-control">
            <p className="eyebrow"><span>Visualize</span> GPT Image 2 · 图生图</p>
            <h4>把这一套改造建议<br />变成可比较的空间图像。</h4>
            <div className="prompt-summary">{result.actions.map((action) => <span key={action.title}><Icon name="check" size={12} />{action.title}</span>)}</div>
            {isBusy ? <div className="render-progress"><div><span>{state.status === "submitting" ? "正在提交生成任务" : "正在生成改造图"}</span><strong>{state.progress}%</strong></div><i><b style={{ width: `${state.progress}%` }} /></i><p>通常需要 1–2 分钟。你可以继续查看方案，生成不会中断。</p></div> : <>
              <label className={`plan-confirm ${confirmed ? "checked" : ""}`}><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span><Icon name={confirmed ? "check" : "shield"} size={14} /></span><p>我确认采用上方这一套改造方案生成效果图，并理解它仍需现场与专业人员复核。</p></label>
              {state.status === "error" && <p className="render-error">{state.error || "效果图生成失败，请重试。"}</p>}
              <button className="generate-button" disabled={!confirmed} onClick={onGenerate}><Icon name="spark" size={18} />生成改造后图片<Icon name="arrow" size={18} /></button>
              <small className="cost-note">生成会调用一次图像模型；图片仅用于本次任务。</small>
            </>}
          </div>
        </div>
      )}
    </section>
  )
}

type AttentionPoint = { x: number; y: number }

function VisualAttentionFeedback({ image }: { image: string | null }) {
  const [points, setPoints] = useState<AttentionPoint[]>([
    { x: 31, y: 58 }, { x: 34, y: 56 }, { x: 33, y: 60 },
    { x: 67, y: 39 }, { x: 69, y: 41 }, { x: 52, y: 72 },
  ])
  const [showHeatmap, setShowHeatmap] = useState(true)
  const addPoint = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setPoints((current) => [...current, { x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 }].slice(-80))
  }
  const intensityAt = (point: AttentionPoint) => points.filter((other) => Math.hypot(other.x - point.x, other.y - point.y) < 9).length
  return (
    <section className="result-section attention-section">
      <div className="result-section-head"><div><span>07</span><h3>视觉客返 · VAS注意力热图</h3></div><p>邀请使用者点击第一眼最吸引视线的位置，不询问心情；点击聚合后，关注最少处为蓝色、最集中处为红色。</p></div>
      <div className="attention-layout">
        <button className="attention-canvas" onClick={addPoint} disabled={!image} aria-label="点击图片中最吸引视线的位置">
          {image ? <img src={image} alt="用于视觉注意力客返的城市更新方案" /> : <div className="attention-empty"><Icon name="eye" size={28}/><b>生成方案效果图后开始视觉客返</b></div>}
          {image && showHeatmap && <div className="heat-layer">{points.map((point, index) => <i key={`${point.x}-${point.y}-${index}`} className={intensityAt(point) >= 3 ? "heat-hot" : intensityAt(point) === 2 ? "heat-warm" : "heat-cool"} style={{ left: `${point.x}%`, top: `${point.y}%` }} />)}</div>}
          {image && <span className="attention-hint"><Icon name="eye" size={14}/> 点击最先吸引你视线的位置</span>}
        </button>
        <aside className="attention-panel">
          <p className="eyebrow"><span>3M VAS inspired</span> 群体注意力客返</p>
          <h4>哪里真正<br/>抓住了视线？</h4>
          <p>当前已记录 <b>{points.length}</b> 次注意力点击。重叠点击会逐步由蓝、绿、黄过渡为红色。</p>
          <div className="heat-legend"><i/><span>低关注</span><b/><span>高关注</span></div>
          <div className="attention-stats"><span><small>最高聚合</small><b>{Math.max(0, ...points.map(intensityAt))}次</b></span><span><small>反馈状态</small><b>{points.length >= 10 ? "可比较" : "收集中"}</b></span></div>
          <button onClick={() => setShowHeatmap(!showHeatmap)}><Icon name="eye" size={15}/>{showHeatmap ? "隐藏热图看原图" : "显示注意力热图"}</button>
          <button className="text-button" onClick={() => setPoints([])}>清空本轮客返</button>
          <small>说明：这是基于用户点击的视觉注意力反馈，不等同于医学眼动检测，也不是温度热成像。</small>
        </aside>
      </div>
    </section>
  )
}

function ResultView({ result, sourceImage, renderState, onGenerate, onReset, onExport, selectedPlan, onSelectPlan }: { result: AgentResult; sourceImage: string | null; renderState: RenderState; onGenerate: () => void; onReset: () => void; onExport: () => void; selectedPlan: PlanVariant; onSelectPlan: (value: PlanVariant) => void }) {
  const [selectedProperty, setSelectedProperty] = useState<PropertyScore | null>(null)
  const persona = personas.find((item) => item.id === result.input.persona) ?? personas[0]
  const room = rooms.find((item) => item.id === result.input.room) ?? rooms[0]
  const walkScene = walkScenes.find((item) => item.id === result.input.walkScene) ?? walkScenes[0]
  const isWalk = result.input.mode === "walk"
  return (
    <article className="agent-result">
      <header className="result-hero">
        <div className="result-title">
          <p className="eyebrow"><span>03</span> {result.analysis ? "GPT-5.6 分析完成" : "历史方案"} · {result.traceId}</p>
          <h2>{isWalk ? (result.input.location || "城市漫步发现") : persona.name}<br /><em>{isWalk ? walkScene.name : room.name}活力更新方案</em></h2>
          <p>{result.summary}</p>
          <div className="result-tags"><span>{result.budgetRange}</span><span>{result.deliveryCycle}</span><span>{result.analysis ? `${result.analysis.confidence}置信度 · ${result.analysis.mode === "multimodal" ? "图像分析" : "简报分析"}` : "规则生成"}</span>{result.analysis && <span>{result.analysis.knowledgeStatus === "retrieved" ? `百炼知识库 ${result.analysis.knowledgeBaseId} 已检索` : "15 属性规范语料 · 百炼待认证"}</span>}</div>
        </div>
        <ScoreDial value={result.baseline} target={result.target} />
      </header>

      {result.analysis && <section className="vision-evidence">
        <div><Icon name="eye" size={19} /><span><b>照片已被AI实际读取</b><small>{result.analysis.model} · 高细节视觉识别 · {result.analysis.confidence}置信度</small></span></div>
        <p>{result.analysis.basis}</p>
        <div className="visible-elements">{result.analysis.visibleElements.map((item) => <span key={item}>{item}</span>)}</div>
      </section>}

      <PropertyPanel properties={result.properties} selected={selectedProperty} onSelect={setSelectedProperty} />

      <RecommendationPlans result={result} selected={selectedPlan} onSelect={onSelectPlan} />

      <section className="result-section actions-section">
        <div className="result-section-head"><div><span>03</span><h3>分阶段城市干预</h3></div><p>以下行动会按照所选推荐方案的投入强度实施。</p></div>
        <div className="action-list">
          {result.actions.map((action, index) => (
            <article key={action.title}>
              <div className="action-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="action-main"><div><span>{action.phase}</span><span>{action.property}</span></div><h4>{action.title}</h4><p>{action.rationale}</p></div>
              <div className="action-meta"><b>{action.impact}影响</b><span>{action.share}% 预算</span></div>
            </article>
          ))}
        </div>
      </section>

      <div className="result-dual-grid">
        <section className="result-section budget-section">
          <div className="result-section-head compact"><div><span>03</span><h3>预算拆解</h3></div><Icon name="wallet" size={20} /></div>
          <div className="budget-summary"><div><small>前期预算区间</small><strong>{result.budgetRange}</strong></div><div><small>预计交付周期</small><strong>{result.deliveryCycle}</strong></div></div>
          <div className="budget-list">
            {result.budgetItems.map((item) => <div key={item.label}><span><b>{item.label}</b><small>{item.range}</small></span><strong>{item.share}%</strong></div>)}
          </div>
          <p className="fine-print">以上为概念阶段估算，不构成正式报价。</p>
        </section>

        <section className="result-section risk-section">
          <div className="result-section-head compact"><div><span>04</span><h3>风险与人工确认</h3></div><Icon name="risk" size={20} /></div>
          <div className="risk-list">
            {result.risks.map((item) => <article key={item.risk}><span className={`level level-${item.level}`}>{item.level}</span><div><b>{item.risk}</b><p>{item.mitigation}</p></div></article>)}
          </div>
          <div className="decision-gate"><b><Icon name="shield" size={16} />进入采购与施工前</b><div>{result.decisionGate.map((item) => <span key={item}><Icon name="check" size={12} />{item}</span>)}</div></div>
        </section>
      </div>

      <VisualizationWorkspace result={result} sourceImage={sourceImage} state={renderState} onGenerate={onGenerate} selectedPlan={selectedPlan} />

      <VisualAttentionFeedback image={renderState.status === "complete" ? renderState.imageUrl || null : sourceImage} />

      <section className="handoff-section">
        <div className="handoff-image"><img src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=84" alt="自然材料与柔和照明构成的空间参考" /><span>材料方向参考 · 非生成结果</span></div>
        <div className="handoff-copy"><p className="eyebrow"><span>06</span> 交付到实施工作台</p><h3>从效果图继续到<br />材料、尺寸与实施确认。</h3><p>当前交付包已包含 {result.deliverables.length} 项内容。下一阶段应在现场尺寸、使用者共识和真实报价确认后进行，不让 AI 越过人的决定。</p><div className="material-swatches"><i style={{ background: "#c7b396" }} /><i style={{ background: "#725e49" }} /><i style={{ background: "#879588" }} /><i style={{ background: "#ded9ce" }} /><span>自然木 · 亚麻 · 灰绿 · 暖白</span></div></div>
      </section>

      <details className="trace-details">
        <summary><span><Icon name="layers" size={18} /><b>查看完整执行轨迹与证据</b></span><small>{result.steps.length} tools · 服务端可追踪编排</small></summary>
        <div className="trace-details-body">
          <div className="trace-table">
            {result.steps.map((step, index) => <div key={step.id}><span><Icon name="check" size={13} /></span><b>{String(index + 1).padStart(2, "0")} · {step.name}</b><p>{step.summary}</p><small>{step.duration}</small><em>{step.evidence}</em></div>)}
          </div>
          <div className="evidence-list"><h4>证据来源</h4>{result.evidence.map((item) => <div key={item.name}><b>{item.name}</b><span>{item.type}</span><p>{item.usage}</p></div>)}</div>
        </div>
      </details>

      <footer className="result-actions">
        <div><span>方案编号</span><b>{result.traceId}</b></div>
        <button className="secondary-button" onClick={onReset}><Icon name="refresh" size={17} />修改简报</button>
        <button className="primary-button" onClick={onExport}><Icon name="download" size={17} />导出方案摘要</button>
      </footer>
    </article>
  )
}

function ProjectsPage({ projects, onOpen, onClear }: { projects: AgentResult[]; onOpen: (project: AgentResult) => void; onClear: () => void }) {
  return (
    <main className="page-shell subpage">
      <header className="subpage-head"><div><p className="eyebrow"><span>Archive</span> 城市诊断记录</p><h1>每一次城市观察，<br /><em>都可以被重新查看。</em></h1></div>{projects.length > 0 && <button className="text-button" onClick={onClear}>清空本地记录</button>}</header>
      {projects.length === 0 ? (
        <section className="projects-empty"><BrandMark /><h2>还没有生成方案</h2><p>完成一次智能体任务后，脱敏结果会保存在这个浏览器中；上传的原图不会进入历史。</p></section>
      ) : (
        <section className="project-grid">
          {projects.map((project, index) => {
            const persona = personas.find((item) => item.id === project.input.persona) ?? personas[0]
            const room = rooms.find((item) => item.id === project.input.room) ?? rooms[0]
            const walkScene = walkScenes.find((item) => item.id === project.input.walkScene) ?? walkScenes[0]
            const isWalk = project.input.mode === "walk"
            return <button key={`${project.traceId}-${index}`} onClick={() => onOpen(project)}><div className="project-top"><span style={{ background: isWalk ? "#657d75" : persona.accent }}><Icon name={isWalk ? "eye" : personaIcons[persona.id]} size={19} /></span><small>{new Date(project.createdAt).toLocaleDateString("zh-CN")}</small></div><h2>{isWalk ? (project.input.location || "城市漫步") : persona.name}<br />{isWalk ? walkScene.name : room.name}方案</h2><p>{project.input.mission}</p><div className="project-score"><strong>{project.baseline.toFixed(1)}</strong><Icon name="arrow" size={16} /><strong>{project.target.toFixed(1)}</strong><span>/15</span></div><footer><span>{project.budgetRange}</span><Icon name="arrow" size={18} /></footer></button>
          })}
        </section>
      )}
    </main>
  )
}

function PropertiesPage() {
  const groups = ["层级与中心", "边界与连接", "节奏与变化", "张力与平静"] as const
  const cityDescriptions: Record<string, string> = {
    levels: "从片区、街道、公共节点、建筑界面到铺装细节形成连续尺度。",
    centers: "公共生活由彼此支持的中心组成，并具有清晰而开放的主次。",
    boundaries: "骑楼、檐下、台阶和可坐边缘让边界具有公共厚度。",
    repetition: "柱列、树阵、开口和铺装以相似与差异形成城市节奏。",
    positive: "街道、广场和角落拥有完整可使用的形状，而非交通剩余地。",
    shape: "路径、入口和停留节点形状清楚，并支持真实城市活动。",
    symmetry: "在入口、树阵或停留点建立自然平衡，不追求僵硬轴线。",
    interlock: "建筑、街道与公共活动相互伸入，让连接处成为场所。",
    contrast: "新旧、明暗、开合差异帮助识别中心，同时服从整体。",
    gradients: "从快速通行到慢行停留、从开放到庇护形成连续变化。",
    roughness: "允许材料、时间、手作和地方使用留下适应性差异。",
    echoes: "地方比例、轮廓和材料在街道与建筑之间反复呼应。",
    void: "保留安静、未被设施占满的公共中心，让周围关系清晰。",
    calm: "减少无意义视觉竞争，让城市空间自然、直接而安定。",
    whole: "建筑、街道、行人、经营、自然和文脉不再彼此孤立。",
  }
  return (
    <main className="page-shell subpage properties-page">
      <header className="subpage-head"><div><p className="eyebrow"><span>15 Properties</span> Christopher Alexander</p><h1>判断城市空间，<br /><em>是否真正有生命。</em></h1><p>15 个属性不是风格或城市美化清单，而是观察建筑、街道、公共生活和场所整体关系的语言。</p></div><div className="fifteen-stamp"><strong>15</strong><span>每项 0–1 分<br />总分 15</span></div></header>
      <div className="property-groups">
        {groups.map((group, groupIndex) => <section key={group}><header><span>0{groupIndex + 1}</span><h2>{group}</h2></header><div>{propertyDefinitions.filter((item) => item.group === group).map((item) => <article key={item.id}><span>{String(item.index).padStart(2, "0")}</span><h3>{item.name}</h3><small>{item.english}</small><p>{cityDescriptions[item.id]}</p></article>)}</div></section>)}
      </div>
    </main>
  )
}

function MethodPage() {
  return (
    <main className="page-shell subpage method-page">
      <header className="subpage-head"><div><p className="eyebrow"><span>Method</span> 可解释的城市活力智能体</p><h1>AI 负责组织复杂度，<br /><em>城市中的人保留决定。</em></h1></div></header>
      <section className="method-flow">
        {[
          ["01", "读取真实城市照片", "先识别建筑、街道、边界、活动和可见矛盾，不从通用城市风格开始。"],
          ["02", "诊断空间关系", "以 15 个 Living Structure 属性评估中心、边界、尺度、渐变与整体性。"],
          ["03", "调用专业工具", "将方案拆成安全检查、空间规划、材料原则、预算估算和风险门控。"],
          ["04", "交还公共判断", "产权、消防、结构、采购、施工和维护责任必须经过使用者、属地与专业人员确认。"],
        ].map(([index, title, body]) => <article key={index}><span>{index}</span><h2>{title}</h2><p>{body}</p></article>)}
      </section>
      <section className="transparency-panel"><div><p className="eyebrow"><span>Principle</span> 智能体边界</p><h2>它能提出有依据的方向，<br />但不会假装看见照片之外的事实。</h2></div><ul><li><Icon name="check" size={15} />每次任务生成独立执行编号与工具轨迹</li><li><Icon name="check" size={15} />无实景图时明确标记为房型基线回退</li><li><Icon name="check" size={15} />预算只给前期区间，不冒充供应商报价</li><li><Icon name="check" size={15} />上传图片不进入本地方案历史</li></ul></section>
    </main>
  )
}

export default function App() {
  const [tab, setTab] = useState<Tab>("studio")
  const [mode, setMode] = useState<ProjectMode>("walk")
  const [persona, setPersona] = useState<PersonaId>("family")
  const [room, setRoom] = useState<RoomId>("living")
  const [walkScene, setWalkScene] = useState<WalkSceneId>("arcade")
  const [location, setLocation] = useState("永庆坊 · 恩宁路骑楼段")
  const [budget, setBudget] = useState<BudgetId>("balanced")
  const [selectedPriorities, setSelectedPriorities] = useState<PriorityId[]>(["light", "safety", "social"])
  const [mission, setMission] = useState(defaultMission)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageName, setImageName] = useState("")
  const [imageAuthorized, setImageAuthorized] = useState(false)
  const [running, setRunning] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [result, setResult] = useState<AgentResult | null>(null)
  const [error, setError] = useState("")
  const [projects, setProjects] = useState<AgentResult[]>([])
  const [renderState, setRenderState] = useState<RenderState>({ status: "idle", progress: 0 })
  const [selectedPlan, setSelectedPlan] = useState<PlanVariant>("balanced")
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("qigou-city-projects") || "[]")
      if (Array.isArray(saved)) setProjects(saved.filter((item) => item?.input?.mode === "walk").slice(0, 8))
    } catch {
      setProjects([])
    }
  }, [])

  useEffect(() => () => { if (imageUrl?.startsWith("blob:")) URL.revokeObjectURL(imageUrl) }, [imageUrl])

  const selectedPersona = useMemo(() => personas.find((item) => item.id === persona) ?? personas[0], [persona])

  const togglePriority = (value: PriorityId) => {
    setSelectedPriorities((current) => current.includes(value) ? current.filter((item) => item !== value) : current.length < 4 ? [...current, value] : current)
  }

  const onImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 12 * 1024 * 1024) {
      setError("图片请控制在 12 MB 以内。")
      return
    }
    try {
      const compressed = await fileToCompressedDataUrl(file)
      setImageUrl(compressed)
      setImageName(file.name)
      setImageAuthorized(false)
      setError("")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "无法读取这张图片，请换一张重试。")
    }
  }

  const clearImage = () => {
    if (imageUrl?.startsWith("blob:")) URL.revokeObjectURL(imageUrl)
    setImageUrl(null)
    setImageName("")
    setImageAuthorized(false)
  }

  const persistProject = (next: AgentResult) => {
    const updated = [next, ...projects.filter((item) => item.traceId !== next.traceId)].slice(0, 8)
    setProjects(updated)
    localStorage.setItem("qigou-city-projects", JSON.stringify(updated))
  }

  const runAgent = async () => {
    if (mission.trim().length < 12) {
      setError("请至少用 12 个字描述真实的城市空间问题与目标。")
      return
    }
    if (!imageUrl) {
      setError("请先上传一张城市空间的真实照片；本版本不再使用无图基线推测。")
      return
    }
    if (imageUrl && !imageAuthorized) {
      setError("请先确认城市实景照片的使用授权。")
      return
    }
    setError("")
    setResult(null)
    setRunning(true)
    setActiveStep(0)
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const input: AgentInput = { mode: "walk", persona, room, walkScene, location: location.trim(), budget, priorities: selectedPriorities, mission: mission.trim(), hasImage: true }
    let displayedStep = 0
    const stepTimer = window.setInterval(() => {
      displayedStep = Math.min(runSteps.length - 2, displayedStep + 1)
      setActiveStep(displayedStep)
    }, reduceMotion ? 500 : 1700)
    try {
      const taskId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
      let response: Response
      try {
        response = await fetch("/api/city/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Qigou-Client": getAiClientId() },
          body: JSON.stringify({ taskId, input, image: imageUrl }),
        })
      } catch {
        throw new Error("无法连接城市照片识别服务，请检查网络后重新提交。")
      }
      const initial = await readJsonResponse(response)
      if (!response.ok && response.status !== 202) throw new Error(submissionError(response, initial))
      const payload = initial.properties
        ? initial as AnalysisPayload
        : await waitForAnalysisTask(taskId)
      if (!payload.properties) throw new Error("GPT-5.6 未返回完整空间分析")
      setActiveStep(runSteps.length - 1)
      const next = createAgentResultFromAnalysis(input, payload)
      setRenderState({ status: "idle", progress: 0 })
      setSelectedPlan("balanced")
      setResult(next)
      persistProject(next)
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }), 80)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "GPT-5.6 空间分析失败，请重试。")
    } finally {
      window.clearInterval(stepTimer)
      setRunning(false)
    }
  }

  const openProject = (project: AgentResult) => {
    setMode("walk")
    setPersona(project.input.persona)
    setRoom(project.input.room)
    setWalkScene(project.input.walkScene || "arcade")
    setLocation(project.input.location || "")
    setBudget(project.input.budget)
    setSelectedPriorities(project.input.priorities)
    setMission(project.input.mission)
    clearImage()
    setResult(project)
    setRenderState({ status: "idle", progress: 0 })
    setTab("studio")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const resetResult = () => {
    setResult(null)
    setRenderState({ status: "idle", progress: 0 })
    setError("")
    window.setTimeout(() => document.querySelector(".brief-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
  }

  const exportResult = () => {
    if (!result) return
    const lines = [
      `栖构 Living City｜城市活力微更新方案`,
      `任务编号：${result.traceId}`,
      `对象：${result.input.location} · ${walkScenes.find((item) => item.id === result.input.walkScene)?.name}`,
      `当前评分：${result.baseline}/15｜目标：${result.target}/15`,
      `预算：${result.budgetRange}｜周期：${result.deliveryCycle}`,
      "",
      result.summary,
      "",
      "行动清单：",
      ...result.actions.map((item, index) => `${index + 1}. ${item.title}｜${item.property}\n   ${item.rationale}`),
      "",
      "进入采购与施工前必须确认：",
      ...result.decisionGate.map((item) => `- ${item}`),
    ]
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `城市活力方案-${result.traceId}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const generateVisualization = async () => {
    if (!result || !imageUrl) return
    setRenderState({ status: "submitting", progress: 3 })
    try {
      const response = await fetch("/api/city/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Qigou-Client": getAiClientId() },
        body: JSON.stringify({ prompt: buildVisualizationPrompt(result, selectedPlan), image: imageUrl, size: "1536x1024", quality: "medium" }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.task_id) throw new Error(payload.error || "无法提交图像生成任务")
      const taskId = String(payload.task_id)
      setRenderState({ status: "processing", progress: 8, taskId })
      for (let attempt = 0; attempt < 72; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 5000))
        const statusResponse = await fetch(`/api/city/status?task_id=${encodeURIComponent(taskId)}`)
        const status = await statusResponse.json()
        if (!statusResponse.ok) throw new Error(status.error || "无法读取图像生成进度")
        const reported = Number.parseInt(String(status.progress || "0"), 10)
        const progress = Number.isFinite(reported) && reported > 0 ? Math.min(96, reported) : Math.min(92, 10 + attempt * 3)
        if (status.is_final) {
          if (status.state === "success" && status.result_url) {
            setRenderState({ status: "complete", progress: 100, taskId, imageUrl: status.result_url })
            return
          }
          throw new Error(status.error || status.status || "图像生成任务未完成")
        }
        setRenderState({ status: "processing", progress, taskId })
      }
      throw new Error("图像生成等待超时，请稍后重试")
    } catch (caught) {
      setRenderState({ status: "error", progress: 0, error: caught instanceof Error ? caught.message : "图像生成失败" })
    }
  }

  return (
    <div className="app-shell">
      <TopNav tab={tab} onChange={setTab} />
      {tab === "studio" && (
        <main id="main-content" className="page-shell">
          <Hero />
          <div className="workspace" ref={resultRef}>
            <BriefPanel mode={mode} setMode={setMode} persona={persona} setPersona={setPersona} room={room} setRoom={setRoom} walkScene={walkScene} setWalkScene={setWalkScene} location={location} setLocation={setLocation} budget={budget} setBudget={setBudget} selectedPriorities={selectedPriorities} togglePriority={togglePriority} mission={mission} setMission={setMission} imageUrl={imageUrl} imageName={imageName} onImage={onImage} clearImage={clearImage} imageAuthorized={imageAuthorized} setImageAuthorized={setImageAuthorized} running={running} onRun={runAgent} error={error} />
            <div className="agent-stage">
              {running ? <RunningAgent activeStep={activeStep} /> : result ? <ResultView result={result} sourceImage={imageUrl} renderState={renderState} onGenerate={generateVisualization} onReset={resetResult} onExport={exportResult} selectedPlan={selectedPlan} onSelectPlan={(value) => { setSelectedPlan(value); setRenderState({ status: "idle", progress: 0 }) }} /> : <EmptyAgent mode={mode} persona={persona} walkScene={walkScene} location={location} />}
            </div>
          </div>
        </main>
      )}
      {tab === "projects" && <ProjectsPage projects={projects} onOpen={openProject} onClear={() => { setProjects([]); localStorage.removeItem("qigou-city-projects") }} />}
      {tab === "properties" && <PropertiesPage />}
      {tab === "method" && <MethodPage />}
      <footer className="site-footer"><div><BrandMark /><span><b>栖构 Living City</b><small>看见城市空间的生命结构</small></span></div><p>Living Structure + AI 城市活力诊断 · 概念原型</p><nav><button onClick={() => setTab("method")}>方法与边界</button><button onClick={() => setTab("properties")}>15 个属性</button></nav></footer>
    </div>
  )
}
