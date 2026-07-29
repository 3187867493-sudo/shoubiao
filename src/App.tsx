import { useState } from 'react'

// ─── Design Tokens ───────────────────────────────────────────────────────────
const C = {
  bg: '#F4F1EC',
  card: '#FFFFFF',
  primary: '#1B4D3E',
  primaryMid: '#2D6A4F',
  mint: '#52B788',
  mintLight: '#D8F3DC',
  orange: '#E76F51',
  orangeLight: '#FEF0E7',
  red: '#D62828',
  redLight: '#FDEDEC',
  muted: '#8BA898',
  mutedLight: '#EEF5F0',
  text: '#1A2E22',
  textMid: '#4A6B57',
  textMuted: '#8BA898',
  border: 'rgba(27,77,62,0.12)',
  borderMid: 'rgba(27,77,62,0.22)',
}

type Screen =
  | 'splash' | 'onboarding' | 'watchConnect'
  | 'hear' | 'realtime' | 'multi' | 'callout'
  | 'communicate' | 'record' | 'profile'
  | 'vibSettings' | 'personalSettings' | 'watchPreview'

type Tab = 'hear' | 'communicate' | 'record' | 'profile'

// ─── Shared Components ────────────────────────────────────────────────────────

function StatusBar({ light }: { light?: boolean }) {
  const col = light ? 'rgba(255,255,255,0.8)' : C.textMuted
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 24px 6px', fontSize: 12, fontWeight: 600, color: col, flexShrink: 0,
    }}>
      <span>9:41</span>
      <span style={{ letterSpacing: 1 }}>●●● WiFi 🔋</span>
    </div>
  )
}

function NavBar({ title, onBack, light }: { title: string; onBack?: () => void; light?: boolean }) {
  const col = light ? 'white' : C.text
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '6px 20px 12px', flexShrink: 0 }}>
      {onBack && (
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: col,
          fontSize: 26, marginRight: 6, padding: 0, lineHeight: 1, opacity: 0.8,
        }}>‹</button>
      )}
      <span style={{ fontSize: 17, fontWeight: 700, color: col }}>{title}</span>
    </div>
  )
}

function BottomNav({ tab, setTab, setScreen }: {
  tab: Tab; setTab: (t: Tab) => void; setScreen: (s: Screen) => void
}) {
  const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
    {
      id: 'hear', label: '听见',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width={22} height={22} stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M2 12h2" /><path d="M6 8v8" /><path d="M10 5v14" />
          <path d="M14 8v8" /><path d="M18 10v4" /><path d="M22 12h-2" />
        </svg>
      ),
    },
    {
      id: 'communicate', label: '沟通',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width={22} height={22} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      id: 'record', label: '记录',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width={22} height={22} stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      id: 'profile', label: '我的',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width={22} height={22} stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ]
  const screenMap: Record<Tab, Screen> = {
    hear: 'hear', communicate: 'communicate', record: 'record', profile: 'profile',
  }
  return (
    <div style={{
      display: 'flex', borderTop: `1px solid ${C.border}`,
      background: 'rgba(244,241,236,0.97)', backdropFilter: 'blur(16px)',
      paddingBottom: 24, flexShrink: 0,
    }}>
      {tabs.map(t => (
        <button key={t.id}
          onClick={() => { setTab(t.id); setScreen(screenMap[t.id]) }}
          style={{
            flex: 1, padding: '10px 0 0', border: 'none', background: 'none',
            cursor: 'pointer', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 3,
            color: tab === t.id ? C.primary : C.textMuted,
            transition: 'color 0.15s',
          }}>
          {t.icon}
          <span style={{ fontSize: 10, fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</span>
        </button>
      ))}
    </div>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{
      width: 44, height: 26, borderRadius: 13,
      background: on ? C.primary : '#D1D8D4',
      position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s',
    }}>
      <div style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 20, height: 20, borderRadius: '50%', background: 'white',
        transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
      }} />
    </div>
  )
}

function PBadge({ level }: { level: 'P1' | 'P2' | 'P3' | 'P4' }) {
  const cfg = {
    P1: { bg: C.red, label: 'P1 紧急' },
    P2: { bg: C.orange, label: 'P2 重要' },
    P3: { bg: C.mint, label: 'P3 对话' },
    P4: { bg: C.muted, label: 'P4 环境' },
  }[level]
  return (
    <span style={{
      background: cfg.bg, color: 'white', fontSize: 9, fontWeight: 700,
      padding: '2px 7px', borderRadius: 4, letterSpacing: 0.3,
    }}>{cfg.label}</span>
  )
}

// ─── Screens ──────────────────────────────────────────────────────────────────

function SplashScreen({ onNext }: { onNext: () => void }) {
  return (
    <div onClick={onNext} style={{
      flex: 1, background: C.primary, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '0 48px',
    }}>
      {/* Logo rings + core */}
      <div style={{ position: 'relative', width: 104, height: 104, marginBottom: 40 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute',
            inset: -(i + 1) * 14,
            borderRadius: '50%',
            border: `1px solid ${C.mint}`,
            opacity: 0.15 + i * 0.05,
          }} />
        ))}
        <div style={{
          width: 104, height: 104, borderRadius: '50%',
          background: 'rgba(82,183,136,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: C.mint,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 24 24" fill="none" width={32} height={32}
              stroke="white" strokeWidth={2.5} strokeLinecap="round">
              <path d="M2 12h2" /><path d="M6 8v8" /><path d="M10 5v14" />
              <path d="M14 8v8" /><path d="M18 10v4" /><path d="M22 12h-2" />
            </svg>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', color: 'white', marginBottom: 56 }}>
        <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: 5, marginBottom: 6 }}>声脉</div>
        <div style={{
          fontSize: 13, letterSpacing: 7, color: C.mint, marginBottom: 40,
          fontFamily: 'DM Mono, monospace',
        }}>SOUNDPULSE</div>
        <div style={{
          width: 40, height: 1, background: 'rgba(255,255,255,0.15)',
          margin: '0 auto 24px',
        }} />
        <div style={{ fontSize: 14, lineHeight: 2.1, color: 'rgba(255,255,255,0.55)', fontWeight: 300 }}>
          不制造新的设备<br />
          重新组织已经存在的<br />
          声音与触觉
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: 2 }}>
        轻触屏幕 · 开始
      </div>
    </div>
  )
}

