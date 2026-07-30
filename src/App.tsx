import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type MouseEvent, type ReactNode } from "react"
import {
  budgets,
  createUrbanResult,
  priorities,
  propertyDefinitions,
  urbanScenes,
  type AgentInput,
  type AgentResult,
  type BudgetId,
  type PriorityId,
  type PropertyScore,
  type UrbanSceneId,
  type UrbanScheme,
} from "./agent"
import type { AnalysisPayload } from "../server/analysis"

type Tab = "diagnose" | "projects" | "properties" | "vas" | "method"
type IconName = "city" | "archive" | "grid" | "heat" | "info" | "camera" | "spark" | "arrow" | "check" | "close" | "pin" | "layers" | "refresh" | "download" | "eye" | "clock"

const runSteps = ["读取城市现场", "识别公共活动与空间关系", "评估 15 项活力属性", "生成三套更新方向", "校验治理风险与实施边界", "整理诊断结果"]
const defaultMission = "希望这里形成清晰而舒适的公共中心，让行走、停留和交流彼此支持，同时延续场所原有的尺度、材料与日常生活。"

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    city: <><path d="M3 21V9l6-3v15M9 21V4l6 3v14M15 21v-9l6-3v12M2 21h20" /><path d="M6 11h.01M6 15h.01M12 9h.01M12 13h.01M12 17h.01M18 14h.01M18 18h.01" /></>,
    archive: <><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M8 3h8M8 10h8M8 14h5" /></>,
    grid: <><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></>,
    heat: <><path d="M5 16c2-3 3-4 3-8 3 2 4 4 4 7 2-2 3-4 3-7 3 3 5 6 4 9a7 7 0 0 1-13 1" /><path d="M9 20c0-2 1-3 3-5 2 2 3 3 3 5" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
    camera: <><path d="M4 8h4l1.5-2h5L16 8h4v11H4z" /><circle cx="12" cy="13.5" r="3.5" /></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="m19 17 .7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7z" /></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    check: <path d="m5 12 4 4 10-10" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5" /></>,
    refresh: <><path d="M20 7V3h-4" /><path d="M20 3a9 9 0 1 0 1 10" /></>,
    download: <><path d="M12 3v12M7 10l5 5 5-5M4 20h16" /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12" /><circle cx="12" cy="12" r="2.5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
}

function TopNav({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  const items: Array<{ id: Tab; label: string; icon: IconName }> = [
    { id: "diagnose", label: "城市诊断", icon: "city" },
    { id: "projects", label: "方案记录", icon: "archive" },
    { id: "properties", label: "15 属性", icon: "grid" },
    { id: "vas", label: "视觉热图", icon: "heat" },
    { id: "method", label: "方法", icon: "info" },
  ]
  return <div className="nav-wrap"><header className="floating-nav liquid-glass">
    <button className="brand" onClick={() => onChange("diagnose")} aria-label="回到城市诊断首页"><BrandMark /><span><b>栖构</b><small>Urban Aliveness</small></span></button>
    <nav className="desktop-nav" aria-label="主要导航">{items.map((item) => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => onChange(item.id)}>{item.label}</button>)}</nav>
    <span className="model-chip"><i />Living Structure × AI</span>
  </header><nav className="mobile-nav" aria-label="移动端导航">{items.slice(0, 4).map((item) => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => onChange(item.id)}><Icon name={item.icon} size={18} /><span>{item.label}</span></button>)}</nav></div>
}

async function fileToCompressedDataUrl(file: File, maxSide = 1280, quality = 0.82) {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("无法读取照片"))
    reader.onerror = () => reject(new Error("无法读取照片"))
    reader.readAsDataURL(file)
  })
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image()
    element.onload = () => resolve(element)
    element.onerror = () => reject(new Error("无法解析照片"))
    element.src = source
  })
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  const context = canvas.getContext("2d")
  if (!context) throw new Error("浏览器无法处理这张照片")
  context.fillStyle = "#edf4ef"
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL("image/jpeg", quality)
}

type AnalysisTaskResponse = { task_id?: string; status?: "pending" | "processing" | "complete" | "error"; result?: AnalysisPayload; error?: string }
let sessionAiClientId = ""

function getAiClientId() {
  if (sessionAiClientId) return sessionAiClientId
  try {
    const saved = localStorage.getItem("qigou-ai-client-id")
    if (saved && /^[a-zA-Z0-9-]{16,80}$/.test(saved)) return sessionAiClientId = saved
    sessionAiClientId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem("qigou-ai-client-id", sessionAiClientId)
  } catch {
    sessionAiClientId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
  return sessionAiClientId
}

async function readJsonResponse(response: Response): Promise<AnalysisTaskResponse & Partial<AnalysisPayload>> {
  const text = await response.text()
  if (!text.trim()) return {}
  try { return JSON.parse(text) } catch { return { error: `AI 服务网关返回异常（HTTP ${response.status}）` } }
}

async function waitForAnalysisTask(taskId: string) {
  for (let attempt = 0; attempt < 240; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, attempt < 3 ? 1500 : 3000))
    const response = await fetch(`/api/renovation/analysis-status?task_id=${encodeURIComponent(taskId)}`, { cache: "no-store" })
    const payload = await readJsonResponse(response)
    if (!response.ok && response.status !== 202) throw new Error(payload.error || "无法查询分析进度")
    if (payload.status === "error") throw new Error(payload.error || "城市空间分析失败")
    if (payload.status === "complete" && payload.result) return payload.result
  }
  throw new Error("分析等待时间较长，请稍后重新运行。")
}

