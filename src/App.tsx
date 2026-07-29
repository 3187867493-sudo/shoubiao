import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react"
import {
  createAgentResult,
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

type Tab = "studio" | "projects" | "properties" | "method"
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
  "居住对象建模",
  "空间现状诊断",
  "15 属性活力评估",
  "居住安全检查",
  "方案编排",
  "预算与工期拆解",
  "交付包生成",
]

const defaultMission = "希望客厅既能陪孩子游戏，也能让大人阅读和偶尔居家办公；收纳要充足，但不要把空间做得像样板间。"

function buildVisualizationPrompt(result: AgentResult) {
  const modeLabel = result.input.mode === "walk" ? "public-space micro-renovation" : "residential interior renovation"
  const actions = result.actions.map((action, index) => `${index + 1}. ${action.title}: ${action.rationale}`).join("\n")
  return `Edit the provided source photograph into one coherent, photorealistic ${modeLabel} proposal based strictly on the confirmed plan below.

PRESERVE: the original camera angle, perspective, room or facade geometry, structural walls, columns, doors, windows, ceiling height, surrounding context, and recognizable identity of the place. Do not move openings or invent another building. Keep all unchanged pixels and materials visually consistent where the plan does not require intervention.

CONFIRMED RENOVATION PLAN:
${actions}

LIVING STRUCTURE INTENT: strengthen strong centers, boundaries, levels of scale, gradients, positive space, echoes, roughness, simplicity and not-separateness. The result should feel lived-in, calm, maintainable, locally grounded and buildable. Use warm natural materials, realistic contact shadows and physically plausible daylight. Avoid luxury staging, excessive decoration, glossy showroom surfaces, blue-purple AI lighting, text, labels, people, watermarks, dramatic lens effects, and structural fantasy. Produce a high-quality architectural visualization of the same place after renovation.`
}