function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [userType, setUserType] = useState('deaf')
  const [fontSize, setFontSize] = useState(1)
  const [highContrast, setHighContrast] = useState(false)
  const [sounds, setSounds] = useState(['vehicles', 'announcements', 'callout'])

  const soundTypes = [
    { id: 'vehicles', icon: '🚗', label: '车辆鸣笛' },
    { id: 'announcements', icon: '📢', label: '公共广播' },
    { id: 'callout', icon: '🔔', label: '叫号叫名' },
    { id: 'alarms', icon: '🚨', label: '警报声' },
    { id: 'music', icon: '🎵', label: '音乐表演' },
    { id: 'conversation', icon: '💬', label: '日常对话' },
  ]

  const steps = [
    { title: '您的使用需求', sub: '帮助我们为您优化声音识别体验' },
    { title: '显示偏好', sub: '选择最适合您的字幕显示方式' },
    { title: '麦克风授权', sub: '声脉需要麦克风权限才能识别周围声音' },
  ]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <StatusBar />
      <div style={{ padding: '12px 24px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= step ? C.primary : C.border, transition: 'background 0.3s',
            }} />
          ))}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4 }}>{steps[step].title}</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 22 }}>{steps[step].sub}</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px' }}>
        {step === 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 10 }}>我主要是</div>
            {[
              { id: 'deaf', label: '听障人士', sub: '需要完整的声音信息辅助' },
              { id: 'hard', label: '听力困难', sub: '在嘈杂环境中需要额外帮助' },
              { id: 'normal', label: '听力正常', sub: '在特定场合使用辅助功能' },
            ].map(opt => (
              <div key={opt.id} onClick={() => setUserType(opt.id)} style={{
                background: userType === opt.id ? C.mintLight : C.card,
                borderRadius: 14, padding: '14px 16px',
                border: `1.5px solid ${userType === opt.id ? C.primary : C.border}`,
                marginBottom: 8, cursor: 'pointer',
              }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: C.text }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{opt.sub}</div>
              </div>
            ))}
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, margin: '20px 0 10px' }}>
              重点关注的声音类型
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {soundTypes.map(s => (
                <button key={s.id} onClick={() => setSounds(prev =>
                  prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id]
                )} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 20,
                  border: `1.5px solid ${sounds.includes(s.id) ? C.primary : C.border}`,
                  background: sounds.includes(s.id) ? C.mintLight : C.card,
                  color: sounds.includes(s.id) ? C.primary : C.textMid,
                  cursor: 'pointer', fontSize: 13, fontWeight: 500,
                }}>
                  <span>{s.icon}</span><span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 10 }}>字幕字号</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['小', '中', '大'] as const).map((s, i) => (
                  <button key={i} onClick={() => setFontSize(i)} style={{
                    flex: 1, padding: '16px 0', borderRadius: 12,
                    border: `1.5px solid ${fontSize === i ? C.primary : C.border}`,
                    background: fontSize === i ? C.mintLight : C.card,
                    color: fontSize === i ? C.primary : C.textMid,
                    fontSize: [13, 16, 20][i], fontWeight: 500, cursor: 'pointer',
                  }}>{s}</button>
                ))}
              </div>
            </div>
            <div style={{
              background: highContrast ? '#111' : C.card, borderRadius: 16, padding: 20,
              border: `1px solid ${C.border}`,
            }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 8, fontFamily: 'DM Mono, monospace' }}>
                字幕预览
              </div>
              <div style={{
                fontSize: [15, 18, 22][fontSize], fontWeight: 400, lineHeight: 1.6,
                color: highContrast ? 'white' : C.text,
              }}>
                您好，请问您需要什么帮助？
              </div>
              <div style={{
                fontSize: [11, 13, 16][fontSize], color: highContrast ? '#888' : C.textMuted, marginTop: 4,
              }}>
                工作人员 · 右前方 · 3秒前
              </div>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: C.card, borderRadius: 14, padding: '14px 16px', border: `1px solid ${C.border}`,
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>高对比度</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>深色背景，白色字幕</div>
              </div>
              <Toggle on={highContrast} onChange={() => setHighContrast(!highContrast)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: C.mintLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg viewBox="0 0 24 24" fill="none" width={38} height={38}
                stroke={C.primary} strokeWidth={2} strokeLinecap="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>麦克风权限</div>
              <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.8 }}>
                声脉在您的设备本地处理声音<br />
                不会将录音上传至服务器<br />
                麦克风仅在识别功能开启时使用
              </div>
            </div>
            <div style={{
              background: C.card, borderRadius: 16, padding: 16,
              border: `1px solid ${C.border}`, width: '100%',
            }}>
              {[
                { icon: '🔒', text: '本地处理，不上传声音' },
                { icon: '⏱', text: '临时字幕，默认24小时自动删除' },
                { icon: '🔕', text: '您可随时关闭识别功能' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, alignItems: 'center',
                  paddingBottom: i < 2 ? 12 : 0, marginBottom: i < 2 ? 12 : 0,
                  borderBottom: i < 2 ? `1px solid ${C.border}` : 'none',
                }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <span style={{ fontSize: 13, color: C.textMid }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '16px 24px 32px', flexShrink: 0 }}>
        <button onClick={() => step < 2 ? setStep(s => s + 1) : onComplete()} style={{
          width: '100%', padding: 16, borderRadius: 14,
          background: C.primary, color: 'white', border: 'none',
          fontSize: 16, fontWeight: 700, cursor: 'pointer',
        }}>
          {step < 2 ? '下一步' : '授权并开始'}
        </button>
      </div>
    </div>
  )
}