function buildVisualizationPrompt(result: AgentResult, scheme: UrbanScheme) {
  return `Edit the provided source photograph into one coherent, photorealistic urban public-space micro-renovation proposal.

PRESERVE the original camera angle, perspective, buildings, structural openings, street geometry, mature trees and recognizable identity of ${result.input.location}. Do not invent a different site.

SELECTED SCHEME — ${scheme.title}: ${scheme.concept}
${scheme.actions.map((action, index) => `${index + 1}. ${action.title}: ${action.rationale}`).join("\n")}

LIVING STRUCTURE FOCUS: ${scheme.properties}. Strengthen relationships between walking, staying, edges, centers, shade and existing daily life. Use locally plausible, maintainable materials and realistic daylight. Keep the intervention buildable and proportional to the existing site. Avoid luxury staging, empty monumental plazas, fantasy structures, excessive decoration, glossy showroom materials, text, labels, logos, crowds, watermarks and dramatic cinematic effects. The result must clearly be the same place after a careful urban intervention.`
}

function Hero() {
  return <section className="hero reveal">
    <div className="hero-copy">
      <p className="eyebrow"><span>Urban Aliveness</span> 活力结构城市诊断</p>
      <h1>让城市空间，<br />重新支持<span>人的停留。</span></h1>
      <p className="hero-lead">上传一张城市现场照片。AI 依据亚历山大的 15 个属性读取空间关系，生成三套可比较的微更新方向，并用公众视觉热图检验改造后的注意中心。</p>
      <div className="hero-actions"><button onClick={() => document.querySelector(".urban-studio")?.scrollIntoView({ behavior: "smooth" })}>开始城市诊断<span><Icon name="arrow" size={17} /></span></button><a href="#method">了解方法</a></div>
      <div className="hero-facts"><div><strong>15</strong><span>活力结构属性</span></div><div><strong>3</strong><span>可比较更新方向</span></div><div><strong>3M VAS</strong><span>公众视觉注意热图</span></div></div>
    </div>
    <figure className="hero-visual glass-shell">
      <div className="hero-image-core"><img src="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1500&q=86" alt="具有公共步道、树木和混凝土建筑界面的城市开放空间" /><div className="hero-scan-line" /></div>
      <figcaption className="liquid-glass"><span><i />示例观察</span><b>中心并不来自一个地标，<br />而来自周围关系的共同支持。</b><div><small>强中心</small><small>厚边界</small><small>尺度层级</small></div></figcaption>
    </figure>
  </section>
}

function SectionLabel({ index, title, hint }: { index: string; title: string; hint?: string }) {
  return <div className="section-label"><span>{index}</span><div><h3>{title}</h3>{hint && <p>{hint}</p>}</div></div>
}

type BriefProps = {
  scene: UrbanSceneId; setScene: (value: UrbanSceneId) => void; location: string; setLocation: (value: string) => void
  budget: BudgetId; setBudget: (value: BudgetId) => void; selectedPriorities: PriorityId[]; togglePriority: (value: PriorityId) => void
  mission: string; setMission: (value: string) => void; imageUrl: string | null; imageName: string; onImage: (event: ChangeEvent<HTMLInputElement>) => void
  clearImage: () => void; imageAuthorized: boolean; setImageAuthorized: (value: boolean) => void; running: boolean; onRun: () => void; error: string
}