async function fileToCompressedDataUrl(file: File, maxSide = 1600, quality = 0.88) {
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
  return canvas.toDataURL("image/jpeg", quality)
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
        <span><b>栖构</b><small>Living Home</small></span>
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
        <p className="eyebrow"><span>01</span> 为生活中的人设计</p>
        <h1>一个家，不该只适合<br /><em>一种标准答案。</em></h1>
        <p className="hero-lead">从家中真实需求或一次城市漫步的发现出发，栖构智能体用 Living Structure 的 15 个属性完成诊断、提出一套改造方案，并在你确认后生成改造效果图。</p>
        <div className="hero-facts">
          <div><strong>15</strong><span>项活力结构诊断</span></div>
          <div><strong>6</strong><span>类居住对象模型</span></div>
          <div><strong>1</strong><span>次完整智能体编排</span></div>
        </div>
      </div>
      <figure className="hero-visual">
        <img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=86" alt="有自然材料、阅读角和家庭活动中心的温暖客厅" />
        <figcaption>
          <span>空间观察 07</span>
          <b>强中心不是一件家具，<br />而是一组彼此支持的关系。</b>
        </figcaption>
        <div className="hero-score"><strong>11.8</strong><span>/ 15</span><small>活力结构潜力</small></div>
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
    <aside className="brief-panel" aria-label="装修任务设置">
      <div className="brief-intro">
        <p className="eyebrow"><span>02</span> 建立居住简报</p>
        <h2>先告诉我，<br />谁会住在这里。</h2>
        <p>对象不是标签，而是影响尺度、边界、动线和安全的设计条件。</p>
      </div>

      <div className="mode-switch" aria-label="选择项目来源">
        <button className={mode === "home" ? "selected" : ""} onClick={() => setMode("home")}><Icon name="home" size={18} /><span><b>居家改造</b><small>从居住对象出发</small></span></button>
        <button className={mode === "walk" ? "selected" : ""} onClick={() => setMode("walk")}><Icon name="eye" size={18} /><span><b>城市漫步发现</b><small>把观察变成微更新</small></span></button>
      </div>

      {mode === "home" ? <>
        <section className="form-section">
          <SectionLabel index="A" title="居住对象" hint="选择最接近当前家庭的情况" />
          <div className="persona-grid">
            {personas.map((item) => (
              <button key={item.id} className={`persona-option ${persona === item.id ? "selected" : ""}`} onClick={() => setPersona(item.id)} style={{ "--persona": item.accent } as React.CSSProperties}>
                <span className="persona-icon"><Icon name={personaIcons[item.id]} size={22} /></span>
                <span><b>{item.name}</b><small>{item.english}</small></span>
                {persona === item.id && <i><Icon name="check" size={13} /></i>}
              </button>
            ))}
          </div>
        </section>

        <section className="form-section">
          <SectionLabel index="B" title="空间范围" />
          <div className="room-options">
            {rooms.map((item) => <button key={item.id} className={room === item.id ? "selected" : ""} onClick={() => setRoom(item.id)}><b>{item.name}</b><small>{item.description}</small></button>)}
          </div>
        </section>
      </> : <>
        <section className="form-section">
          <SectionLabel index="A" title="漫步发现地点" hint="不必局限于永庆坊" />
          <input className="location-input" value={location} onChange={(event) => setLocation(event.target.value)} maxLength={80} placeholder="例如：永庆坊 · 恩宁路骑楼段" />
        </section>
        <section className="form-section">
          <SectionLabel index="B" title="改造对象" hint="选择这次希望介入的空间" />
          <div className="room-options walk-options">
            {walkScenes.map((item) => <button key={item.id} className={walkScene === item.id ? "selected" : ""} onClick={() => setWalkScene(item.id)}><b>{item.name}</b><small>{item.description}</small></button>)}
          </div>
        </section>
      </>}

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
        <SectionLabel index="E" title="你的生活任务" hint="比“现代简约”更具体一些" />
        <textarea value={mission} onChange={(event) => setMission(event.target.value)} maxLength={600} aria-label="描述装修需求" />
        <div className="char-count"><span>描述日常动作、矛盾和期待</span><span>{mission.length}/600</span></div>
      </section>

      <section className="form-section">
        <SectionLabel index="F" title="空间照片" hint="可选；有实景图会让诊断更准确" />
        {imageUrl ? (
          <div className="image-preview">
            <img src={imageUrl} alt="用户上传的待改造空间" />
            <div><b>{imageName}</b><span>仅用于本次浏览器会话</span></div>
            <button onClick={clearImage} aria-label="移除上传图片"><Icon name="close" size={17} /></button>
          </div>
        ) : (
          <label className="upload-box">
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onImage} />
            <span><Icon name="camera" size={23} /></span>
            <b>上传当前空间</b>
            <small>JPG、PNG 或 WebP · 建议正对空间拍摄</small>
          </label>
        )}
        {imageUrl && (
          <label className={`consent ${imageAuthorized ? "checked" : ""}`}>
            <input type="checkbox" checked={imageAuthorized} onChange={(event) => setImageAuthorized(event.target.checked)} />
            <span><Icon name={imageAuthorized ? "check" : "shield"} size={14} /></span>
            <p>我确认拥有该图片的使用权，并同意用于本次空间诊断。原图不会写入方案历史。</p>
          </label>
        )}
      </section>

      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="run-button" disabled={running} onClick={onRun}>
        <span><Icon name="spark" size={20} />{running ? "正在编排方案" : "运行栖构智能体"}</span>
        <Icon name="arrow" size={20} />
      </button>
      <p className="run-note"><span />本地可追踪编排 · 不自动执行采购或施工</p>
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
      <p>智能体不会直接套用某种装修风格，而是依次完成对象建模、空间诊断、Living Structure 检索、方案规划、预算拆解和风险门控。</p>
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
      <div className="privacy-strip"><Icon name="shield" size={17} /><p><b>最小必要处理</b><span>图片只用于当前诊断，不进入本地方案历史。</span></p></div>
    </section>
  )
}