function WatchConnectScreen({ onComplete }: { onComplete: () => void }) {
  const [status, setStatus] = useState<'scanning' | 'found' | 'connected'>('scanning')
  const [vibTested, setVibTested] = useState(false)
  const [advancedMode, setAdvancedMode] = useState(true)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <StatusBar />
      <NavBar title="连接智能手表" />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px' }}>
        {/* Watch illustration */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '28px 0 20px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {status === 'scanning' && [1, 2, 3].map(i => (
              <div key={i} style={{
                position: 'absolute', width: 60 + i * 28, height: 60 + i * 28,
                borderRadius: '50%', border: `1px solid ${C.mint}`,
                opacity: 0.35 - i * 0.08,
              }} />
            ))}
            <div style={{
              width: 74, height: 88, borderRadius: 24,
              background: status === 'connected' ? C.primary : '#242424',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', zIndex: 1, gap: 4,
            }}>
              {status === 'connected' ? (
                <>
                  <div style={{ fontSize: 10, color: C.mint }}>声脉</div>
                  <div style={{ fontSize: 22, color: 'white' }}>✓</div>
                </>
              ) : (
                <div style={{ fontSize: 28, color: 'white' }}>⌚</div>
              )}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 4 }}>
            {status === 'scanning' ? '正在搜索附近设备…' :
              status === 'found' ? '发现设备' : '连接成功'}
          </div>
          <div style={{ fontSize: 13, color: C.textMuted }}>
            {status === 'scanning' ? '请确保手表已开启蓝牙' :
              status === 'found' ? 'Apple Watch Series 9' : '声脉已与您的手表建立连接'}
          </div>
        </div>

        {status === 'scanning' && (
          <button onClick={() => setStatus('found')} style={{
            width: '100%', padding: '13px', borderRadius: 12,
            background: C.card, border: `1px solid ${C.border}`,
            color: C.textMid, fontSize: 14, cursor: 'pointer',
          }}>手动搜索设备</button>
        )}

        {status === 'found' && (
          <div style={{
            background: C.card, borderRadius: 16, padding: 16, border: `1.5px solid ${C.border}`,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, background: '#242424',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>⌚</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Apple Watch Series 9</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>电量 82% · 已配对</div>
            </div>
            <button onClick={() => setStatus('connected')} style={{
              background: C.primary, color: 'white', border: 'none',
              borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>连接</button>
          </div>
        )}

        {status === 'connected' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{
              background: C.mintLight, borderRadius: 14, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>连接成功</div>
                <div style={{ fontSize: 12, color: C.textMid }}>Apple Watch Series 9 · 电量 82%</div>
              </div>
            </div>

            <button onClick={() => setVibTested(true)} style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
            }}>
              <span style={{ fontSize: 22 }}>📳</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>测试震动</div>
                <div style={{ fontSize: 12, color: vibTested ? C.mint : C.textMuted }}>
                  {vibTested ? '✓ 测试成功，手表震动3次' : '点击发送测试震动'}
                </div>
              </div>
            </button>

            <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}` }}>
              {[
                { icon: '🔔', label: '基础通知模式', sub: '仅接收重要提醒', selected: !advancedMode },
                { icon: '⚡', label: '进阶手表模式', sub: '实时字幕 + 方向 + 快捷回应', selected: advancedMode },
              ].map((opt, i) => (
                <div key={i} onClick={() => setAdvancedMode(i === 1)} style={{
                  padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: i === 0 ? `1px solid ${C.border}` : 'none', cursor: 'pointer',
                }}>
                  <span style={{ fontSize: 20 }}>{opt.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>{opt.sub}</div>
                  </div>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: `2px solid ${opt.selected ? C.primary : C.border}`,
                    background: opt.selected ? C.primary : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {opt.selected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '12px 24px 32px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {status === 'connected' && (
          <button onClick={onComplete} style={{
            width: '100%', padding: 16, borderRadius: 14,
            background: C.primary, color: 'white', border: 'none',
            fontSize: 16, fontWeight: 700, cursor: 'pointer',
          }}>开始使用声脉</button>
        )}
        {status !== 'connected' && (
          <button onClick={onComplete} style={{
            background: 'none', border: 'none', color: C.textMuted, fontSize: 13, cursor: 'pointer',
          }}>暂时跳过，稍后连接</button>
        )}
      </div>
    </div>
  )
}

function HearScreen({ setScreen, isListening, setIsListening, setShowEmergency }: {
  setScreen: (s: Screen) => void
  isListening: boolean
  setIsListening: (v: boolean) => void
  setShowEmergency: (v: boolean) => void
}) {
  const [mode, setMode] = useState('公共场所')
  const modes = ['居家', '公共场所', '医院', '餐厅', '交通']

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>
      {/* Green header */}
      <div style={{ background: C.primary, flexShrink: 0 }}>
        <StatusBar light />
        <div style={{ padding: '4px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>听见</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>手表已连接 · 电量82%</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.1)', borderRadius: 10,
            padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 9, color: C.mint }}>●</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Apple Watch</span>
          </div>
        </div>
        {/* Mode chips */}
        <div style={{ padding: '14px 24px 18px', display: 'flex', gap: 8, overflowX: 'auto' }}>
          {modes.map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: '6px 14px', borderRadius: 20, border: 'none', whiteSpace: 'nowrap',
              background: mode === m ? C.mint : 'rgba(255,255,255,0.1)',
              color: mode === m ? 'white' : 'rgba(255,255,255,0.55)',
              fontSize: 12, fontWeight: mode === m ? 700 : 400, cursor: 'pointer',
            }}>{m}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px 16px' }}>
        {/* Listening orb */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            {isListening && [0, 1].map(i => (
              <div key={i} style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                width: 100 + i * 34, height: 100 + i * 34, borderRadius: '50%',
                background: C.mintLight, opacity: 0.6 - i * 0.25,
              }} />
            ))}
            <button onClick={() => setIsListening(!isListening)} style={{
              width: 96, height: 96, borderRadius: '50%', border: 'none',
              background: isListening ? C.mint : C.mutedLight,
              cursor: 'pointer', zIndex: 1, position: 'relative',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 4,
              boxShadow: isListening ? `0 8px 24px ${C.mint}55` : 'none',
              color: isListening ? 'white' : C.muted,
              transition: 'all 0.2s',
            }}>
              <svg viewBox="0 0 24 24" fill="none" width={26} height={26}
                stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              <span style={{ fontSize: 10, fontWeight: 700 }}>
                {isListening ? '识别中' : '开始'}
              </span>
            </button>
          </div>
          <div style={{ fontSize: 12, color: C.textMuted }}>
            {isListening ? '正在监听周围声音 · 当前场景：' + mode : '点击开始声音识别'}
          </div>
        </div>

        {isListening && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 0.5, marginBottom: 2 }}>
              当前声音
            </div>

            {/* P2 callout */}
            <div onClick={() => setScreen('callout')} style={{
              background: C.card, borderRadius: 18, padding: '14px 16px',
              border: `1.5px solid ${C.orange}`,
              borderLeft: `4px solid ${C.orange}`,
              cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 18 }}>🔔</span>
                  <PBadge level="P2" />
                </div>
                <span style={{ fontSize: 11, color: C.textMuted, fontFamily: 'DM Mono, monospace' }}>刚刚</span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 3 }}>
                张女士，123号
              </div>
              <div style={{ fontSize: 12, color: C.textMid, display: 'flex', gap: 10 }}>
                <span>📢 叫号广播</span><span>·</span><span>↑ 前方</span><span>·</span>
                <span style={{ fontFamily: 'DM Mono, monospace' }}>91%</span>
              </div>
            </div>

            {/* P3 conversation */}
            <div onClick={() => setScreen('realtime')} style={{
              background: C.card, borderRadius: 18, padding: '14px 16px',
              border: `1px solid ${C.border}`,
              borderLeft: `4px solid ${C.mint}`,
              cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 18 }}>💬</span>
                  <PBadge level="P3" />
                </div>
                <span style={{ fontSize: 11, color: C.textMuted, fontFamily: 'DM Mono, monospace' }}>3s前</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: C.text, lineHeight: 1.5, marginBottom: 3 }}>
                "您好，请问今天是预约号码吗？"
              </div>
              <div style={{ fontSize: 12, color: C.textMid, display: 'flex', gap: 10 }}>
                <span>👩 工作人员</span><span>·</span><span>↗ 右前方</span>
              </div>
            </div>

            {/* P4 ambient */}
            <div style={{
              background: C.card, borderRadius: 18, padding: '12px 16px',
              border: `1px solid ${C.border}`,
              borderLeft: `4px solid ${C.muted}`,
              opacity: 0.7,
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>🎵</span>
                <PBadge level="P4" />
                <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 'auto', fontFamily: 'DM Mono, monospace' }}>持续</span>
              </div>
              <div style={{ fontSize: 13, color: C.textMuted }}>背景音乐 · 环境声</div>
            </div>

            {/* Quick actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button onClick={() => setScreen('multi')} style={{
                flex: 1, padding: '14px 0', borderRadius: 14,
                background: C.mintLight, border: 'none', cursor: 'pointer',
                color: C.primary, fontSize: 13, fontWeight: 700,
              }}>👥 多人对话</button>
              <button onClick={() => setShowEmergency(true)} style={{
                flex: 1, padding: '14px 0', borderRadius: 14,
                background: C.redLight, border: `1px solid ${C.red}20`,
                cursor: 'pointer', color: C.red, fontSize: 13, fontWeight: 700,
              }}>🚨 紧急演示</button>
            </div>
          </div>
        )}

        {!isListening && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.8 }}>
              开启识别后，声脉将实时<br />
              监听周围声音并通过手表<br />
              向您发送分级震动提醒
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RealtimeScreen({ onBack }: { onBack: () => void }) {
  const [feedback, setFeedback] = useState<null | 'correct' | 'wrong'>(null)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <StatusBar />
      <NavBar title="实时声音识别" onBack={onBack} />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Main card */}
        <div style={{ background: C.card, borderRadius: 20, padding: 20, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{
                width: 42, height: 42, borderRadius: 13, background: C.mintLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>💬</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>当前对话</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>P3 · 工作人员</div>
              </div>
            </div>
            <span style={{
              background: C.mintLight, color: C.primary,
              fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
            }}>进行中</span>
          </div>

          {/* Direction */}
          <div style={{
            display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16,
            padding: 12, background: C.bg, borderRadius: 12,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: `1.5px solid ${C.border}`, position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: 22 }}>↗</span>
              <span style={{ position: 'absolute', fontSize: 7, color: C.textMuted, top: 3 }}>前</span>
              <span style={{ position: 'absolute', fontSize: 7, color: C.textMuted, bottom: 3 }}>后</span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>疑似 右前方</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>距离：近（约1–2米）</div>
            </div>
          </div>

          {/* Caption */}
          <div style={{ background: C.mintLight, borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: C.text, lineHeight: 1.6 }}>
              "您好，请问今天是预约号码吗？还是现场取号？"
            </div>
            <div style={{ fontSize: 11, color: C.textMid, marginTop: 8 }}>工作人员 · 2秒前</div>
          </div>

          {/* Confidence */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: C.textMuted }}>识别置信度</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 5, background: C.mutedLight, borderRadius: 3 }}>
                <div style={{ width: '87%', height: '100%', background: C.mint, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: C.primary, fontWeight: 500 }}>87%</span>
            </div>
          </div>

          {/* Keywords */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>关键信息</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['预约号码', '现场取号', '询问'].map(kw => (
                <span key={kw} style={{
                  background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 20, padding: '4px 12px', fontSize: 12, color: C.textMid,
                }}>{kw}</span>
              ))}
            </div>
          </div>

          {/* Suggested action */}
          <div style={{
            background: C.orangeLight, borderRadius: 12, padding: '12px 14px',
            borderLeft: `3px solid ${C.orange}`,
          }}>
            <div style={{ fontSize: 10, color: C.orange, fontWeight: 700, marginBottom: 3 }}>建议行动</div>
            <div style={{ fontSize: 13, color: C.text }}>工作人员正在询问您，可使用沟通卡回应</div>
          </div>
        </div>

        {/* Feedback */}
        <div style={{ background: C.card, borderRadius: 16, padding: '14px 16px', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>识别是否准确？</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setFeedback('correct')} style={{
              flex: 1, padding: 10, borderRadius: 10, border: 'none',
              background: feedback === 'correct' ? C.mint : C.bg,
              color: feedback === 'correct' ? 'white' : C.textMid,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>✓ 识别正确</button>
            <button onClick={() => setFeedback('wrong')} style={{
              flex: 1, padding: 10, borderRadius: 10, border: 'none',
              background: feedback === 'wrong' ? C.orange : C.bg,
              color: feedback === 'wrong' ? 'white' : C.textMid,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>✕ 识别有误</button>
          </div>
          {feedback === 'wrong' && (
            <div style={{ marginTop: 10, padding: '10px 14px', background: C.bg, borderRadius: 10 }}>
              <input placeholder="请描述正确内容…" style={{
                width: '100%', border: 'none', background: 'transparent',
                fontSize: 13, color: C.text, outline: 'none',
              }} />
            </div>
          )}
        </div>

        {/* Recent events */}
        <div style={{ background: C.card, borderRadius: 16, padding: '14px 16px', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 12 }}>最近声音事件</div>
          {[
            { icon: '🚗', text: '车辆经过', dir: '←左方', conf: 72, time: '12s前' },
            { icon: '📢', text: '公共广播', dir: '↑前方', conf: 95, time: '28s前' },
          ].map((ev, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              paddingBottom: i === 0 ? 12 : 0, marginBottom: i === 0 ? 12 : 0,
              borderBottom: i === 0 ? `1px solid ${C.border}` : 'none',
            }}>
              <span style={{ fontSize: 20 }}>{ev.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{ev.text}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{ev.dir} · {ev.conf}%</div>
              </div>
              <span style={{ fontSize: 11, color: C.textMuted, fontFamily: 'DM Mono, monospace' }}>{ev.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MultiPersonScreen({ onBack }: { onBack: () => void }) {
  const [locked, setLocked] = useState<number | null>(null)
  const [showSummary, setShowSummary] = useState(false)

  const speakers = [
    {
      name: '工作人员', icon: '👩‍💼', color: C.mint, direction: '↗ 右前方',
      caption: '您的申请材料已经审核通过，请到3号窗口取件。',
      time: '刚刚', active: true,
    },
    {
      name: '同行者', icon: '🧑', color: C.orange, direction: '← 左方',
      caption: '好的，我们去3号窗口。',
      time: '8s前', active: false,
    },
    {
      name: '其他参与者', icon: '👤', color: C.muted, direction: '↓ 后方',
      caption: '请大家有序排队…',
      time: '23s前', active: false,
    },
  ]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <StatusBar />
      <NavBar title="多人对话" onBack={onBack} />
      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowSummary(!showSummary)} style={{
            flex: 1, padding: '10px', borderRadius: 10,
            background: showSummary ? C.mintLight : C.card,
            border: `1px solid ${showSummary ? C.mint : C.border}`,
            color: showSummary ? C.primary : C.textMid, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>✨ 生成摘要</button>
          <button style={{
            flex: 1, padding: '10px', borderRadius: 10,
            background: C.card, border: `1px solid ${C.border}`,
            color: C.textMid, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>↩ 回看上一句</button>
        </div>

        {showSummary && (
          <div style={{ background: C.primary, borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 10, color: C.mint, marginBottom: 8, fontWeight: 700 }}>✨ AI 摘要</div>
            <div style={{ fontSize: 14, color: 'white', lineHeight: 1.8 }}>
              工作人员告知您申请材料已审核通过，请前往
              <strong style={{ color: C.mint }}>3号窗口</strong>取件。
              同行者已确认，准备前往。
            </div>
          </div>
        )}

        {speakers.map((sp, i) => {
          const isActive = sp.active && locked === null
          const isLocked = locked === i
          const dim = locked !== null && !isLocked

          return (
            <div key={i} style={{
              background: C.card, borderRadius: 18,
              padding: isActive || isLocked ? 18 : '12px 16px',
              border: `${isActive || isLocked ? '2px' : '1px'} solid ${isActive || isLocked ? sp.color : C.border}`,
              opacity: dim ? 0.45 : 1, transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isActive || isLocked ? 12 : 0 }}>
                <div style={{
                  width: isActive || isLocked ? 46 : 36, height: isActive || isLocked ? 46 : 36,
                  borderRadius: '50%', background: sp.color + '22',
                  border: `2px solid ${sp.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isActive || isLocked ? 22 : 18, flexShrink: 0,
                }}>{sp.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: isActive || isLocked ? 15 : 13, fontWeight: 700, color: C.text }}>
                      {sp.name}
                    </span>
                    {sp.active && locked === null && (
                      <span style={{
                        background: sp.color, color: 'white',
                        fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                      }}>说话中</span>
                    )}
                    {isLocked && (
                      <span style={{
                        background: C.orange, color: 'white',
                        fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                      }}>已锁定</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{sp.direction} · {sp.time}</div>
                </div>
                <button onClick={() => setLocked(locked === i ? null : i)} style={{
                  background: isLocked ? C.orangeLight : C.bg, border: 'none',
                  borderRadius: 8, padding: '6px 10px',
                  color: isLocked ? C.orange : C.textMuted, fontSize: 11, cursor: 'pointer',
                }}>{isLocked ? '解锁' : '锁定'}</button>
              </div>

              {(isActive || isLocked) && (
                <div style={{ background: sp.color + '18', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 15, color: C.text, lineHeight: 1.6 }}>"{sp.caption}"</div>
                </div>
              )}
              {!isActive && !isLocked && (
                <div style={{
                  fontSize: 12, color: C.textMuted,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>"{sp.caption}"</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EmergencyScreen({ onDismiss }: { onDismiss: () => void }) {
  const [confirmed, setConfirmed] = useState(false)
  return (
    <div style={{
      position: 'absolute', inset: 0, background: C.red, zIndex: 100,
      display: 'flex', flexDirection: 'column',
    }}>
      <StatusBar light />
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '0 28px',
      }}>
        <div style={{
          width: 76, height: 76, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
        }}>
          <svg viewBox="0 0 24 24" fill="none" width={44} height={44}
            stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.15)', borderRadius: 6,
          padding: '3px 12px', marginBottom: 14,
        }}>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5 }}>
            P1 · 紧急安全提醒
          </span>
        </div>

        <div style={{
          fontSize: 28, fontWeight: 700, color: 'white',
          textAlign: 'center', lineHeight: 1.3, marginBottom: 20,
        }}>
          右后方车辆<br />正在靠近
        </div>

        {/* Direction compass */}
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,0.25)',
          position: 'relative', margin: '0 0 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {[['前', 'top', '50%', '6px', 'auto'], ['后', 'bottom', '50%', 'auto', '6px'],
            ['左', 'left', '6px', 'auto', 'auto'], ['右', 'right', 'auto', 'auto', '6px']].map(([label, side]) => (
            <span key={label as string} style={{
              position: 'absolute', fontSize: 9, color: 'rgba(255,255,255,0.4)',
              ...(side === 'top' ? { top: 8, left: '50%', transform: 'translateX(-50%)' } : {}),
              ...(side === 'bottom' ? { bottom: 8, left: '50%', transform: 'translateX(-50%)' } : {}),
              ...(side === 'left' ? { left: 8, top: '50%', transform: 'translateY(-50%)' } : {}),
              ...(side === 'right' ? { right: 8, top: '50%', transform: 'translateY(-50%)' } : {}),
            }}>{label}</span>
          ))}
          <span style={{ position: 'absolute', bottom: 18, right: 16, fontSize: 22 }}>🚗</span>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'rgba(255,255,255,0.35)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 700,
          }}>你</div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.15)', borderRadius: 16,
          padding: '14px 20px', textAlign: 'center', width: '100%', marginBottom: 6,
        }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>建议行动</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>请停下并观察右后方</div>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Mono, monospace' }}>
          疑似车辆鸣笛 · 置信度 82%
        </div>
      </div>

      <div style={{ padding: '0 24px 40px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!confirmed ? (
          <button onClick={() => { setConfirmed(true); setTimeout(onDismiss, 1000) }} style={{
            padding: 16, borderRadius: 14, border: 'none',
            background: 'white', color: C.red, fontSize: 16, fontWeight: 700, cursor: 'pointer',
          }}>✓ 我已注意，确认安全</button>
        ) : (
          <div style={{
            padding: 16, borderRadius: 14, background: 'rgba(255,255,255,0.2)',
            textAlign: 'center', color: 'white', fontSize: 15, fontWeight: 700,
          }}>✓ 已确认，正在关闭…</div>
        )}
        <button onClick={onDismiss} style={{
          padding: 12, background: 'none',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 12, color: 'rgba(255,255,255,0.65)', fontSize: 13, cursor: 'pointer',
        }}>✕ 识别有误，忽略此提醒</button>
      </div>
    </div>
  )
}