function BriefPanel(props: BriefProps) {
  return <aside className="brief-panel glass-shell" aria-label="城市空间诊断简报"><div className="brief-core">
    <div className="brief-intro"><p className="eyebrow"><span>01</span> 建立现场简报</p><h2>从一张真实的<br />城市照片开始。</h2><p>描述你观察到的活动、冲突与期待。AI 只根据照片可见证据和明确简报判断。</p></div>
    <section className="form-section"><SectionLabel index="A" title="场地位置" hint="不局限于永庆坊" /><label className="text-field"><Icon name="pin" size={17} /><input value={props.location} onChange={(event) => props.setLocation(event.target.value)} placeholder="例如：广州 · 校园图书馆前广场" /></label></section>
    <section className="form-section"><SectionLabel index="B" title="空间类型" hint="选择最接近的公共场景" /><div className="scene-options">{urbanScenes.map((item) => <button key={item.id} className={props.scene === item.id ? "selected" : ""} onClick={() => props.setScene(item.id)}><b>{item.name}</b><small>{item.note}</small>{props.scene === item.id && <i><Icon name="check" size={12} /></i>}</button>)}</div></section>
    <section className="form-section"><SectionLabel index="C" title="优先关注" hint="最多选择 4 项" /><div className="priority-options">{priorities.map((item) => <button key={item.id} className={props.selectedPriorities.includes(item.id) ? "selected" : ""} onClick={() => props.togglePriority(item.id)}>{item.name}</button>)}</div></section>
    <section className="form-section"><SectionLabel index="D" title="实施尺度" hint="用于控制方案干预强度" /><div className="budget-options">{budgets.map((item) => <button key={item.id} className={props.budget === item.id ? "selected" : ""} onClick={() => props.setBudget(item.id)}><b>{item.name}</b><small>{item.note}</small></button>)}</div></section>
    <section className="form-section"><SectionLabel index="E" title="现场观察" hint="说明正在发生什么，而不只是想要什么风格" /><textarea value={props.mission} maxLength={600} onChange={(event) => props.setMission(event.target.value)} /><div className="char-count"><span>活动、冲突与期待</span><span>{props.mission.length}/600</span></div></section>
    <section className="form-section"><SectionLabel index="F" title="城市照片" hint="诊断必须基于一张现场照片" />{props.imageUrl ? <div className="image-preview"><img src={props.imageUrl} alt="待诊断的城市空间照片" /><div><b>{props.imageName}</b><span>已压缩用于本次分析</span></div><button onClick={props.clearImage} aria-label="移除照片"><Icon name="close" size={17} /></button></div> : <label className="upload-box"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={props.onImage} /><span><Icon name="camera" size={22} /></span><b>上传现场照片</b><small>JPG / PNG / WebP · 原图不进入方案历史</small></label>}
      {props.imageUrl && <label className={`consent ${props.imageAuthorized ? "checked" : ""}`}><input type="checkbox" checked={props.imageAuthorized} onChange={(event) => props.setImageAuthorized(event.target.checked)} /><span>{props.imageAuthorized && <Icon name="check" size={13} />}</span><p>我确认拥有该照片的使用权，并同意仅用于本次城市空间诊断。</p></label>}
    </section>
    {props.error && <p className="form-error" role="alert">{props.error}</p>}
    <button className="run-button" disabled={props.running} onClick={props.onRun}><span><Icon name="spark" size={19} />{props.running ? "GPT‑5.6 正在读取现场" : "生成城市活力诊断"}</span><i><Icon name="arrow" size={17} /></i></button>
    <p className="run-note"><span />真实多模态模型 · 约 50–120 秒</p>
  </div></aside>
}

function EmptyStage() {
  return <section className="agent-empty reveal"><div className="empty-orbit" aria-hidden="true">{Array.from({ length: 15 }).map((_, index) => <i key={index} style={{ "--i": index } as CSSProperties} />)}<span>15</span></div><p className="eyebrow"><span>02</span> 城市治疗引擎</p><h2>诊断不是终点，<br /><em>空间改变才是。</em></h2><p>系统会把照片证据转译为 15 项活力结构评分，并同时提出三个不同干预尺度的方案。选择其中一套后，再生成同一场地的改造效果图。</p><div className="empty-flow"><div><b>Diagnose</b><span>照片与 15 属性</span></div><i /><div><b>Compare</b><span>三套更新方向</span></div><i /><div><b>Heal</b><span>效果图与 3M VAS</span></div></div></section>
}

function RunningStage({ activeStep }: { activeStep: number }) {
  const progress = Math.round(((activeStep + 1) / runSteps.length) * 100)
  return <section className="running-stage" aria-live="polite"><div className="running-head"><span className="pulse-mark"><BrandMark /></span><div><p>栖构 AI 正在工作</p><h2>{runSteps[Math.min(activeStep, runSteps.length - 1)]}</h2></div><strong>{progress}%</strong></div><div className="progress-track"><i style={{ transform: `scaleX(${progress / 100})` }} /></div><div className="trace-list">{runSteps.map((step, index) => <div key={step} className={index < activeStep ? "done" : index === activeStep ? "active" : "pending"}><span>{index < activeStep ? <Icon name="check" size={13} /> : String(index + 1).padStart(2, "0")}</span><p><b>{step}</b><small>{index < activeStep ? "证据已写入" : index === activeStep ? "正在调用模型…" : "等待"}</small></p></div>)}</div></section>
}

function ScoreOrb({ value, target }: { value: number; target: number }) {
  const percent = Math.round((value / 15) * 100)
  return <div className="score-orb" style={{ "--score": `${percent * 3.6}deg` } as CSSProperties}><div><strong>{value.toFixed(1)}</strong><span>/15</span><small>当前活力</small></div><p>可达 {target.toFixed(1)}</p></div>
}

