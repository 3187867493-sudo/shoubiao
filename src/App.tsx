import { useMemo, useState, type ReactNode } from "react"

type Screen = "splash" | "onboarding" | "watchConnect" | "home" | "conversation" | "multi" | "callout" | "service" | "history" | "profile" | "vibration" | "preferences" | "watchPreview"

type Tab = "home" | "conversation" | "service" | "profile"
type Priority = "P1" | "P2" | "P3" | "P4"
type IconName = "pulse" | "home" | "message" | "service" | "user" | "watch" | "battery" | "chevron" | "arrowLeft" | "arrowUpRight" | "volume" | "car" | "ticket" | "bell" | "music" | "mic" | "spark" | "history" | "settings" | "shield" | "type" | "vibrate" | "check" | "pause" | "play" | "refresh" | "send" | "close" | "eye" | "lock" | "summary"

const priorityMeta: Record<Priority, {
  label: string
  detail: string
  icon: IconName
}> = {
  P1: { label: "紧急", detail: "需要立即注意", icon: "bell" },
  P2: { label: "与我相关", detail: "需要及时回应", icon: "spark" },
  P3: { label: "当前对话", detail: "正在发生", icon: "message" },
  P4: { label: "环境氛围", detail: "可稍后查看", icon: "music" },
}