function CalloutScreen({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <div style={{ background: C.orange }}>
        <StatusBar light />
        <NavBar title="叫号提醒" onBack={onBack} light />
        <div style={{ textAlign: 'center', padding: '12px 24px 28px' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', fontSize: 28,
          }}>🔔</div>
          <div style={{
            background: 'rgba(255,255,255,0.15)', borderRadius: 6,
            padding: '3px 12px', display: 'inline-block', marginBottom: 10,
          }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>
              P2 · 与您直接相关
            </span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'white', marginBottom: 4 }}>
            张女士，123号
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>
            请到3号窗口办理业务
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: C.card, borderRadius: 16, padding: 16, border: `1px solid ${C.border}` }}>
          {[
            { label: '呼叫来源', value: '3号窗口广播' },
            { label: '声音方向', value: '↑ 前方' },
            { label: '完整字幕', value: '123号张女士，请到3号窗口，办理证件业务。' },
            { label: '识别置信度', value: '91%' },
          ].map((row, i, arr) => (
            <div key={i} style={{
              display: 'flex', gap: 12,
              paddingBottom: i < arr.length - 1 ? 12 : 0,
              marginBottom: i < arr.length - 1 ? 12 : 0,
              borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
            }}>
              <span style={{ fontSize: 12, color: C.textMuted, width: 72, flexShrink: 0 }}>{row.label}</span>
              <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{row.value}</span>
            </div>
          ))}
        </div>

        <button onClick={onBack} style={{
          padding: 16, borderRadius: 14, border: 'none',
          background: C.orange, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
        }}>✓ 我知道了，前往3号窗口</button>
        <button onClick={onBack} style={{
          padding: 12, background: 'none', border: `1px solid ${C.border}`,
          borderRadius: 12, color: C.textMuted, fontSize: 13, cursor: 'pointer',
        }}>✕ 识别有误</button>
      </div>
    </div>
  )
}