function PropertyDiagnosis({ properties }: { properties: PropertyScore[] }) {
  const [selected, setSelected] = useState<PropertyScore | null>(null)
  const weak = properties.slice().sort((a, b) => a.score - b.score).slice(0, 3)
  return <section className="result-section property-diagnosis reveal"><header className="section-head"><div><span>01</span><h3>活力结构诊断</h3></div><p>评分不是“漂亮程度”，而是空间关系对公共生活的支持程度。</p></header><div className="weak-grid">{weak.map((property, index) => <button key={property.id} onClick={() => setSelected(property)}><span>薄弱关系 {index + 1}</span><strong>{property.name}</strong><p>{property.insight}</p><i><b style={{ transform: `scaleX(${property.score})` }} /></i><small>{property.score.toFixed(2)} / 1.00</small></button>)}</div><details className="all-properties"><summary>查看全部 15 项属性 <Icon name="arrow" size={16} /></summary><div>{properties.map((property) => <button key={property.id} onClick={() => setSelected(property)}><span>{String(property.index).padStart(2, "0")}</span><p><b>{property.name}</b><small>{property.english}</small></p><i><b style={{ transform: `scaleX(${property.score})` }} /></i><strong>{property.score.toFixed(2)}</strong></button>)}</div></details>{selected && <div className="property-popover liquid-glass"><button onClick={() => setSelected(null)} aria-label="关闭属性说明"><Icon name="close" size={16} /></button><small>{selected.group}</small><h4>{selected.name}</h4><p>{selected.insight}</p><div><span>当前 {selected.score.toFixed(2)}</span><Icon name="arrow" size={14} /><span>谨慎目标 {selected.target.toFixed(2)}</span></div></div>}</section>
}

function SchemeExplorer({ schemes, selectedId, onSelect }: { schemes: UrbanScheme[]; selectedId: string; onSelect: (id: string) => void }) {
  const selected = schemes.find((scheme) => scheme.id === selectedId) ?? schemes[0]
  return <section className="result-section scheme-section reveal"><header className="section-head"><div><span>02</span><h3>三套推荐方向</h3></div><p>不是三个风格选项，而是不同干预强度、实施成本与公共关系的取舍。</p></header><div className="scheme-tabs" role="tablist">{schemes.map((scheme, index) => <button key={scheme.id} role="tab" aria-selected={scheme.id === selected.id} className={scheme.id === selected.id ? "selected" : ""} onClick={() => onSelect(scheme.id)}><span>0{index + 1} · {scheme.intensity}</span><h4>{scheme.title}</h4><p>{scheme.tagline}</p><div><small>{scheme.properties}</small><strong>{scheme.projectedScore.toFixed(1)}<i>/15</i></strong></div></button>)}</div><article className="scheme-detail glass-shell"><div className="scheme-detail-core"><header><div><p className="eyebrow"><span>Selected</span> {selected.intensity}</p><h3>{selected.title}</h3><p>{selected.concept}</p></div><aside><small>主要受益公众</small><b>{selected.audience}</b><span>{selected.properties}</span></aside></header><div className="scheme-actions">{selected.actions.map((action, index) => <div key={action.title}><span>{String(index + 1).padStart(2, "0")}</span><article><small>{action.properties}</small><h4>{action.title}</h4><p>{action.rationale}</p></article></div>)}</div></div></article></section>
}

type RenderState = { status: "idle" | "submitting" | "processing" | "complete" | "error"; progress: number; taskId?: string; imageUrl?: string; error?: string }
type AttentionPoint = { x: number; y: number }
type AttentionRecord = { points: AttentionPoint[]; participants: number }

function VisualAttentionMap({ imageUrl, storageKey }: { imageUrl: string; storageKey: string }) {
  const [record, setRecord] = useState<AttentionRecord>({ points: [], participants: 0 })
  const [current, setCurrent] = useState<AttentionPoint[]>([])
  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(`qigou-vas-${storageKey}`) || "null"); if (saved?.points) setRecord(saved) } catch { setRecord({ points: [], participants: 0 }) }
  }, [storageKey])
  const allPoints = [...record.points, ...current]
  const addPoint = (event: MouseEvent<HTMLDivElement>) => {
    if (current.length >= 3) return
    const rect = event.currentTarget.getBoundingClientRect()
    setCurrent((items) => [...items, { x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 }])
  }
  const submit = () => {
    if (!current.length) return
    const next = { points: [...record.points, ...current], participants: record.participants + 1 }
    setRecord(next); setCurrent([]); localStorage.setItem(`qigou-vas-${storageKey}`, JSON.stringify(next))
  }
  const reset = () => { setRecord({ points: [], participants: 0 }); setCurrent([]); localStorage.removeItem(`qigou-vas-${storageKey}`) }
  const cells = new Map<string, number>()
  record.points.forEach((point) => { const key = `${Math.floor(point.x / 20)}-${Math.floor(point.y / 20)}`; cells.set(key, (cells.get(key) || 0) + 1) })
  const peak = Math.max(0, ...cells.values())
  const concentration = record.points.length ? Math.round((peak / record.points.length) * 100) : 0
  return <section className="vas-panel"><header><div><p className="eyebrow"><span>参考 3M VAS</span> 公众视觉注意反馈</p><h3>改造后，视线首先落在哪里？</h3><p>请参与者在图中选择最多 3 个最吸引视线的位置。不询问心情，只记录视觉注意。</p></div><div className="vas-metrics"><span><b>{record.participants}</b>参与者</span><span><b>{record.points.length}</b>关注点</span><span><b>{concentration}%</b>集中度</span></div></header><div className="vas-workspace"><div className="heatmap-frame" onClick={addPoint} role="application" aria-label="点击改造后图片添加视觉关注点"><img src={imageUrl} alt="用于公众视觉注意反馈的改造后城市空间" /><div className="heat-layer">{allPoints.map((point, index) => <i key={`${point.x}-${point.y}-${index}`} className={index >= record.points.length ? "pending" : ""} style={{ left: `${point.x}%`, top: `${point.y}%` }} />)}</div>{current.map((point, index) => <span key={`marker-${index}`} className="attention-marker" style={{ left: `${point.x}%`, top: `${point.y}%` }}>{index + 1}</span>)}</div><aside><div className="heat-legend"><span>低关注</span><i /><span>高关注</span></div><p>蓝色表示较少注意，红色表示注意集中。热图用于比较方案是否形成清晰而适度的视觉中心。</p><div className="selection-count"><b>{current.length}</b><span>/ 3 本轮选择</span></div><button disabled={!current.length} onClick={submit}>提交本轮反馈 <Icon name="arrow" size={15} /></button>{record.points.length > 0 && <button className="text-action" onClick={reset}>清空本机演示数据</button>}</aside></div><footer><Icon name="info" size={15} /><p>这是参考 3M VAS（Visual Attention Software）视觉注意逻辑的公众共评原型，并非调用 3M 专有预测算法。结果保存在当前浏览器。</p></footer></section>
}