function Icon({
  name,
  size = 22,
  strokeWidth = 1.8,
}: {
  name: IconName
  size?: number
  strokeWidth?: number
}) {
  const paths: Record<IconName, ReactNode> = {
    pulse: (
      <>
        <path d="M3 12h3l1.7-4.5L11 17l2.7-10 2.1 5H21" />
        <circle cx="12" cy="12" r="9" opacity=".2" />
      </>
    ),
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5.5 9.5V21h13V9.5" />
        <path d="M9.5 21v-7h5v7" />
      </>
    ),
    message: (
      <>
        <path d="M21 14.5a4 4 0 0 1-4 4H9l-6 3v-14a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
    service: (
      <>
        <path d="M4 7h16v12H4z" />
        <path d="M7 7V4h10v3M8 12h8M8 15h5" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </>
    ),
    watch: (
      <>
        <rect x="6" y="5" width="12" height="14" rx="4" />
        <path d="M9 5V2h6v3M9 19v3h6v-3" />
        <path d="M9.5 10.5h5M9.5 13.5h3" />
      </>
    ),
    battery: (
      <>
        <rect x="3" y="7" width="17" height="10" rx="2" />
        <path d="M22 10v4" />
        <path d="M6 10h9v4H6z" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    arrowLeft: (
      <>
        <path d="m15 18-6-6 6-6" />
        <path d="M9 12h11" />
      </>
    ),
    arrowUpRight: (
      <>
        <path d="M7 17 17 7" />
        <path d="M8 7h9v9" />
      </>
    ),
    volume: (
      <>
        <path d="M5 10H2v4h3l5 4V6z" />
        <path d="M14 9a4 4 0 0 1 0 6M17 6a8 8 0 0 1 0 12" />
      </>
    ),
    car: (
      <>
        <path d="m4 15 1.5-6h13L20 15" />
        <path d="M3 15h18v4H3z" />
        <circle cx="7" cy="19" r="1.5" />
        <circle cx="17" cy="19" r="1.5" />
      </>
    ),
    ticket: (
      <>
        <path d="M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4z" />
        <path d="M12 8v8" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    music: (
      <>
        <path d="M9 18V5l10-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="16" cy="16" r="3" />
      </>
    ),
    mic: (
      <>
        <rect x="9" y="3" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 1.4 4.4L18 9l-4.6 1.6L12 15l-1.4-4.4L6 9l4.6-1.6z" />
        <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z" />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5M12 7v5l3 2" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 20 6v5c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    type: (
      <>
        <path d="M4 5h16M9 5v14M15 5v14M7 19h10" />
      </>
    ),
    vibrate: (
      <>
        <rect x="8" y="4" width="8" height="16" rx="2" />
        <path d="M4.5 8a6 6 0 0 0 0 8M2 6a9 9 0 0 0 0 12M19.5 8a6 6 0 0 1 0 8M22 6a9 9 0 0 1 0 12" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    pause: (
      <>
        <path d="M9 5v14M15 5v14" />
      </>
    ),
    play: <path d="m8 5 11 7-11 7z" />,
    refresh: (
      <>
        <path d="M20 7V3h-4" />
        <path d="M20 3a9 9 0 1 0 1 10" />
      </>
    ),
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4z" />
        <path d="M22 2 11 13" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    summary: (
      <>
        <path d="M5 4h14v16H5z" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

function PulseMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span
      className={`pulse-mark ${inverse ? "pulse-mark--inverse" : ""}`}
      aria-hidden="true"
    >
      <i />
      <i />
      <i />
    </span>
  )
}

function StatusBar({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={`status-bar ${inverse ? "status-bar--inverse" : ""}`}>
      <span>9:41</span>
      <span className="status-icons">
        <i /> <i /> <Icon name="battery" size={17} />
      </span>
    </div>
  )
}

function AppHeader({
  title,
  eyebrow,
  onBack,
  action,
}: {
  title: string
  eyebrow?: string
  onBack?: () => void
  action?: ReactNode
}) {
  return (
    <header className="app-header">
      <div className="app-header__side">
        {onBack ? (
          <button className="icon-button" onClick={onBack} aria-label="返回">
            <Icon name="arrowLeft" />
          </button>
        ) : (
          <PulseMark />
        )}
      </div>
      <div className="app-header__title">
        {eyebrow && <span>{eyebrow}</span>}
        <h1>{title}</h1>
      </div>
      <div className="app-header__side app-header__side--end">{action}</div>
    </header>
  )
}

function PriorityBadge({
  level,
  compact = false,
}: {
  level: Priority
  compact?: boolean
}) {
  const item = priorityMeta[level]
  return (
    <span
      className={`priority-badge priority-badge--${level.toLowerCase()} ${
        compact ? "priority-badge--compact" : ""
      }`}
    >
      <Icon name={item.icon} size={13} />
      {level} · {item.label}
    </span>
  )
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle ${checked ? "is-on" : ""}`}
      onClick={onChange}
    >
      <span />
    </button>
  )
}

function Page({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return <main className={`page ${className}`}>{children}</main>
}

function BottomNav({
  tab,
  onChange,
}: {
  tab: Tab
  onChange: (tab: Tab) => void
}) {
  const items: Array<{ id: Tab; label: string; icon: IconName }> = [
    { id: "home", label: "首页", icon: "home" },
    { id: "conversation", label: "对话", icon: "message" },
    { id: "service", label: "服务", icon: "service" },
    { id: "profile", label: "设置", icon: "user" },
  ]
  return (
    <nav className="bottom-nav" aria-label="主要导航">
      {items.map((item) => (
        <button
          key={item.id}
          className={tab === item.id ? "is-active" : ""}
          onClick={() => onChange(item.id)}
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

function SplashScreen({ onNext }: { onNext: () => void }) {
  return (
    <button className="splash" onClick={onNext} aria-label="进入声脉">
      <div className="splash__lattice" />
      <div className="splash__mark">
        <PulseMark inverse />
      </div>
      <div className="splash__copy">
        <span className="splash__eyebrow">声 · 触 · 行</span>
        <h1>声脉</h1>
        <p>SoundPulse</p>
        <div className="splash__rule" />
        <blockquote>
          把重要的声音，
          <br />
          变成触手可及的信息。
        </blockquote>
      </div>
      <span className="splash__hint">
        轻触进入 <Icon name="arrowUpRight" size={15} />
      </span>
    </button>
  )
}

function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState("deaf")
  const [fontSize, setFontSize] = useState("中")
  const [highContrast, setHighContrast] = useState(false)
  const [sounds, setSounds] = useState(["叫号与广播", "车辆鸣笛", "多人对话"])
  const titles = [
    ["先认识你的需要", "只选择真正需要被提醒的声音"],
    ["让信息更好读", "字号、对比度和节奏都可以调整"],
    ["声音留在设备上", "默认本地处理，不保存原始录音"],
  ]
  const soundOptions = [
    "叫号与广播",
    "车辆鸣笛",
    "警报提醒",
    "多人对话",
    "音乐表演",
    "生活提示",
  ]

  return (
    <Page className="onboarding-page">
      <StatusBar />
      <section className="onboarding-head">
        <div className="step-track">
          {[0, 1, 2].map((item) => (
            <span key={item} className={item <= step ? "is-active" : ""} />
          ))}
        </div>
        <span className="section-kicker">初次设置 · {step + 1}/3</span>
        <h1>{titles[step][0]}</h1>
        <p>{titles[step][1]}</p>
      </section>

      <section className="onboarding-body">
        {step === 0 && (
          <>
            <div className="choice-stack">
              {[
                ["deaf", "听障人士", "需要完整、稳定的信息辅助"],
                ["hard", "听力困难", "在复杂环境中需要重点提醒"],
                ["support", "陪伴者或工作人员", "协助建立更友好的沟通环境"],
              ].map(([id, label, detail]) => (
                <button
                  key={id}
                  onClick={() => setProfile(id)}
                  className={`choice-row ${
                    profile === id ? "is-selected" : ""
                  }`}
                >
                  <span className="choice-row__radio">
                    {profile === id && <i />}
                  </span>
                  <span>
                    <strong>{label}</strong>
                    <small>{detail}</small>
                  </span>
                </button>
              ))}
            </div>
            <div className="field-group">
              <span className="field-label">重点关注的声音</span>
              <div className="chip-grid">
                {soundOptions.map((sound) => (
                  <button
                    key={sound}
                    className={sounds.includes(sound) ? "is-selected" : ""}
                    onClick={() =>
                      setSounds((current) =>
                        current.includes(sound)
                          ? current.filter((item) => item !== sound)
                          : [...current, sound],
                      )
                    }
                  >
                    {sound}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div
              className={`caption-preview ${highContrast ? "is-contrast" : ""}`}
            >
              <div className="caption-preview__meta">
                <span className="speaker-glyph">工</span>
                <span>工作人员 · 右前方</span>
                <PriorityBadge level="P2" compact />
              </div>
              <p className={`font-${fontSize}`}>请到 18 号窗口办理。</p>
              <small>刚刚 · 识别置信度 96%</small>
            </div>
            <div className="setting-card">
              <div>
                <span className="field-label">字幕字号</span>
                <p>手表只显示关键句，手机保留完整内容。</p>
              </div>
              <div className="segmented">
                {["小", "中", "大"].map((size) => (
                  <button
                    key={size}
                    className={fontSize === size ? "is-active" : ""}
                    onClick={() => setFontSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-row">
              <div className="setting-row__icon">
                <Icon name="eye" />
              </div>
              <div>
                <strong>高对比显示</strong>
                <small>使用深色字幕底和更清晰的边界</small>
              </div>
              <Toggle
                checked={highContrast}
                onChange={() => setHighContrast(!highContrast)}
                label="高对比显示"
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="privacy-seal">
              <Icon name="shield" size={38} />
              <i />
            </div>
            <div className="privacy-copy">
              <h2>尊重声音，也尊重隐私</h2>
              <p>
                麦克风仅在你主动开启识别时工作。原始声音默认不上传、不留存。
              </p>
            </div>
            <div className="privacy-list">
              <div>
                <Icon name="lock" />
                <span>
                  <strong>优先本地处理</strong>
                  <small>语音仅用于即时识别</small>
                </span>
              </div>
              <div>
                <Icon name="history" />
                <span>
                  <strong>仅保存文字事件</strong>
                  <small>可随时清除历史记录</small>
                </span>
              </div>
              <div>
                <Icon name="pause" />
                <span>
                  <strong>一键暂停</strong>
                  <small>由你决定何时开始和结束</small>
                </span>
              </div>
            </div>
          </>
        )}
      </section>

      <footer className="sticky-action">
        {step > 0 && (
          <button className="text-action" onClick={() => setStep(step - 1)}>
            上一步
          </button>
        )}
        <button
          className="primary-action"
          onClick={() => (step < 2 ? setStep(step + 1) : onComplete())}
        >
          {step < 2 ? "继续" : "同意并继续"}
          <Icon name="chevron" size={18} />
        </button>
      </footer>
    </Page>
  )
}

function WatchConnectScreen({ onComplete }: { onComplete: () => void }) {
  const [status, setStatus] = useState<"idle" | "found" | "connected">("idle")
  const [tested, setTested] = useState(false)
  return (
    <Page>
      <StatusBar />
      <AppHeader title="连接智能手表" eyebrow="已有设备" />
      <section className="connect-hero">
        <div
          className={`watch-orbit ${
            status === "connected" ? "is-connected" : ""
          }`}
        >
          <span className="orbit orbit--one" />
          <span className="orbit orbit--two" />
          <div className="watch-device">
            <span>9:41</span>
            <Icon name={status === "connected" ? "check" : "pulse"} size={34} />
            <small>{status === "connected" ? "已连接" : "等待连接"}</small>
          </div>
        </div>
        <span className="section-kicker">无需购买新设备</span>
        <h2>
          {status === "connected"
            ? "手表已经可以接收提醒"
            : "使用你正在佩戴的手表"}
        </h2>
        <p>声脉通过系统通知与配套应用发送震动、图标和一行短字幕。</p>
      </section>

      <section className="device-card section-frame">
        <div className="device-card__icon">
          <Icon name="watch" size={28} />
        </div>
        <div>
          <span className="field-label">附近设备</span>
          <strong>{status === "idle" ? "正在搜索…" : "Lin 的智能手表"}</strong>
          <small>
            {status === "connected"
              ? "连接稳定 · 电量 82%"
              : "45 mm · 已配对手机"}
          </small>
        </div>
        {status === "idle" && (
          <button className="small-action" onClick={() => setStatus("found")}>
            模拟发现
          </button>
        )}
        {status === "found" && (
          <button
            className="small-action small-action--solid"
            onClick={() => setStatus("connected")}
          >
            连接
          </button>
        )}
        {status === "connected" && (
          <span className="connected-dot">
            <i />
            在线
          </span>
        )}
      </section>

      {status === "connected" && (
        <section className="connection-settings">
          <button
            className={`vibration-test ${tested ? "is-tested" : ""}`}
            onClick={() => setTested(true)}
          >
            <span className="vibration-test__icon">
              <Icon name="vibrate" />
            </span>
            <span>
              <strong>{tested ? "震动测试完成" : "测试一次腕上震动"}</strong>
              <small>
                {tested ? "手表反馈正常" : "确认你能舒适地感受到提醒"}
              </small>
            </span>
            <Icon name={tested ? "check" : "chevron"} />
          </button>
          <div className="quiet-note">
            <span>说明</span>
            <p>
              不同品牌手表支持的震动类型可能不同，声脉会自动使用设备允许的提醒方式。
            </p>
          </div>
        </section>
      )}

      <footer className="sticky-action">
        <button
          className="primary-action"
          disabled={status !== "connected"}
          onClick={onComplete}
        >
          进入声脉
          <Icon name="chevron" size={18} />
        </button>
      </footer>
    </Page>
  )
}

function HomeScreen({
  onNavigate,
  listening,
  setListening,
  onEmergency,
}: {
  onNavigate: (screen: Screen) => void
  listening: boolean
  setListening: (value: boolean) => void
  onEmergency: () => void
}) {
  const [mode, setMode] = useState("公共场所")
  return (
    <Page className="home-page">
      <StatusBar />
      <header className="home-header">
        <div className="brand-lockup">
          <PulseMark />
          <span>
            <strong>声脉</strong>
            <small>SoundPulse</small>
          </span>
        </div>
        <button
          className="watch-status"
          onClick={() => onNavigate("watchPreview")}
        >
          <Icon name="watch" size={18} />
          <span>
            <strong>已连接</strong>
            <small>82%</small>
          </span>
          <i />
        </button>
      </header>

      <section className="mode-strip" aria-label="场景模式">
        {["公共场所", "交通", "医院", "餐厅"].map((item) => (
          <button
            key={item}
            className={mode === item ? "is-active" : ""}
            onClick={() => setMode(item)}
          >
            {item}
          </button>
        ))}
      </section>

      <section
        className={`focus-card section-frame ${
          listening ? "is-listening" : ""
        }`}
      >
        <div className="focus-card__top">
          <PriorityBadge level="P2" />
          <span className="live-state">
            <i />
            {listening ? "正在识别" : "识别已暂停"}
          </span>
        </div>
        <div className="direction-orb">
          <span className="direction-orb__arrow">↗</span>
          <i />
          <i />
        </div>
        <div className="focus-card__copy">
          <div className="speaker-line">
            <span className="speaker-glyph">工</span>
            <span>右前方 · 工作人员</span>
          </div>
          <h2>请到 18 号窗口办理。</h2>
          <p>2 秒前 · 与你直接相关</p>
        </div>
        <div className="focus-card__actions">
          <button onClick={() => onNavigate("conversation")}>
            查看完整字幕
          </button>
          <button
            className="round-action"
            onClick={() => setListening(!listening)}
            aria-label={listening ? "暂停识别" : "开始识别"}
          >
            <Icon name={listening ? "pause" : "play"} />
          </button>
        </div>
      </section>

      <section className="quick-row">
        <button onClick={() => onNavigate("multi")}>
          <span className="quick-row__icon quick-row__icon--blue">
            <Icon name="message" />
          </span>
          <span>
            <strong>多人对话</strong>
            <small>区分当前讲者</small>
          </span>
          <Icon name="chevron" />
        </button>
        <button onClick={() => onNavigate("callout")}>
          <span className="quick-row__icon quick-row__icon--gold">
            <Icon name="ticket" />
          </span>
          <span>
            <strong>叫号提醒</strong>
            <small>不错过窗口通知</small>
          </span>
          <Icon name="chevron" />
        </button>
      </section>

      <section className="timeline-section">
        <div className="section-title">
          <span>
            <small>最近发生</small>
            <h3>声音时间流</h3>
          </span>
          <button onClick={() => onNavigate("history")}>全部记录</button>
        </div>
        <div className="event-timeline">
          <button onClick={() => onNavigate("conversation")}>
            <span className="timeline-mark timeline-mark--p3">
              <Icon name="message" size={17} />
            </span>
            <span>
              <strong>左侧同伴正在说话</strong>
              <small>“我们先去售票处……” · 1 分钟前</small>
            </span>
            <PriorityBadge level="P3" compact />
          </button>
          <button onClick={onEmergency}>
            <span className="timeline-mark timeline-mark--p1">
              <Icon name="car" size={17} />
            </span>
            <span>
              <strong>后方检测到车辆鸣笛</strong>
              <small>建议注意周围环境 · 4 分钟前</small>
            </span>
            <PriorityBadge level="P1" compact />
          </button>
          <button>
            <span className="timeline-mark timeline-mark--p4">
              <Icon name="music" size={17} />
            </span>
            <span>
              <strong>附近表演音乐开始</strong>
              <small>节奏轻快 · 12 分钟前</small>
            </span>
            <PriorityBadge level="P4" compact />
          </button>
        </div>
      </section>
    </Page>
  )
}

function ConversationScreen({ onBack }: { onBack?: () => void }) {
  const [paused, setPaused] = useState(false)
  const [feedback, setFeedback] = useState<"" | "yes" | "no">("")
  return (
    <Page>
      <StatusBar />
      <AppHeader
        title="实时对话"
        eyebrow="当前场景"
        onBack={onBack}
        action={
          <span className="listening-indicator">
            <i />
            {paused ? "已暂停" : "识别中"}
          </span>
        }
      />
      <section className="conversation-stage">
        <div className="speaker-compass">
          <span className="speaker-compass__person">工</span>
          <i className="speaker-compass__arc" />
          <span className="speaker-compass__direction">右前方</span>
        </div>
        <PriorityBadge level="P3" />
        <h2>“请把身份证放在感应区，然后看向摄像头。”</h2>
        <div className="conversation-meta">
          <span>工作人员</span>
          <i />
          <span>刚刚</span>
          <i />
          <span>置信度 96%</span>
        </div>
      </section>
      <section className="transcript-stack">
        <div className="transcript-item is-current">
          <span className="speaker-glyph">工</span>
          <div>
            <strong>工作人员</strong>
            <p>请把身份证放在感应区，然后看向摄像头。</p>
          </div>
          <small>现在</small>
        </div>
        <div className="transcript-item">
          <span className="speaker-glyph speaker-glyph--self">我</span>
          <div>
            <strong>你</strong>
            <p>好的，请稍等，我正在确认。</p>
          </div>
          <small>8 秒</small>
        </div>
        <div className="transcript-item is-muted">
          <span className="speaker-glyph">工</span>
          <div>
            <strong>工作人员</strong>
            <p>办理过程大约需要三分钟。</p>
          </div>
          <small>16 秒</small>
        </div>
      </section>
      <section className="confidence-card">
        <div>
          <span>这句识别准确吗？</span>
          <small>你的反馈只用于改善文字识别。</small>
        </div>
        <div>
          <button
            className={feedback === "yes" ? "is-active" : ""}
            onClick={() => setFeedback("yes")}
          >
            <Icon name="check" />
            准确
          </button>
          <button
            className={feedback === "no" ? "is-active" : ""}
            onClick={() => setFeedback("no")}
          >
            <Icon name="refresh" />
            有误
          </button>
        </div>
      </section>
      <footer className="conversation-controls">
        <button>
          <Icon name="history" />
          <span>上一句</span>
        </button>
        <button
          className="conversation-controls__main"
          onClick={() => setPaused(!paused)}
        >
          <Icon name={paused ? "play" : "pause"} />
          <span>{paused ? "继续" : "暂停"}</span>
        </button>
        <button>
          <Icon name="summary" />
          <span>总结</span>
        </button>
      </footer>
    </Page>
  )
}

function MultiPersonScreen({ onBack }: { onBack: () => void }) {
  const [active, setActive] = useState(1)
  const [summary, setSummary] = useState(false)
  const speakers = [
    {
      name: "讲者 1",
      direction: "左侧",
      glyph: "一",
      text: "我们先去售票处。",
      tone: "blue",
    },
    {
      name: "讲者 2",
      direction: "正前方",
      glyph: "二",
      text: "买完票以后，在入口右侧集合。",
      tone: "jade",
    },
    {
      name: "讲者 3",
      direction: "右侧",
      glyph: "三",
      text: "我可以帮大家看一下开放时间。",
      tone: "gold",
    },
  ]
  const current = speakers[active]
  return (
    <Page>
      <StatusBar />
      <AppHeader
        title="多人对话"
        eyebrow="3 位讲者"
        onBack={onBack}
        action={
          <button
            className="header-text-action"
            onClick={() => setSummary(!summary)}
          >
            一句话总结
          </button>
        }
      />
      {summary ? (
        <section className="summary-card section-frame">
          <span className="summary-card__seal">
            <Icon name="summary" />
          </span>
          <small>AI 场景摘要</small>
          <h2>大家决定先去售票处，购票后在入口右侧集合。</h2>
          <p>开放时间仍待确认。</p>
          <button onClick={() => setSummary(false)}>返回实时对话</button>
        </section>
      ) : (
        <>
          <section className="multi-focus">
            <div className="multi-radar">
              <span
                className={`speaker-node speaker-node--left ${
                  active === 0 ? "is-active" : ""
                }`}
              >
                一
              </span>
              <span
                className={`speaker-node speaker-node--top ${
                  active === 1 ? "is-active" : ""
                }`}
              >
                二
              </span>
              <span
                className={`speaker-node speaker-node--right ${
                  active === 2 ? "is-active" : ""
                }`}
              >
                三
              </span>
              <i />
              <b />
            </div>
            <span className="section-kicker">
              {current.direction} · {current.name}
            </span>
            <h2>“{current.text}”</h2>
            <p>轻触下方讲者可锁定字幕来源</p>
          </section>
          <section className="speaker-list">
            {speakers.map((speaker, index) => (
              <button
                key={speaker.name}
                className={`speaker-card speaker-card--${speaker.tone} ${
                  active === index ? "is-active" : ""
                }`}
                onClick={() => setActive(index)}
              >
                <span className="speaker-card__glyph">{speaker.glyph}</span>
                <span>
                  <strong>
                    {speaker.name}
                    <small>{speaker.direction}</small>
                  </strong>
                  <p>{speaker.text}</p>
                </span>
                {active === index ? (
                  <span className="speaker-card__live">
                    <i />
                    当前
                  </span>
                ) : (
                  <Icon name="chevron" />
                )}
              </button>
            ))}
          </section>
        </>
      )}
    </Page>
  )
}

function CalloutScreen({ onBack }: { onBack: () => void }) {
  const [confirmed, setConfirmed] = useState(false)
  return (
    <Page className="callout-page">
      <StatusBar />
      <AppHeader title="叫号提醒" eyebrow="公共服务" onBack={onBack} />
      <section
        className={`ticket-focus section-frame ${
          confirmed ? "is-confirmed" : ""
        }`}
      >
        <span className="ticket-focus__icon">
          <Icon name={confirmed ? "check" : "ticket"} size={30} />
        </span>
        <span className="section-kicker">
          {confirmed ? "已确认" : "轮到你了"}
        </span>
        <div className="ticket-number">
          A<span>018</span>
        </div>
        <h2>{confirmed ? "已在手表上标记完成" : "请前往 18 号窗口"}</h2>
        <p>服务大厅 · 右侧区域 · 10 秒前</p>
        <div className="haptic-pattern">
          <span />
          <span />
          <span />
          <i>双次震动</i>
        </div>
      </section>
      <section className="route-note">
        <span className="route-note__number">18</span>
        <div>
          <strong>18 号窗口</strong>
          <small>从当前位置向右前方约 12 米</small>
        </div>
        <span className="route-note__arrow">↗</span>
      </section>
      <footer className="sticky-action sticky-action--split">
        <button className="secondary-action" onClick={onBack}>
          稍后处理
        </button>
        <button className="primary-action" onClick={() => setConfirmed(true)}>
          {confirmed ? "已完成" : "确认收到"}
          <Icon name="check" />
        </button>
      </footer>
    </Page>
  )
}

function ServiceScreen() {
  const [selected, setSelected] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const quickReplies = [
    "请面对我说话",
    "请再说一遍",
    "请提供文字说明",
    "我正在阅读字幕，请稍等",
  ]
  return (
    <Page>
      <StatusBar />
      <AppHeader
        title="公共服务"
        eyebrow="双向沟通"
        action={
          <span className="listening-indicator">
            <i />
            识别中
          </span>
        }
      />
      <section className="service-transcript section-frame">
        <div className="service-transcript__top">
          <span className="speaker-glyph">工</span>
          <span>
            <strong>工作人员</strong>
            <small>柜台 · 正前方</small>
          </span>
          <PriorityBadge level="P3" compact />
        </div>
        <blockquote>“请问您需要办理哪一项业务？”</blockquote>
        <button>
          <Icon name="refresh" size={17} />
          重新识别
        </button>
      </section>
      <section className="quick-reply-section">
        <div className="section-title">
          <span>
            <small>快捷回应</small>
            <h3>选择一句展示给对方</h3>
          </span>
        </div>
        <div className="quick-replies">
          {quickReplies.map((reply, index) => (
            <button key={reply} onClick={() => setSelected(reply)}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{reply}</strong>
              <Icon name="arrowUpRight" />
            </button>
          ))}
        </div>
      </section>
      <section className="compose-bar">
        <input
          aria-label="输入自定义回复"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="输入自定义回复…"
        />
        <button
          disabled={!input.trim()}
          onClick={() => {
            setSelected(input)
            setInput("")
          }}
          aria-label="发送"
        >
          <Icon name="send" />
        </button>
      </section>
      {selected && (
        <div
          className="large-text-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="大字展示"
        >
          <button
            className="large-text-overlay__close"
            onClick={() => setSelected(null)}
            aria-label="关闭"
          >
            <Icon name="close" />
          </button>
          <span>请向工作人员展示</span>
          <p>{selected}</p>
          <small>轻触屏幕关闭</small>
        </div>
      )}
    </Page>
  )
}

function HistoryScreen({ onBack }: { onBack?: () => void }) {
  const [filter, setFilter] = useState("全部")
  const events = [
    {
      time: "14:32",
      level: "P2" as Priority,
      title: "18 号窗口叫号",
      detail: "服务大厅 · 已确认",
      icon: "ticket" as IconName,
    },
    {
      time: "14:26",
      level: "P3" as Priority,
      title: "工作人员说明办理步骤",
      detail: "共 4 句 · 已生成摘要",
      icon: "message" as IconName,
    },
    {
      time: "14:17",
      level: "P1" as Priority,
      title: "后方车辆鸣笛",
      detail: "持续 2 秒 · 已提醒手表",
      icon: "car" as IconName,
    },
    {
      time: "14:05",
      level: "P4" as Priority,
      title: "附近音乐表演开始",
      detail: "轻快节奏 · 约 92 BPM",
      icon: "music" as IconName,
    },
  ]
  const visible =
    filter === "全部" ? events : events.filter((item) => item.level === filter)
  return (
    <Page>
      <StatusBar />
      <AppHeader
        title="声音记录"
        eyebrow="今天"
        onBack={onBack}
        action={<button className="header-text-action">管理</button>}
      />
      <section className="history-overview">
        <div>
          <small>今日已整理</small>
          <strong>12</strong>
          <span>条重要信息</span>
        </div>
        <div className="history-overview__rings">
          <i />
          <i />
          <i />
        </div>
      </section>
      <section className="filter-strip">
        {["全部", "P1", "P2", "P3", "P4"].map((item) => (
          <button
            key={item}
            className={filter === item ? "is-active" : ""}
            onClick={() => setFilter(item)}
          >
            {item === "全部"
              ? item
              : `${item} ${priorityMeta[(item as Priority)].label}`}
          </button>
        ))}
      </section>
      <section className="history-list">
        {visible.map((event) => (
          <article key={event.time + event.title}>
            <time>{event.time}</time>
            <span
              className={`history-list__icon history-list__icon--${event.level.toLowerCase()}`}
            >
              <Icon name={event.icon} />
            </span>
            <div>
              <PriorityBadge level={event.level} compact />
              <h3>{event.title}</h3>
              <p>{event.detail}</p>
            </div>
            <Icon name="chevron" />
          </article>
        ))}
      </section>
    </Page>
  )
}

function ProfileScreen({
  onNavigate,
}: {
  onNavigate: (screen: Screen) => void
}) {
  return (
    <Page>
      <StatusBar />
      <AppHeader title="设备与设置" eyebrow="我的声脉" />
      <section className="profile-intro section-frame">
        <span className="profile-intro__seal">林</span>
        <div>
          <span className="section-kicker">下午好</span>
          <h2>让提醒保持清楚、克制。</h2>
          <p>已使用声脉 3 天 · 今日识别 12 条重要信息</p>
        </div>
      </section>
      <button
        className="connected-watch-card"
        onClick={() => onNavigate("watchPreview")}
      >
        <span className="connected-watch-card__device">
          <Icon name="watch" size={28} />
        </span>
        <span>
          <small>已连接设备</small>
          <strong>Lin 的智能手表</strong>
          <em>
            <i />
            连接稳定 · 电量 82%
          </em>
        </span>
        <Icon name="chevron" />
      </button>
      <section className="settings-list">
        <button onClick={() => onNavigate("vibration")}>
          <span>
            <Icon name="vibrate" />
          </span>
          <div>
            <strong>震动与优先级</strong>
            <small>设置四级声音提醒方式</small>
          </div>
          <Icon name="chevron" />
        </button>
        <button onClick={() => onNavigate("preferences")}>
          <span>
            <Icon name="type" />
          </span>
          <div>
            <strong>字幕与显示</strong>
            <small>字号、对比度和记录时长</small>
          </div>
          <Icon name="chevron" />
        </button>
        <button onClick={() => onNavigate("history")}>
          <span>
            <Icon name="history" />
          </span>
          <div>
            <strong>声音记录</strong>
            <small>查看或清除识别内容</small>
          </div>
          <Icon name="chevron" />
        </button>
        <button>
          <span>
            <Icon name="shield" />
          </span>
          <div>
            <strong>隐私与权限</strong>
            <small>麦克风和本地处理说明</small>
          </div>
          <Icon name="chevron" />
        </button>
      </section>
      <footer className="profile-footer">
        <PulseMark />
        <span>声脉 SoundPulse · Prototype 1.0</span>
        <small>为更平等的公共信息而设计</small>
      </footer>
    </Page>
  )
}

function VibrationScreen({ onBack }: { onBack: () => void }) {
  const [strength, setStrength] = useState("标准")
  const [enabled, setEnabled] = useState<Record<Priority, boolean>>({
    P1: true,
    P2: true,
    P3: true,
    P4: false,
  })
  return (
    <Page>
      <StatusBar />
      <AppHeader title="震动与优先级" eyebrow="手表提醒" onBack={onBack} />
      <section className="vibration-hero">
        <span className="vibration-hero__icon">
          <Icon name="vibrate" size={34} />
        </span>
        <div>
          <span className="section-kicker">腕上反馈</span>
          <h2>
            让每一级提醒
            <br />
            有自己的节奏。
          </h2>
        </div>
        <button>测试</button>
      </section>
      <section className="setting-card">
        <div>
          <span className="field-label">整体震动强度</span>
          <p>紧急提醒始终比所选强度高一级。</p>
        </div>
        <div className="segmented">
          {["轻柔", "标准", "明显"].map((item) => (
            <button
              key={item}
              className={strength === item ? "is-active" : ""}
              onClick={() => setStrength(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>
      <section className="priority-settings">
        <div className="section-title">
          <span>
            <small>信息层级</small>
            <h3>推送到手表的声音</h3>
          </span>
        </div>
        {(["P1", "P2", "P3", "P4"] as Priority[]).map((level, index) => (
          <div
            className={`priority-setting priority-setting--${level.toLowerCase()}`}
            key={level}
          >
            <span className="priority-setting__index">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>
              <PriorityBadge level={level} compact />
              <strong>{priorityMeta[level].detail}</strong>
              <small>
                {level === "P1"
                  ? "三次强震动"
                  : level === "P2"
                    ? "两次清晰震动"
                    : level === "P3"
                      ? "一次轻震动"
                      : "柔和节奏震动"}
              </small>
            </span>
            <div className="pattern-mini">
              <i />
              <i />
              <i />
            </div>
            <Toggle
              checked={enabled[level]}
              onChange={() =>
                setEnabled({ ...enabled, [level]: !enabled[level] })
              }
              label={`${level} 提醒`}
            />
          </div>
        ))}
      </section>
    </Page>
  )
}

function PreferencesScreen({ onBack }: { onBack: () => void }) {
  const [size, setSize] = useState("中")
  const [contrast, setContrast] = useState(false)
  const [motion, setMotion] = useState(true)
  const [retention, setRetention] = useState("24 小时")
  return (
    <Page>
      <StatusBar />
      <AppHeader title="字幕与显示" eyebrow="个性化" onBack={onBack} />
      <section
        className={`preference-preview ${contrast ? "is-contrast" : ""}`}
      >
        <small>字幕预览</small>
        <p className={`font-${size}`}>入口右侧集合，开放时间到下午五点。</p>
        <span>讲者 2 · 正前方</span>
      </section>
      <section className="setting-card">
        <div>
          <span className="field-label">字幕字号</span>
          <p>同时影响手机和手表的关键信息。</p>
        </div>
        <div className="segmented">
          {["小", "中", "大"].map((item) => (
            <button
              key={item}
              className={size === item ? "is-active" : ""}
              onClick={() => setSize(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>
      <section className="setting-list-plain">
        <div>
          <span>
            <strong>高对比显示</strong>
            <small>深色背景与白色字幕</small>
          </span>
          <Toggle
            checked={contrast}
            onChange={() => setContrast(!contrast)}
            label="高对比显示"
          />
        </div>
        <div>
          <span>
            <strong>减少动态效果</strong>
            <small>关闭脉冲和位移动画</small>
          </span>
          <Toggle
            checked={motion}
            onChange={() => setMotion(!motion)}
            label="减少动态效果"
          />
        </div>
      </section>
      <section className="setting-card">
        <div>
          <span className="field-label">文字记录保留时间</span>
          <p>到期后自动从本机删除。</p>
        </div>
        <div className="retention-options">
          {["不保存", "24 小时", "7 天"].map((item) => (
            <button
              key={item}
              className={retention === item ? "is-active" : ""}
              onClick={() => setRetention(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>
    </Page>
  )
}

function WatchPreviewScreen({ onBack }: { onBack: () => void }) {
  const states = [
    {
      level: "P2",
      icon: "ticket",
      title: "A018",
      subtitle: "请前往 18 号窗口",
      action: "确认",
      tone: "gold",
    },
    {
      level: "P3",
      icon: "message",
      title: "讲者 2",
      subtitle: "入口右侧集合",
      action: "完整字幕",
      tone: "blue",
    },
    {
      level: "P1",
      icon: "car",
      title: "车辆鸣笛",
      subtitle: "后方 · 请注意",
      action: "已知晓",
      tone: "red",
    },
    {
      level: "P4",
      icon: "music",
      title: "轻快节奏",
      subtitle: "附近表演开始",
      action: "感受节拍",
      tone: "purple",
    },
  ]
  return (
    <Page>
      <StatusBar />
      <AppHeader title="手表界面" eyebrow="深色 OLED" onBack={onBack} />
      <section className="watch-preview-intro">
        <span className="section-kicker">只显示最重要的一件事</span>
        <h2>
          腕上一瞥，
          <br />
          不打断眼前的生活。
        </h2>
        <p>完整字幕和历史信息始终留在手机端。</p>
      </section>
      <section className="watch-grid">
        {states.map((state) => (
          <article
            className={`watch-mock watch-mock--${state.tone}`}
            key={state.title}
          >
            <div className="watch-mock__screen">
              <header>
                <Icon name={state.icon as IconName} />
                <span>{state.level}</span>
              </header>
              <strong>{state.title}</strong>
              <p>{state.subtitle}</p>
              <div className="watch-haptic">
                <i />
                <i />
                <i />
              </div>
              <button>{state.action}</button>
            </div>
            <span>
              {state.level === "P1"
                ? "紧急警示"
                : state.level === "P2"
                  ? "叫号提醒"
                  : state.level === "P3"
                    ? "当前对话"
                    : "音乐节奏"}
            </span>
          </article>
        ))}
      </section>
      <section className="watch-principle section-frame">
        <PulseMark />
        <div>
          <strong>手表负责提醒，手机负责理解。</strong>
          <p>声脉不会把整段字幕塞进小屏幕，也不会持续打扰用户。</p>
        </div>
      </section>
    </Page>
  )
}

function EmergencyOverlay({ onDismiss }: { onDismiss: () => void }) {
  const [confirmed, setConfirmed] = useState(false)
  return (
    <div
      className={`emergency-overlay ${confirmed ? "is-confirmed" : ""}`}
      role="alertdialog"
      aria-modal="true"
      aria-label="紧急提醒"
    >
      <StatusBar inverse />
      <div className="emergency-overlay__pattern" />
      <section>
        <div className="emergency-icon">
          <Icon name={confirmed ? "check" : "car"} size={42} />
        </div>
        <PriorityBadge level="P1" />
        <span className="section-kicker">
          {confirmed ? "提醒已确认" : "后方 · 车辆鸣笛"}
        </span>
        <h2>{confirmed ? "请继续留意周围环境" : "请立即注意后方"}</h2>
        <p>
          {confirmed
            ? "手表已停止震动。"
            : "检测到持续 2 秒的车辆鸣笛，距离可能较近。"}
        </p>
        <div className="emergency-haptic">
          <i />
          <i />
          <i />
          <span>三次强震动</span>
        </div>
      </section>
      <footer>
        <button
          className="emergency-primary"
          onClick={() => (confirmed ? onDismiss() : setConfirmed(true))}
        >
          {confirmed ? "返回首页" : "我已注意"}
          <Icon name="check" />
        </button>
        {!confirmed && (
          <button className="emergency-secondary" onClick={onDismiss}>
            关闭提醒
          </button>
        )}
      </footer>
    </div>
  )
}

export default function App() {
  const initialScreen = (() => {
    const candidate = new URLSearchParams(window.location.search).get(
      "screen",
    ) as Screen | null
    const allowed: Screen[] = [
      "splash",
      "onboarding",
      "watchConnect",
      "home",
      "conversation",
      "multi",
      "callout",
      "service",
      "history",
      "profile",
      "vibration",
      "preferences",
      "watchPreview",
    ]
    return candidate && allowed.includes(candidate) ? candidate : "splash"
  })()
  const [screen, setScreen] = useState<Screen>(initialScreen)
  const [tab, setTab] = useState<Tab>(
    initialScreen === "conversation" ||
      initialScreen === "service" ||
      initialScreen === "profile"
      ? initialScreen
      : "home",
  )
  const [listening, setListening] = useState(true)
  const [emergency, setEmergency] = useState(false)

  const tabToScreen: Record<Tab, Screen> = useMemo(
    () => ({
      home: "home",
      conversation: "conversation",
      service: "service",
      profile: "profile",
    }),
    [],
  )
  const tabScreens: Screen[] = ["home", "conversation", "service", "profile"]
  const navigate = (next: Screen) => {
    setScreen(next)
    const entry = Object.entries(tabToScreen).find(
      ([, value]) => value === next,
    )
    if (entry) setTab(entry[0] as Tab)
  }

  const content = (() => {
    switch (screen) {
      case "splash":
        return <SplashScreen onNext={() => setScreen("onboarding")} />
      case "onboarding":
        return <OnboardingScreen onComplete={() => setScreen("watchConnect")} />
      case "watchConnect":
        return <WatchConnectScreen onComplete={() => navigate("home")} />
      case "home":
        return (
          <HomeScreen
            onNavigate={navigate}
            listening={listening}
            setListening={setListening}
            onEmergency={() => setEmergency(true)}
          />
        )
      case "conversation":
        return <ConversationScreen />
      case "multi":
        return <MultiPersonScreen onBack={() => navigate("home")} />
      case "callout":
        return <CalloutScreen onBack={() => navigate("home")} />
      case "service":
        return <ServiceScreen />
      case "history":
        return <HistoryScreen onBack={() => navigate(tab)} />
      case "profile":
        return <ProfileScreen onNavigate={navigate} />
      case "vibration":
        return <VibrationScreen onBack={() => navigate("profile")} />
      case "preferences":
        return <PreferencesScreen onBack={() => navigate("profile")} />
      case "watchPreview":
        return (
          <WatchPreviewScreen
            onBack={() =>
              navigate(tabScreens.includes(screen) ? screen : "profile")
            }
          />
        )
      default:
        return null
    }
  })()

  return (
    <div className="prototype-stage">
      <div className="ambient-copy" aria-hidden="true">
        <span>Living Structure + AI</span>
        <strong>
          声有层级，
          <br />
          信息有中心。
        </strong>
        <small>SoundPulse · Inclusive wearable experience</small>
      </div>
      <div className="phone-shell">
        <div className="phone-island" />
        {emergency ? (
          <EmergencyOverlay onDismiss={() => setEmergency(false)} />
        ) : (
          content
        )}
        {!emergency && tabScreens.includes(screen) && (
          <BottomNav
            tab={tab}
            onChange={(next) => {
              setTab(next)
              setScreen(tabToScreen[next])
            }}
          />
        )}
      </div>
    </div>
  )
}