function CommunicateScreen() {
  const [input, setInput] = useState('')
  const [enlarged, setEnlarged] = useState<string | null>(null)

  const quickCards = [
    '请面对我说话', '请稍等，我正在阅读字幕',
    '请说慢一点', '请再说一次',
    '我是听障人士', '请把重要信息写下来',
    '我已理解', '我需要帮助',
  ]

  if (enlarged) {
    return (
      <div style={{
        flex: 1, background: C.primary,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 32,
      }}>
        <div style={{
          fontSize: 28, fontWeight: 700, color: 'white',
          textAlign: 'center', lineHeight: 1.6, marginBottom: 52,
        }}>{enlarged}</div>
        <button onClick={() => setEnlarged(null)} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 14,
          color: 'white', fontSize: 15, padding: '14px 40px', cursor: 'pointer',
        }}>收起</button>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>
      <StatusBar />
      <div style={{
        padding: '4px 24px 12px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: C.text }}>沟通</span>
        <span style={{
          background: C.mintLight, color: C.primary,
          fontSize: 11, padding: '4px 12px', borderRadius: 20, fontWeight: 700,
        }}>识别中 ●</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { speaker: '工作人员', text: '请问您是来办理什么业务的？', time: '现在', active: true },
          { speaker: '工作人员', text: '您好，我们这里需要身份证原件。', time: '1分钟前', active: false },
          { speaker: '工作人员', text: '请问您有预约吗？', time: '3分钟前', active: false },
        ].map((item, i) => (
          <div key={i} style={{
            background: C.card, borderRadius: 16, padding: '14px 16px',
            border: `${item.active ? '2' : '1'}px solid ${item.active ? C.mint : C.border}`,
            borderLeft: `4px solid ${item.active ? C.mint : C.border}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.mint }}>👩‍💼 {item.speaker}</span>
              <span style={{ fontSize: 11, color: C.textMuted, fontFamily: 'DM Mono, monospace' }}>{item.time}</span>
            </div>
            <div style={{ fontSize: item.active ? 16 : 14, color: C.text, lineHeight: 1.5 }}>{item.text}</div>
          </div>
        ))}
      </div>

      <div style={{
        flexShrink: 0, padding: '12px 24px 0',
        borderTop: `1px solid ${C.border}`, background: C.bg,
      }}>
        <div style={{ overflowX: 'auto', marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
            {quickCards.map(card => (
              <button key={card} onClick={() => setEnlarged(card)} style={{
                padding: '8px 14px', borderRadius: 20, border: `1px solid ${C.border}`,
                background: C.card, color: C.textMid, fontSize: 12, fontWeight: 500,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}>{card}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, paddingBottom: 32 }}>
          <div style={{
            flex: 1, background: C.card, borderRadius: 14,
            border: `1px solid ${C.border}`, padding: '12px 14px',
          }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              placeholder="输入文字，放大展示给对方…"
              style={{
                width: '100%', border: 'none', background: 'transparent',
                fontSize: 14, color: C.text, outline: 'none',
              }} />
          </div>
          <button onClick={() => { if (input) { setEnlarged(input); setInput('') } }} style={{
            width: 44, height: 44, borderRadius: 12, border: 'none',
            background: input ? C.primary : C.mutedLight,
            color: input ? 'white' : C.textMuted, fontSize: 20,
            cursor: input ? 'pointer' : 'default', flexShrink: 0,
          }}>↑</button>
        </div>
      </div>
    </div>
  )
}

function RecordScreen() {
  const [filter, setFilter] = useState('全部')
  const filters = ['全部', '字幕', '提醒', '广播', '安全']

  const events = [
    { type: 'callout', icon: '🔔', text: '张女士123号，请到3号窗口', time: '14:23', priority: 'P2' as const, color: C.orange },
    { type: 'conversation', icon: '💬', text: '工作人员："请问您是来办理什么业务的？"', time: '14:19', priority: 'P3' as const, color: C.mint },
    { type: 'broadcast', icon: '📢', text: '本行将于下午5点停止对外服务…', time: '14:15', priority: 'P3' as const, color: C.mint },
    { type: 'safety', icon: '🚗', text: '疑似车辆鸣笛 · 右后方 · 置信度82%', time: '13:52', priority: 'P1' as const, color: C.red },
    { type: 'conversation', icon: '💬', text: '同行者："我们去3号窗口吧"', time: '14:21', priority: 'P3' as const, color: C.mint },
  ]

  const filtered = events.filter(e =>
    filter === '全部' ||
    (filter === '字幕' && e.type === 'conversation') ||
    (filter === '提醒' && e.type === 'callout') ||
    (filter === '广播' && e.type === 'broadcast') ||
    (filter === '安全' && e.type === 'safety')
  ).sort((a, b) => b.time.localeCompare(a.time))

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>
      <StatusBar />
      <div style={{ padding: '4px 24px 12px', flexShrink: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 14 }}>记录</div>

        {/* AI summary */}
        <div style={{ background: C.primary, borderRadius: 18, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: C.mint, fontWeight: 700 }}>✨ AI 今日摘要</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Mono, monospace' }}>今天</span>
          </div>
          <div style={{ fontSize: 13, color: 'white', lineHeight: 1.8 }}>
            在银行期间，申请材料已审核通过，需前往
            <strong style={{ color: C.mint }}>3号窗口</strong>取件。
            曾收到一次车辆接近提醒，已确认安全。
          </div>
        </div>

        {/* Quick */}
        <button style={{
          width: '100%', padding: '11px', borderRadius: 12,
          background: C.orangeLight, border: `1.5px solid ${C.orange}`,
          color: C.orange, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 14,
        }}>↩ 刚才说了什么？</button>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 20,
              background: filter === f ? C.primary : C.card,
              color: filter === f ? 'white' : C.textMid,
              border: `1px solid ${filter === f ? 'transparent' : C.border}`,
              fontSize: 12, fontWeight: filter === f ? 700 : 400, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>{f}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '4px 24px 24px' }}>
        {filtered.map((ev, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 34, flexShrink: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: ev.color + '1A', border: `1.5px solid ${ev.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              }}>{ev.icon}</div>
              {i < filtered.length - 1 && (
                <div style={{ width: 1, flex: 1, background: C.border, marginTop: 4 }} />
              )}
            </div>
            <div style={{
              flex: 1, background: C.card, borderRadius: 14, padding: '12px 14px',
              border: `1px solid ${C.border}`, marginBottom: 4,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <PBadge level={ev.priority} />
                <span style={{ fontSize: 11, color: C.textMuted, fontFamily: 'DM Mono, monospace' }}>{ev.time}</span>
              </div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{ev.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProfileScreen({ setScreen }: { setScreen: (s: Screen) => void }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'auto' }}>
      <div style={{ background: C.primary }}>
        <StatusBar light />
        <div style={{ padding: '4px 24px 28px' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 18 }}>我的</div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: C.mint,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
            }}>👤</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'white' }}>张女士</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>听障用户 · 声脉使用中</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 24px 0' }}>
        <div style={{
          background: C.mintLight, borderRadius: 16, padding: '14px 16px',
          display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <span style={{ fontSize: 26 }}>⌚</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>Apple Watch 已连接</div>
            <div style={{ fontSize: 12, color: C.textMid }}>电量 82% · 进阶手表模式</div>
          </div>
          <button onClick={() => setScreen('watchPreview')} style={{
            background: C.card, border: 'none', borderRadius: 8,
            padding: '7px 14px', color: C.primary, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>预览</button>
        </div>
      </div>

      {[
        {
          title: '提醒与手表',
          items: [
            { icon: '📳', label: '震动与提醒设置', screen: 'vibSettings' as Screen },
            { icon: '⌚', label: '手表界面预览', screen: 'watchPreview' as Screen },
          ],
        },
        {
          title: '显示与字幕',
          items: [
            { icon: '🔤', label: '个性化与隐私设置', screen: 'personalSettings' as Screen },
          ],
        },
        {
          title: '关于声脉',
          items: [
            { icon: '🔒', label: '本地处理说明', screen: null },
            { icon: '❓', label: '帮助与反馈', screen: null },
          ],
        },
      ].map((group, gi) => (
        <div key={gi} style={{ padding: '16px 24px 0' }}>
          <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>
            {group.title.toUpperCase()}
          </div>
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
            {group.items.map((item, ii) => (
              <button key={ii} onClick={() => item.screen && setScreen(item.screen)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', border: 'none', background: 'transparent',
                borderBottom: ii < group.items.length - 1 ? `1px solid ${C.border}` : 'none',
                cursor: item.screen ? 'pointer' : 'default', textAlign: 'left',
              }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span style={{ flex: 1, fontSize: 14, color: C.text }}>{item.label}</span>
                {item.screen && <span style={{ color: C.textMuted, fontSize: 18, lineHeight: 1 }}>›</span>}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div style={{ height: 24 }} />
    </div>
  )
}

function VibSettingsScreen({ onBack }: { onBack: () => void }) {
  const [strength, setStrength] = useState(2)
  const [dnd, setDnd] = useState(false)
  const [patterns, setPatterns] = useState([true, true, true, true, false])

  const patternData = [
    { icon: '🚨', label: 'P1 紧急危险', pattern: '●●●●', color: C.red },
    { icon: '🔔', label: 'P2 叫号/叫名', pattern: '●● ●', color: C.orange },
    { icon: '💬', label: 'P3 说话人切换', pattern: '●', color: C.mint },
    { icon: '📢', label: '重要广播', pattern: '●●', color: C.orange },
    { icon: '🎵', label: 'P4 环境声音', pattern: '－', color: C.muted },
  ]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'auto' }}>
      <StatusBar />
      <NavBar title="震动与提醒设置" onBack={onBack} />
      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 10 }}>震动强度</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['轻', '中', '强', '最强'].map((l, i) => (
              <button key={i} onClick={() => setStrength(i)} style={{
                flex: 1, padding: '13px 0', borderRadius: 10,
                border: `1.5px solid ${strength === i ? C.primary : C.border}`,
                background: strength === i ? C.mintLight : C.card,
                color: strength === i ? C.primary : C.textMid,
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}>{l}</button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 10 }}>震动模式</div>
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
            {patternData.map((p, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                borderBottom: i < patternData.length - 1 ? `1px solid ${C.border}` : 'none',
              }}>
                <span style={{ fontSize: 20 }}>{p.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{p.label}</div>
                  <div style={{
                    fontSize: 16, letterSpacing: 4, color: p.color, marginTop: 2,
                    fontFamily: 'DM Mono, monospace',
                  }}>{p.pattern}</div>
                </div>
                <Toggle on={patterns[i]} onChange={() => setPatterns(prev => {
                  const next = [...prev]; next[i] = !next[i]; return next
                })} />
              </div>
            ))}
          </div>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: C.card, borderRadius: 14, padding: '16px',
          border: `1px solid ${C.border}`,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>免打扰模式</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>P1紧急信息仍会提醒</div>
          </div>
          <Toggle on={dnd} onChange={() => setDnd(!dnd)} />
        </div>
      </div>
      <div style={{ height: 24 }} />
    </div>
  )
}

function PersonalSettingsScreen({ onBack }: { onBack: () => void }) {
  const [fontSize, setFontSize] = useState(1)
  const [highContrast, setHighContrast] = useState(false)
  const [autoDelete, setAutoDelete] = useState(true)
  const [retention, setRetention] = useState(1)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'auto' }}>
      <StatusBar />
      <NavBar title="个性化与隐私" onBack={onBack} />
      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 10 }}>字幕字号</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['小', '中', '大'] as const).map((s, i) => (
              <button key={i} onClick={() => setFontSize(i)} style={{
                flex: 1, padding: '16px 0', borderRadius: 12,
                border: `1.5px solid ${fontSize === i ? C.primary : C.border}`,
                background: fontSize === i ? C.mintLight : C.card,
                color: fontSize === i ? C.primary : C.textMid,
                fontSize: [13, 17, 22][i], fontWeight: 500, cursor: 'pointer',
              }}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: C.card, borderRadius: 14, padding: '14px 16px', border: `1px solid ${C.border}`,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>高对比度</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>深色背景，白色字幕</div>
          </div>
          <Toggle on={highContrast} onChange={() => setHighContrast(!highContrast)} />
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 10 }}>字幕保存时长</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['6小时', '24小时', '7天'].map((opt, i) => (
              <button key={i} onClick={() => setRetention(i)} style={{
                flex: 1, padding: '10px 0', borderRadius: 10,
                border: `1.5px solid ${retention === i ? C.primary : C.border}`,
                background: retention === i ? C.mintLight : C.card,
                color: retention === i ? C.primary : C.textMid,
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
              }}>{opt}</button>
            ))}
          </div>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: C.card, borderRadius: 14, padding: '14px 16px', border: `1px solid ${C.border}`,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>到期自动删除</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>按保存时长自动清除</div>
          </div>
          <Toggle on={autoDelete} onChange={() => setAutoDelete(!autoDelete)} />
        </div>

        <div style={{
          background: C.mintLight, borderRadius: 16, padding: '14px 16px',
          border: `1px solid ${C.mint}`,
        }}>
          <div style={{ fontSize: 12, color: C.primary, fontWeight: 700, marginBottom: 6 }}>🔒 本地处理说明</div>
          <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.8 }}>
            声脉在您的设备本地完成所有声音识别，不会将录音或字幕上传至服务器。您的声音数据始终留在设备上。
          </div>
        </div>

        <button style={{
          padding: 14, borderRadius: 14, background: C.redLight,
          border: `1px solid ${C.red}30`, color: C.red, fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>清除所有字幕记录</button>
      </div>
      <div style={{ height: 24 }} />
    </div>
  )
}