function VisualizationWorkspace({ result, scheme, sourceImage, state, onGenerate }: { result: AgentResult; scheme: UrbanScheme; sourceImage: string | null; state: RenderState; onGenerate: () => void }) {
  const [confirmed, setConfirmed] = useState(false)
  const [compare, setCompare] = useState(52)
  const busy = state.status === "submitting" || state.status === "processing"
  return <section className="result-section visualize-section reveal"><header className="section-head"><div><span>03</span><h3>效果图与视觉验证</h3></div><p>AI 只执行当前选中的“{scheme.title}”，并保留原场地视角和主要结构。</p></header>{!sourceImage ? <div className="visual-empty"><Icon name="camera" size={24} /><div><h4>历史方案不保存原始照片</h4><p>重新上传现场照片并运行诊断后，才能生成效果图。</p></div></div> : state.status === "complete" && state.imageUrl ? <><div className="comparison-frame" style={{ "--compare": `${compare}%` } as CSSProperties}><img className="before-image" src={sourceImage} alt="城市空间改造前" /><div className="after-clip"><img src={state.imageUrl} alt="AI 生成的城市空间改造后效果" /></div><div className="compare-line"><span /></div><span className="before-label">改造前</span><span className="after-label">{scheme.title}</span><input type="range" min="8" max="92" value={compare} onChange={(event) => setCompare(Number(event.target.value))} aria-label="拖动比较改造前后" /></div><div className="render-complete"><span><Icon name="check" size={15} /></span><p><b>效果图已生成</b><small>任务 {state.taskId} · 拖动分界线比较前后</small></p><a href={state.imageUrl} target="_blank" rel="noreferrer">打开原图 <Icon name="arrow" size={14} /></a></div><VisualAttentionMap imageUrl={state.imageUrl} storageKey={state.taskId || scheme.id} /></> : <div className="generation-card"><div className="generation-image"><img src={sourceImage} alt="用于生成改造效果的城市现场" /><span>原场地 · 保留结构与视角</span></div><div className="generation-copy"><p className="eyebrow"><span>GPT Image 2</span> 城市图生图</p><h4>把“{scheme.title}”<br />变成同一场地的改造图。</h4><div className="action-pills">{scheme.actions.map((action) => <span key={action.title}><Icon name="check" size={12} />{action.title}</span>)}</div>{busy ? <div className="render-progress"><div><span>{state.status === "submitting" ? "提交图像任务" : "生成城市改造图"}</span><strong>{state.progress}%</strong></div><i><b style={{ transform: `scaleX(${state.progress / 100})` }} /></i><p>通常需要 1–3 分钟，可以继续阅读诊断。</p></div> : <><label className={`plan-confirm ${confirmed ? "checked" : ""}`}><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>{confirmed && <Icon name="check" size={13} />}</span><p>我确认按当前方案生成，并理解效果图仍需现场、产权、消防和专业人员复核。</p></label>{state.status === "error" && <p className="render-error">{state.error}</p>}<button className="generate-button" disabled={!confirmed} onClick={onGenerate}><Icon name="spark" size={18} />生成改造后图片<span><Icon name="arrow" size={15} /></span></button></>}</div></div>}</section>
}