function ScoreDial({ value, target }: { value: number; target: number }) {
  const percent = Math.round((value / 15) * 100)
  return (
    <div className="score-dial" style={{ "--score": `${percent * 3.6}deg` } as React.CSSProperties}>
      <div><strong>{value.toFixed(1)}</strong><span>/15</span><small>当前活力</small></div>
      <p>目标 {target.toFixed(1)}</p>
    </div>
  )
}

function PropertyPanel({ properties, selected, onSelect }: { properties: PropertyScore[]; selected: PropertyScore | null; onSelect: (item: PropertyScore | null) => void }) {
  return (
    <section className="result-section property-section">
      <div className="result-section-head"><div><span>01</span><h3>15 项活力结构</h3></div><p>每项 0–1 分，总分 15。条形中的浅色部分是改造目标。</p></div>
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

type RenderState = {
  status: "idle" | "submitting" | "processing" | "complete" | "error"
  progress: number
  taskId?: string
  imageUrl?: string
  error?: string
}

function VisualizationWorkspace({ result, sourceImage, state, onGenerate }: { result: AgentResult; sourceImage: string | null; state: RenderState; onGenerate: () => void }) {
  const [confirmed, setConfirmed] = useState(false)
  const [compare, setCompare] = useState(54)
  const isBusy = state.status === "submitting" || state.status === "processing"
  return (
    <section className="result-section visualize-section">
      <div className="result-section-head"><div><span>05</span><h3>AI 改造效果图</h3></div><p>确认上方这一套方案后，AI 会在原图上完成空间改造，不另起一套风格方案。</p></div>
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

function ResultView({ result, sourceImage, renderState, onGenerate, onReset, onExport }: { result: AgentResult; sourceImage: string | null; renderState: RenderState; onGenerate: () => void; onReset: () => void; onExport: () => void }) {
  const [selectedProperty, setSelectedProperty] = useState<PropertyScore | null>(null)
  const persona = personas.find((item) => item.id === result.input.persona) ?? personas[0]
  const room = rooms.find((item) => item.id === result.input.room) ?? rooms[0]
  const walkScene = walkScenes.find((item) => item.id === result.input.walkScene) ?? walkScenes[0]
  const isWalk = result.input.mode === "walk"
  return (
    <article className="agent-result">
      <header className="result-hero">
        <div className="result-title">
          <p className="eyebrow"><span>03</span> 方案已生成 · {result.traceId}</p>
          <h2>{isWalk ? (result.input.location || "城市漫步发现") : persona.name}<br /><em>{isWalk ? walkScene.name : room.name}活力更新方案</em></h2>
          <p>{result.summary}</p>
          <div className="result-tags"><span>{result.budgetRange}</span><span>{result.deliveryCycle}</span><span>{result.steps.length} 个工具步骤</span></div>
        </div>
        <ScoreDial value={result.baseline} target={result.target} />
      </header>

      <PropertyPanel properties={result.properties} selected={selectedProperty} onSelect={setSelectedProperty} />

      <section className="result-section actions-section">
        <div className="result-section-head"><div><span>02</span><h3>分阶段空间干预</h3></div><p>先修复关键空间关系，再决定风格与物件。</p></div>
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

      <VisualizationWorkspace result={result} sourceImage={sourceImage} state={renderState} onGenerate={onGenerate} />

      <section className="handoff-section">
        <div className="handoff-image"><img src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=84" alt="自然材料与柔和照明构成的空间参考" /><span>材料方向参考 · 非生成结果</span></div>
        <div className="handoff-copy"><p className="eyebrow"><span>06</span> 交付到实施工作台</p><h3>从效果图继续到<br />材料、尺寸与实施确认。</h3><p>当前交付包已包含 {result.deliverables.length} 项内容。下一阶段应在现场尺寸、使用者共识和真实报价确认后进行，不让 AI 越过人的决定。</p><div className="material-swatches"><i style={{ background: "#c7b396" }} /><i style={{ background: "#725e49" }} /><i style={{ background: "#879588" }} /><i style={{ background: "#ded9ce" }} /><span>自然木 · 亚麻 · 灰绿 · 暖白</span></div></div>
      </section>

      <details className="trace-details">
        <summary><span><Icon name="layers" size={18} /><b>查看完整执行轨迹与证据</b></span><small>{result.steps.length} tools · 本地可追踪编排</small></summary>
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
      <header className="subpage-head"><div><p className="eyebrow"><span>Archive</span> 本地方案记录</p><h1>每一次居住判断，<br /><em>都可以被重新查看。</em></h1></div>{projects.length > 0 && <button className="text-button" onClick={onClear}>清空本地记录</button>}</header>
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
  return (
    <main className="page-shell subpage properties-page">
      <header className="subpage-head"><div><p className="eyebrow"><span>15 Properties</span> Christopher Alexander</p><h1>判断一个空间，<br /><em>是否真正有生命。</em></h1><p>15 个属性不是装修风格清单，而是观察空间整体关系的语言。栖构将它们转译为普通家庭可以理解和行动的建议。</p></div><div className="fifteen-stamp"><strong>15</strong><span>每项 0–1 分<br />总分 15</span></div></header>
      <div className="property-groups">
        {groups.map((group, groupIndex) => <section key={group}><header><span>0{groupIndex + 1}</span><h2>{group}</h2></header><div>{propertyDefinitions.filter((item) => item.group === group).map((item) => <article key={item.id}><span>{String(item.index).padStart(2, "0")}</span><h3>{item.name}</h3><small>{item.english}</small><p>{({ levels: "从房间到家具再到触手可及的细节，形成连续尺度。", centers: "一个空间由彼此支持的中心组成，并有清晰的主次。", boundaries: "好的边界会强化内部，而不是简单地把空间隔断。", repetition: "相似与差异交替出现，形成可以感受到的节奏。", positive: "空间本身拥有完整形状，而不是家具摆完后留下的缝隙。", shape: "形状清楚、紧凑，并能支持正在发生的活动。", symmetry: "在局部建立自然平衡，不追求僵硬的整体镜像。", interlock: "两个区域相互伸入，让连接处成为真正的空间。", contrast: "差异帮助人识别重点，同时服从于整体秩序。", gradients: "大小、光线、私密度和活动强度连续变化。", roughness: "允许适应、手作和真实生活留下不完全一致的痕迹。", echoes: "相似比例、色泽和轮廓在不同位置重新出现。", void: "一个安静、未被占满的中心，让周围关系更清晰。", calm: "减少多余表达，让空间显得自然、直接而安定。", whole: "空间、物件、使用者与环境不再彼此孤立。" } as Record<string, string>)[item.id]}</p></article>)}</div></section>)}
      </div>
    </main>
  )
}

function MethodPage() {
  return (
    <main className="page-shell subpage method-page">
      <header className="subpage-head"><div><p className="eyebrow"><span>Method</span> 可解释的居家设计智能体</p><h1>AI 负责组织复杂度，<br /><em>人保留最后的决定。</em></h1></div></header>
      <section className="method-flow">
        {[
          ["01", "理解居住对象", "先读取家庭结构、作息、身体条件与真实矛盾，不从流行风格开始。"],
          ["02", "诊断空间关系", "以 15 个 Living Structure 属性评估中心、边界、尺度、渐变与整体性。"],
          ["03", "调用专业工具", "将方案拆成安全检查、空间规划、材料原则、预算估算和风险门控。"],
          ["04", "交还人的判断", "采购、拆改、施工和正式报价必须经过家庭与专业人员确认。"],
        ].map(([index, title, body]) => <article key={index}><span>{index}</span><h2>{title}</h2><p>{body}</p></article>)}
      </section>
      <section className="transparency-panel"><div><p className="eyebrow"><span>Principle</span> 智能体边界</p><h2>它能提出有依据的方向，<br />但不会假装看见照片之外的事实。</h2></div><ul><li><Icon name="check" size={15} />每次任务生成独立执行编号与工具轨迹</li><li><Icon name="check" size={15} />无实景图时明确标记为房型基线回退</li><li><Icon name="check" size={15} />预算只给前期区间，不冒充供应商报价</li><li><Icon name="check" size={15} />上传图片不进入本地方案历史</li></ul></section>
    </main>
  )
}

export default function App() {
  const [tab, setTab] = useState<Tab>("studio")
  const [mode, setMode] = useState<ProjectMode>("home")
  const [persona, setPersona] = useState<PersonaId>("family")
  const [room, setRoom] = useState<RoomId>("living")
  const [walkScene, setWalkScene] = useState<WalkSceneId>("arcade")
  const [location, setLocation] = useState("永庆坊 · 恩宁路骑楼段")
  const [budget, setBudget] = useState<BudgetId>("balanced")
  const [selectedPriorities, setSelectedPriorities] = useState<PriorityId[]>(["storage", "light", "social"])
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
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("qigou-projects") || "[]")
      if (Array.isArray(saved)) setProjects(saved.slice(0, 8))
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
    localStorage.setItem("qigou-projects", JSON.stringify(updated))
  }

  const runAgent = async () => {
    if (mission.trim().length < 12) {
      setError("请至少用 12 个字描述真实的生活需求。")
      return
    }
    if (imageUrl && !imageAuthorized) {
      setError("请先确认空间图片的使用授权。")
      return
    }
    setError("")
    setResult(null)
    setRunning(true)
    setActiveStep(0)
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    for (let index = 0; index < runSteps.length; index += 1) {
      setActiveStep(index)
      await new Promise((resolve) => window.setTimeout(resolve, reduceMotion ? 35 : index === 2 ? 420 : 230))
    }
    const input: AgentInput = { mode, persona, room, walkScene, location: location.trim(), budget, priorities: selectedPriorities, mission: mission.trim(), hasImage: Boolean(imageUrl) }
    const next = createAgentResult(input)
    setRenderState({ status: "idle", progress: 0 })
    setResult(next)
    persistProject(next)
    setRunning(false)
    window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }), 60)
  }

  const openProject = (project: AgentResult) => {
    setMode(project.input.mode || "home")
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
      `栖构 Living Home｜居家活力更新方案`,
      `任务编号：${result.traceId}`,
      `对象：${result.input.mode === "walk" ? `${result.input.location} · ${walkScenes.find((item) => item.id === result.input.walkScene)?.name}` : selectedPersona.name}`,
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
    link.download = `栖构方案-${result.traceId}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const generateVisualization = async () => {
    if (!result || !imageUrl) return
    setRenderState({ status: "submitting", progress: 3 })
    try {
      const response = await fetch("/api/renovation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: buildVisualizationPrompt(result), image: imageUrl, size: "1536x1024", quality: "medium" }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.task_id) throw new Error(payload.error || "无法提交图像生成任务")
      const taskId = String(payload.task_id)
      setRenderState({ status: "processing", progress: 8, taskId })
      for (let attempt = 0; attempt < 72; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 5000))
        const statusResponse = await fetch(`/api/renovation/status?task_id=${encodeURIComponent(taskId)}`)
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
              {running ? <RunningAgent activeStep={activeStep} /> : result ? <ResultView result={result} sourceImage={imageUrl} renderState={renderState} onGenerate={generateVisualization} onReset={resetResult} onExport={exportResult} /> : <EmptyAgent mode={mode} persona={persona} walkScene={walkScene} location={location} />}
            </div>
          </div>
        </main>
      )}
      {tab === "projects" && <ProjectsPage projects={projects} onOpen={openProject} onClear={() => { setProjects([]); localStorage.removeItem("qigou-projects") }} />}
      {tab === "properties" && <PropertiesPage />}
      {tab === "method" && <MethodPage />}
      <footer className="site-footer"><div><BrandMark /><span><b>栖构 Living Home</b><small>让家适合正在生活的人</small></span></div><p>Living Structure + AI 城市创新研习营 · 概念原型</p><nav><button onClick={() => setTab("method")}>方法与边界</button><button onClick={() => setTab("properties")}>15 个属性</button></nav></footer>
    </div>
  )
}