function WatchPreviewScreen({ onBack }: { onBack: () => void }) {
  const watchScreens = [
    { label: '紧急危险', bg: C.red, icon: '⚠️', level: 'P1', text: '右后方\n车辆靠近', action: '停下观察' },
    { label: '叫号提醒', bg: C.orange, icon: '🔔', level: 'P2', text: '123号\n张女士', action: '前往3号窗口' },
    { label: '对话切换', bg: C.primaryMid, icon: '💬', level: 'P3', text: '工作人员\n请出示证件', action: '在手机查看' },
    { label: '重要广播', bg: '#2D5A4A', icon: '📢', level: 'P3', text: '下午5点\n停止服务', action: '已知晓' },
    { label: '快速回应', bg: C.text, icon: '✉️', level: '', text: '请稍等', action: '发送', sub: '我正在阅读字幕' },
  ]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'auto' }}>
      <StatusBar />
      <NavBar title="手表界面预览" onBack={onBack} />
      <div style={{ padding: '0 24px 24px' }}>
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 24, lineHeight: 1.7 }}>
          当声脉检测到声音事件，智能手表将显示以下界面。手表只显示最关键信息，完整内容请在手机查看。
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
          {watchScreens.map((ws, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 128, height: 152, borderRadius: 36,
                background: ws.bg, padding: '16px 14px 13px',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 12px 32px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.07)',
                position: 'relative',
              }}>
                {/* Crown */}
                <div style={{
                  position: 'absolute', right: -5, top: 38,
                  width: 5, height: 28, background: '#555', borderRadius: 3,
                }} />
                {/* Top row */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 10,
                }}>
                  <span style={{ fontSize: 22 }}>{ws.icon}</span>
                  {ws.level && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.8)',
                      background: 'rgba(255,255,255,0.18)', borderRadius: 4, padding: '1px 5px',
                    }}>{ws.level}</span>
                  )}
                </div>
                {/* Main text */}
                <div style={{
                  fontSize: 15, fontWeight: 700, color: 'white',
                  lineHeight: 1.4, flex: 1, whiteSpace: 'pre-line',
                }}>{ws.text}</div>
                {ws.sub && (
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', marginBottom: 5 }}>
                    {ws.sub}
                  </div>
                )}
                {/* Action */}
                <div style={{
                  background: 'rgba(255,255,255,0.18)', borderRadius: 10,
                  padding: '6px 0', textAlign: 'center',
                  fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.9)',
                }}>{ws.action}</div>
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>{ws.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash')
  const [tab, setTab] = useState<Tab>('hear')
  const [isListening, setIsListening] = useState(false)
  const [showEmergency, setShowEmergency] = useState(false)

  const tabScreens: Screen[] = ['hear', 'communicate', 'record', 'profile']
  const isTabScreen = tabScreens.includes(screen)

  const handleSetScreen = (s: Screen) => {
    setScreen(s)
    if (tabScreens.includes(s)) setTab(s as Tab)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#1A2E22',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: "'Noto Sans SC', sans-serif",
    }}>
      <div style={{
        width: 390, height: 844, borderRadius: 46,
        overflow: 'hidden', position: 'relative',
        boxShadow: '0 48px 96px rgba(0,0,0,0.7), 0 0 0 8px #222, 0 0 0 9.5px #3A3A3A',
        display: 'flex', flexDirection: 'column', background: C.bg,
        flexShrink: 0,
      }}>
        {/* Emergency overlay */}
        {showEmergency && (
          <EmergencyScreen onDismiss={() => setShowEmergency(false)} />
        )}

        {!showEmergency && (() => {
          switch (screen) {
            case 'splash':
              return <SplashScreen onNext={() => setScreen('onboarding')} />
            case 'onboarding':
              return <OnboardingScreen onComplete={() => setScreen('watchConnect')} />
            case 'watchConnect':
              return <WatchConnectScreen onComplete={() => handleSetScreen('hear')} />
            case 'hear':
              return (
                <HearScreen
                  setScreen={handleSetScreen}
                  isListening={isListening}
                  setIsListening={setIsListening}
                  setShowEmergency={setShowEmergency}
                />
              )
            case 'realtime':
              return <RealtimeScreen onBack={() => handleSetScreen('hear')} />
            case 'multi':
              return <MultiPersonScreen onBack={() => handleSetScreen('hear')} />
            case 'callout':
              return <CalloutScreen onBack={() => handleSetScreen('hear')} />
            case 'communicate':
              return <CommunicateScreen />
            case 'record':
              return <RecordScreen />
            case 'profile':
              return <ProfileScreen setScreen={handleSetScreen} />
            case 'vibSettings':
              return <VibSettingsScreen onBack={() => handleSetScreen('profile')} />
            case 'personalSettings':
              return <PersonalSettingsScreen onBack={() => handleSetScreen('profile')} />
            case 'watchPreview':
              return <WatchPreviewScreen onBack={() => handleSetScreen('profile')} />
            default:
              return null
          }
        })()}

        {!showEmergency && isTabScreen && (
          <BottomNav tab={tab} setTab={setTab} setScreen={handleSetScreen} />
        )}
      </div>
    </div>
  )
}