function ResultView({ result, sourceImage, renderState, selectedSchemeId, onSelectScheme, onGenerate, onReset, onExport }: { result: AgentResult; sourceImage: string | null; renderState: RenderState; selectedSchemeId: string; onSelectScheme: (id: string) => void; onGenerate: () => void; onReset: () => void; onExport: () => void }) {
  const scene = urbanScenes.find((item) => item.id === result.input.scene) ?? urbanScenes[0]
  const scheme = result.schemes.find((item) => item.id === selectedSchemeId) ?? result.schemes[0]
  return <article className="agent-result"><header className="result-hero reveal"><div><p className="eyebrow"><span>Diagnosis complete</span> {result.traceId}</p><h2>{result.input.location || "城市空间"}<br /><span>{scene.name}活力诊断</span></h2><p>{result.summary}</p><div className="result-tags"><span>{result.analysis.confidence}置信度</span><span>{result.analysis.mode === "multimodal" ? "真实图像分析" : "简报分析"}</span><span>{result.analysis.knowledgeStatus === "retrieved" ? "百炼知识库已检索" : "15 属性规范语料"}</span></div></div><ScoreOrb value={result.baseline} target={result.target} /></header><PropertyDiagnosis properties={result.properties} /><SchemeExplorer schemes={result.schemes} selectedId={scheme.id} onSelect={onSelectScheme} /><VisualizationWorkspace result={result} scheme={scheme} sourceImage={sourceImage} state={renderState} onGenerate={onGenerate} /><details className="evidence-panel"><summary><span><Icon name="layers" size={17} />查看模型轨迹、证据与实施边界</span><Icon name="arrow" size={15} /></summary><div><section><h4>执行轨迹</h4>{result.steps.map((step, index) => <article key={step.id}><span>{String(index + 1).padStart(2, "0")}</span><p><b>{step.name}</b><small>{step.summary}</small><em>{step.evidence}</em></p></article>)}</section><section><h4>进入实施前确认</h4>{result.decisionGate.map((item) => <p key={item}><Icon name="check" size={13} />{item}</p>)}<h4>证据来源</h4>{result.evidence.map((item) => <article key={item.name}><b>{item.name}</b><span>{item.type}</span><p>{item.usage}</p></article>)}</section></div></details><footer className="result-actions"><span>方案编号 <b>{result.traceId}</b></span><button onClick={onReset}><Icon name="refresh" size={15} />修改现场简报</button><button onClick={onExport}><Icon name="download" size={15} />导出摘要</button></footer></article>
}

function ProjectsPage({ projects, onOpen, onClear }: { projects: AgentResult[]; onOpen: (project: AgentResult) => void; onClear: () => void }) {
  return <main className="page-shell subpage"><header className="subpage-head"><div><p className="eyebrow"><span>Archive</span> 城市方案记录</p><h1>每一次现场判断，<br /><span>都可以重新比较。</span></h1><p>这里只保存脱敏后的文字诊断与方案，不保存上传照片。</p></div>{projects.length > 0 && <button onClick={onClear}>清空记录</button>}</header>{projects.length ? <section className="project-grid">{projects.map((project) => { const scene = urbanScenes.find((item) => item.id === project.input.scene) ?? urbanScenes[0]; return <button key={project.traceId} onClick={() => onOpen(project)}><span><Icon name="city" size={18} />{scene.name}</span><small>{new Date(project.createdAt).toLocaleDateString("zh-CN")}</small><h2>{project.input.location || "未命名城市空间"}</h2><p>{project.summary}</p><div><strong>{project.baseline.toFixed(1)}</strong><Icon name="arrow" size={14} /><strong>{project.target.toFixed(1)}</strong><i>/15</i></div><footer>{project.schemes.length} 套方案 <Icon name="arrow" size={15} /></footer></button>})}</section> : <section className="projects-empty"><BrandMark /><h2>还没有城市诊断</h2><p>上传一张现场照片并完成分析，方案会保存在这个浏览器中。</p></section>}</main>
}

function PropertiesPage() {
  const groups = ["层级与中心", "边界与连接", "节奏与变化", "张力与平静"] as const
  return <main className="page-shell subpage"><header className="subpage-head"><div><p className="eyebrow"><span>15 Properties</span> Christopher Alexander</p><h1>不判断风格，<br /><span>判断空间是否有生命。</span></h1><p>15 个属性是一套观察整体关系的语言。它们帮助我们看见中心、边界、尺度、渐变和场所之间如何彼此支持。</p></div><div className="property-stamp"><strong>15</strong><span>每项 0–1<br />总分 15</span></div></header><section className="property-groups">{groups.map((group) => <article key={group}><h2>{group}</h2><div>{propertyDefinitions.filter((item) => item.group === group).map((item) => <section key={item.id}><span>{String(item.index).padStart(2, "0")}</span><p><b>{item.name}</b><small>{item.english}</small></p></section>)}</div></article>)}</section></main>
}

const sampleVasImage = "https://images.unsplash.com/photo-1494522358652-f30e61a60313?auto=format&fit=crop&w=1400&q=84"
function VasPage() {
  return <main className="page-shell subpage vas-page"><header className="subpage-head"><div><p className="eyebrow"><span>Visual Attention</span> 参考 3M VAS</p><h1>不是问“喜欢吗”，<br /><span>而是看“先看到哪里”。</span></h1><p>公众在改造效果图上标记最吸引视线的位置，系统汇总为从蓝到红的视觉注意热图，用来检查方案是否形成清晰而不过度竞争的中心。</p></div></header><VisualAttentionMap imageUrl={sampleVasImage} storageKey="public-demo" /></main>
}

function MethodPage() {
  return <main id="method" className="page-shell subpage"><header className="subpage-head"><div><p className="eyebrow"><span>Method</span> Living Structure + AI</p><h1>从现场证据，<br /><span>走向可讨论的改变。</span></h1></div></header><section className="method-flow">{[["01","诊断","GPT‑5.6 读取现场照片，并按固定 15 属性逐项说明证据。"],["02","分流","生成微介入、协同更新和重点重塑三套真实取舍。"],["03","可视化","选择一套方案，由 GPT Image 2 在同一照片上生成改造效果。"],["04","公众共评","参考 3M VAS 的视觉注意逻辑，收集热点而不是情绪标签。"]].map((item) => <article key={item[0]}><span>{item[0]}</span><h2>{item[1]}</h2><p>{item[2]}</p></article>)}</section><section className="boundary-note"><div><p className="eyebrow"><span>Boundary</span> 模型边界</p><h2>AI 提出有依据的方向，<br />但不替代现场与公众。</h2></div><ul><li>照片无法确认产权、消防、管线和结构条件</li><li>活力分数是理论框架下的可解释评估，不是审美真理</li><li>预算为概念阶段区间，不是正式报价</li><li>VAS 热图是公众反馈原型，不是 3M 专有算法预测</li></ul></section></main>
}

export default function App() {
  const [tab, setTab] = useState<Tab>("diagnose")
  const [scene, setScene] = useState<UrbanSceneId>("campus")
  const [location, setLocation] = useState("广州 · 校园图书馆前广场")
  const [budget, setBudget] = useState<BudgetId>("balanced")
  const [selectedPriorities, setSelectedPriorities] = useState<PriorityId[]>(["stay", "shade", "wayfinding"])
  const [mission, setMission] = useState(defaultMission)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageName, setImageName] = useState("")
  const [imageAuthorized, setImageAuthorized] = useState(false)
  const [running, setRunning] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [result, setResult] = useState<AgentResult | null>(null)
  const [selectedSchemeId, setSelectedSchemeId] = useState("")
  const [projects, setProjects] = useState<AgentResult[]>([])
  const [error, setError] = useState("")
  const [renderState, setRenderState] = useState<RenderState>({ status: "idle", progress: 0 })
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => { try { const saved = JSON.parse(localStorage.getItem("qigou-urban-projects-v2") || "[]"); if (Array.isArray(saved)) setProjects(saved.slice(0, 8)) } catch { setProjects([]) } }, [])
  const selectedScheme = useMemo(() => result?.schemes.find((item) => item.id === selectedSchemeId) ?? result?.schemes[0], [result, selectedSchemeId])

  const togglePriority = (value: PriorityId) => setSelectedPriorities((current) => current.includes(value) ? current.filter((item) => item !== value) : current.length < 4 ? [...current, value] : current)
  const onImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 12 * 1024 * 1024) return setError("照片请控制在 12 MB 以内。")
    try { const compressed = await fileToCompressedDataUrl(file); setImageUrl(compressed); setImageName(file.name); setImageAuthorized(false); setError("") } catch (caught) { setError(caught instanceof Error ? caught.message : "无法读取照片") }
  }
  const clearImage = () => { setImageUrl(null); setImageName(""); setImageAuthorized(false) }
  const persistProject = (next: AgentResult) => { const updated = [next, ...projects.filter((item) => item.traceId !== next.traceId)].slice(0, 8); setProjects(updated); localStorage.setItem("qigou-urban-projects-v2", JSON.stringify(updated)) }

  const runAgent = async () => {
    if (!imageUrl) return setError("请先上传一张城市空间现场照片。")
    if (!imageAuthorized) return setError("请先确认照片使用授权。")
    if (mission.trim().length < 12) return setError("请至少用 12 个字描述现场活动、冲突与期待。")
    setError(""); setResult(null); setRunning(true); setActiveStep(0)
    const input: AgentInput = { mode: "urban", scene, location: location.trim(), budget, priorities: selectedPriorities, mission: mission.trim(), hasImage: true }
    let displayedStep = 0
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const timer = window.setInterval(() => { displayedStep = Math.min(runSteps.length - 2, displayedStep + 1); setActiveStep(displayedStep) }, reduceMotion ? 500 : 2100)
    try {
      const taskId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const response = await fetch("/api/renovation/analyze", { method: "POST", headers: { "Content-Type": "application/json", "X-Qigou-Client": getAiClientId() }, body: JSON.stringify({ taskId, input, image: imageUrl }) })
      const initial = await readJsonResponse(response)
      if (!response.ok && response.status !== 202) throw new Error(initial.error || `分析任务提交失败（HTTP ${response.status}）`)
      const payload = initial.properties ? initial as AnalysisPayload : await waitForAnalysisTask(taskId)
      const next = createUrbanResult(input, payload)
      setActiveStep(runSteps.length - 1); setResult(next); setSelectedSchemeId(next.schemes[0].id); setRenderState({ status: "idle", progress: 0 }); persistProject(next)
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }), 100)
    } catch (caught) { setError(caught instanceof Error ? caught.message : "城市空间分析失败，请重试。") } finally { window.clearInterval(timer); setRunning(false) }
  }

  const selectScheme = (id: string) => { setSelectedSchemeId(id); setRenderState({ status: "idle", progress: 0 }) }
  const generateVisualization = async () => {
    if (!result || !selectedScheme || !imageUrl) return
    setRenderState({ status: "submitting", progress: 3 })
    try {
      const response = await fetch("/api/renovation/generate", { method: "POST", headers: { "Content-Type": "application/json", "X-Qigou-Client": getAiClientId() }, body: JSON.stringify({ prompt: buildVisualizationPrompt(result, selectedScheme), image: imageUrl, size: "1536x1024", quality: "medium" }) })
      const payload = await response.json()
      if (!response.ok || !payload.task_id) throw new Error(payload.error || "无法提交图像生成任务")
      const taskId = String(payload.task_id)
      setRenderState({ status: "processing", progress: 8, taskId })
      for (let attempt = 0; attempt < 180; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 5000))
        const statusResponse = await fetch(`/api/renovation/status?task_id=${encodeURIComponent(taskId)}`, { cache: "no-store" })
        const status = await statusResponse.json()
        if (!statusResponse.ok) throw new Error(status.error || "无法查询图像任务")
        const progress = Math.max(8, Math.min(98, Number(status.progress) || 8 + Math.round(attempt * 1.3)))
        if (status.is_final && status.result_url) { setRenderState({ status: "complete", progress: 100, taskId, imageUrl: status.result_url }); return }
        if (status.is_final || status.state === "failed") throw new Error(status.error || "图像生成失败")
        setRenderState({ status: "processing", progress, taskId })
      }
      throw new Error("图像任务仍在处理中，请稍后重试。")
    } catch (caught) { setRenderState({ status: "error", progress: 0, error: caught instanceof Error ? caught.message : "图像生成失败" }) }
  }

  const openProject = (project: AgentResult) => { setScene(project.input.scene); setLocation(project.input.location); setBudget(project.input.budget); setSelectedPriorities(project.input.priorities); setMission(project.input.mission); clearImage(); setResult(project); setSelectedSchemeId(project.schemes[0].id); setRenderState({ status: "idle", progress: 0 }); setTab("diagnose"); window.scrollTo({ top: 0, behavior: "smooth" }) }
  const exportResult = () => {
    if (!result) return
    const lines = ["栖构 Urban Aliveness｜城市活力诊断", `任务编号：${result.traceId}`, `场地：${result.input.location}`, `当前评分：${result.baseline}/15`, "", result.summary, "", ...result.schemes.flatMap((scheme, index) => [`方案 ${index + 1}｜${scheme.title}｜${scheme.intensity}｜目标 ${scheme.projectedScore}/15`, scheme.concept, ...scheme.actions.map((action) => `- ${action.title}：${action.rationale}`), ""]), "进入实施前确认：", ...result.decisionGate.map((item) => `- ${item}`)]
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = `城市活力诊断-${result.traceId}.txt`; link.click(); URL.revokeObjectURL(url)
  }

  return <div className="app-shell"><TopNav tab={tab} onChange={setTab} />{tab === "diagnose" ? <main className="page-shell"><Hero /><section className="urban-studio"><BriefPanel scene={scene} setScene={setScene} location={location} setLocation={setLocation} budget={budget} setBudget={setBudget} selectedPriorities={selectedPriorities} togglePriority={togglePriority} mission={mission} setMission={setMission} imageUrl={imageUrl} imageName={imageName} onImage={onImage} clearImage={clearImage} imageAuthorized={imageAuthorized} setImageAuthorized={setImageAuthorized} running={running} onRun={runAgent} error={error} /><div className="agent-stage" ref={resultRef}>{running ? <RunningStage activeStep={activeStep} /> : result ? <ResultView result={result} sourceImage={imageUrl} renderState={renderState} selectedSchemeId={selectedSchemeId} onSelectScheme={selectScheme} onGenerate={generateVisualization} onReset={() => { setResult(null); setError("") }} onExport={exportResult} /> : <EmptyStage />}</div></section></main> : tab === "projects" ? <ProjectsPage projects={projects} onOpen={openProject} onClear={() => { setProjects([]); localStorage.removeItem("qigou-urban-projects-v2") }} /> : tab === "properties" ? <PropertiesPage /> : tab === "vas" ? <VasPage /> : <MethodPage />}<footer className="site-footer"><div><BrandMark /><p><b>栖构 Urban Aliveness</b><span>让城市空间支持正在发生的生活</span></p></div><p>Living Structure + AI 城市创新研习营 · 香港科技大学（广州）</p><nav><button onClick={() => setTab("method")}>方法与边界</button><button onClick={() => setTab("vas")}>视觉注意热图</button></nav></footer></div>
}
