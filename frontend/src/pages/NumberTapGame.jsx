import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, removeToken } from '../services/api'
import { useSounds } from '../hooks/useSounds'
import { useSpeech } from '../hooks/useSpeech'
import DinosaurSelection from '../components/DinosaurSelection'

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

// Range 1-5 for toddlers (Noya, age 2): a small, learnable set of numbers.
const MAX_NUMBER = 5

// Cute, kid-friendly pictures shown as the "quantity" so the number is
// concrete (e.g. 3 -> 🍭🍭🍭). One is chosen per round.
const ANIMALS = ['🍬', '🍭', '🍦', '🧁', '🍓', '🐶', '🐱', '🐰', '🦄', '🌸']

function generateChoices(target) {
  const pool = new Set()
  while (pool.size < 3) {
    const n = Math.floor(Math.random() * MAX_NUMBER) + 1
    if (n !== target) pool.add(n)
  }
  return shuffle([target, ...pool])
}

const BTN_COLORS = [
  { bg: '#8FE0BD', dark: '#62C79C', text: '#fff' },
  { bg: '#FFC59E', dark: '#F2A878', text: '#fff' },
  { bg: '#FF9FBF', dark: '#F07AA0', text: '#fff' },
  { bg: '#BBA6F0', dark: '#9D85E0', text: '#fff' },
]

const PinkBearMascot = () => (
  <svg viewBox="0 0 160 170" width="100%" height="auto">
    <ellipse cx="80" cy="161" rx="46" ry="8" fill="rgba(0,0,0,0.07)"/>
    <path d="M50 40 Q56 20 64 40 Z" fill="#EC8FB4"/>
    <path d="M72 32 Q80 10 88 32 Z" fill="#EC8FB4"/>
    <path d="M96 40 Q104 20 110 40 Z" fill="#EC8FB4"/>
    <path d="M80 32 C42 32 26 66 26 96 C26 138 50 158 80 158 C110 158 134 138 134 96 C134 66 118 32 80 32 Z" fill="#F6A8C8"/>
    <ellipse cx="58" cy="156" rx="16" ry="10" fill="#F6A8C8"/>
    <ellipse cx="102" cy="156" rx="16" ry="10" fill="#F6A8C8"/>
    <ellipse cx="30" cy="106" rx="11" ry="16" fill="#F6A8C8"/>
    <ellipse cx="130" cy="106" rx="11" ry="16" fill="#F6A8C8"/>
    <ellipse cx="80" cy="112" rx="33" ry="37" fill="#FFE9F1"/>
    <ellipse cx="62" cy="80" rx="15" ry="17" fill="#fff"/>
    <ellipse cx="98" cy="80" rx="15" ry="17" fill="#fff"/>
    <circle cx="64" cy="84" r="8" fill="#4A3550"/>
    <circle cx="96" cy="84" r="8" fill="#4A3550"/>
    <circle cx="67" cy="81" r="3" fill="#fff"/>
    <circle cx="99" cy="81" r="3" fill="#fff"/>
    <ellipse cx="46" cy="100" rx="9" ry="6" fill="#FF6F9E" opacity="0.65"/>
    <ellipse cx="114" cy="100" rx="9" ry="6" fill="#FF6F9E" opacity="0.65"/>
    <path d="M68 102 Q80 114 92 102" fill="none" stroke="#4A3550" strokeWidth="3.5" strokeLinecap="round"/>
    <path d="M114 46 L99 38 L99 56 Z" fill="#FF7FA8"/>
    <path d="M114 46 L129 38 L129 56 Z" fill="#FF7FA8"/>
    <circle cx="114" cy="46" r="5" fill="#EC5E92"/>
  </svg>
)

const EMOJIS = ['⭐', '🌟', '✨', '🎉', '🌈', '🎈', '💫', '🎊']

export default function NumberTapGame({ onLogout = () => {} }) {
  const navigate = useNavigate()
  const [target, setTarget] = useState(null)
  const [choices, setChoices] = useState([])
  const [celebrating, setCelebrating] = useState(false)
  const [wrongId, setWrongId] = useState(null)
  const [score, setScore] = useState(0)
  const [particles, setParticles] = useState([])
  // Mute is shared across games and remembered between sessions, so turning
  // sound off in one game keeps it off everywhere until explicitly turned on.
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('tommy_muted') === '1')
  const [allDinos, setAllDinos] = useState([])
  const [collectedDinos, setCollectedDinos] = useState([])
  const [pressedIdx, setPressedIdx] = useState(null)
  const [showDinosaurViewOnly, setShowDinosaurViewOnly] = useState(false)
  const [roundEmoji, setRoundEmoji] = useState(ANIMALS[0])
  const particleId = useRef(0)
  const { playCelebrationSound, playErrorSound } = useSounds(isMuted)
  const { speakNumber } = useSpeech(isMuted)

  const handleLogout = () => {
    removeToken()
    onLogout()
    navigate('/login')
  }

  useEffect(() => {
    api.getAvailableDinosaurs()
      .then(dinos => setAllDinos(shuffle(dinos)))
      .catch(() => {})
  }, [])

  const nextRound = useCallback(() => {
    const t = Math.floor(Math.random() * MAX_NUMBER) + 1
    setTarget(t)
    setChoices(generateChoices(t))
    setRoundEmoji(ANIMALS[Math.floor(Math.random() * ANIMALS.length)])
    setCelebrating(false)
    setWrongId(null)
    setParticles([])
    setPressedIdx(null)
  }, [])

  useEffect(() => { nextRound() }, [nextRound])

  // Speak the target number aloud (in Hebrew) whenever a new one appears.
  useEffect(() => {
    if (target != null) speakNumber(target)
  }, [target, speakNumber])

  // Remember the mute choice across games and reloads.
  useEffect(() => {
    localStorage.setItem('tommy_muted', isMuted ? '1' : '0')
  }, [isMuted])

  useEffect(() => {
    const onKey = (e) => {
      const n = parseInt(e.key)
      if (n >= 1 && n <= 9) handleChoice(n)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const handleChoice = (n, idx) => {
    if (celebrating || wrongId !== null) return

    if (n === target) {
      const newScore = score + 1
      setScore(newScore)
      setCelebrating(true)
      playCelebrationSound()
      if (idx !== undefined) setPressedIdx(idx)

      setParticles(Array.from({ length: 12 }, (_, i) => ({
        id: particleId.current++,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        left: 5 + (i * 8),
        delay: i * 0.07,
      })))

      if (allDinos.length > 0) {
        const dino = allDinos[(newScore - 1) % allDinos.length]
        setCollectedDinos(prev => [...prev, { ...dino, key: particleId.current++ }])
      }

      setTimeout(() => nextRound(), 2000)
    } else {
      playErrorSound()
      setWrongId(n)
      setTimeout(() => setWrongId(null), 500)
    }
  }

  const dinoSize = Math.max(72, 160 - collectedDinos.length * 7)

  // Color the target number to match its correct button, so a toddler can
  // succeed by matching the COLOR (a skill they have well before recognizing
  // digits) while still being exposed to the number.
  const correctColor = BTN_COLORS[choices.indexOf(target)] || BTN_COLORS[3]

  if (showDinosaurViewOnly) {
    return (
      <div dir="rtl" style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #FFD9E8 0%, #FFE9F2 38%, #F1E7FF 100%)',
        fontFamily: "'Varela Round', 'Heebo', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'clamp(12px, 4vw, 24px)',
          overflowY: 'auto',
          zIndex: 10,
        }}>
          <div style={{ maxWidth: 600, width: '100%' }}>
            <DinosaurSelection
              viewOnly={true}
              onSkip={() => setShowDinosaurViewOnly(false)}
              playerDinosaurs={[]}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      dir="rtl"
      style={{
        width: '100%',
        height: '100dvh',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #FFD9E8 0%, #FFE9F2 38%, #F1E7FF 100%)',
        fontFamily: "'Varela Round', 'Heebo', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Floating particles */}
      {particles.map(p => (
        <span
          key={p.id}
          className="float-up"
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            bottom: '42%',
            fontSize: 40,
            pointerEvents: 'none',
            animationDelay: `${p.delay}s`,
            zIndex: 20,
          }}
        >
          {p.emoji}
        </span>
      ))}

      {/* Top bar - frosted glass pill */}
      <header className="tg-game-topbar" style={{
        flex: '0 0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: '16px 16px 0',
        padding: '10px 16px',
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(14px)',
        border: '2px solid rgba(255,255,255,.9)',
        borderRadius: 30,
        boxShadow: '0 10px 28px rgba(214,150,180,.28)',
        fontFamily: "'Varela Round', 'Heebo', sans-serif",
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Right side: nav buttons */}
        <div className="tg-topbar-group" style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
          {[
            { label: '🎮 חזרה', action: () => navigate('/game-select') },
            { label: '👀 דינוזאורים', action: () => setShowDinosaurViewOnly(true) },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action} style={pinkNavBtnStyle}>{btn.label}</button>
          ))}
        </div>

        {/* Center: title (hidden on small screens to avoid overlapping nav) */}
        <div className="tg-center-title" style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: 26,
          fontWeight: 700,
          color: '#9B3D7A',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}>
          משחק המספרים
        </div>

        {/* Left side: score + sound + logout */}
        <div className="tg-topbar-group" style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
          <div style={{
            ...pinkNavBtnStyle,
            cursor: 'default',
            background: 'linear-gradient(180deg, #FFFFFF, #FFF1F7)',
          }}>
            ⭐ {score}
          </div>
          <button
            onClick={() => setIsMuted(m => !m)}
            title={isMuted ? 'בטל השתקה' : 'השתק'}
            style={{ ...pinkNavBtnStyle, padding: '7px 12px', fontSize: 17 }}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button onClick={handleLogout} style={pinkNavBtnStyle}>
            התנתק
          </button>
        </div>
      </header>

      {/* Main game area */}
      <main style={{
        flex: '1 1 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 20px',
        position: 'relative',
        minHeight: 0,
      }}>
        {/* Central panel */}
        <div style={{
          width: '100%',
          maxWidth: 460,
          background: 'rgba(255,255,255,0.92)',
          borderRadius: 32,
          padding: 'clamp(16px, 4vw, 28px) clamp(16px, 4vw, 24px)',
          boxSizing: 'border-box',
          boxShadow: '0 12px 40px rgba(155,61,122,0.12), 0 4px 12px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(12px, 2.5vh, 20px)',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Prompt label */}
          <p style={{ margin: 0, fontSize: 18, color: '#9B3D7A', fontWeight: 700 }}>
            לחצו על המספר:
          </p>

          {/* Target number display - colored to match its correct button.
              Tapping it repeats the number aloud (and helps unlock audio on
              browsers that require a first user gesture). */}
          <div
            onClick={() => target != null && speakNumber(target)}
            title="הקש כדי לשמוע שוב"
            style={{
              position: 'relative',
              width: 'clamp(110px, 30vw, 160px)', height: 'clamp(110px, 30vw, 160px)',
              background: `linear-gradient(135deg, ${correctColor.bg} 0%, ${correctColor.dark} 100%)`,
              borderRadius: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 6px 0 ${correctColor.dark}, 0 8px 20px rgba(0,0,0,0.15)`,
              transform: celebrating ? 'scale(1.12)' : 'scale(1)',
              transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.3s ease',
              cursor: 'pointer',
            }}>
            <span style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: 'clamp(72px, 20vw, 110px)',
              lineHeight: 1,
              color: '#fff',
              fontWeight: 700,
              textShadow: '0 2px 4px rgba(0,0,0,0.15)',
            }}>
              {target}
            </span>
          </div>

          {/* Quantity pictures: shows the number as that many animals so a
              toddler connects the digit to a real count (e.g. 3 -> 🐶🐶🐶). */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 'clamp(2px, 1vw, 6px)',
            maxWidth: '100%',
            lineHeight: 1,
          }}>
            {Array.from({ length: target || 0 }).map((_, i) => (
              <span key={i} style={{ fontSize: 'clamp(26px, 7vw, 40px)' }}>{roundEmoji}</span>
            ))}
          </div>

          {/* Celebrating message or spacer */}
          {celebrating ? (
            <div
              className="tg-pop"
              style={{ fontSize: 26, fontWeight: 800, color: '#C9275E', textAlign: 'center' }}
            >
              כל הכבוד! 🎉
            </div>
          ) : (
            <div style={{ height: 36 }} />
          )}

          {/* 2x2 Choice buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 14,
            width: '100%',
          }}>
            {choices.map((n, i) => {
              const col = BTN_COLORS[i % BTN_COLORS.length]
              const isWrong = wrongId === n
              const isCorrect = celebrating && n === target
              const isPressed = pressedIdx === i

              return (
                <button
                  key={`${n}-${i}`}
                  onClick={() => handleChoice(n, i)}
                  className={isWrong ? 'shake' : ''}
                  style={{
                    height: 'clamp(80px, 14vh, 130px)',
                    fontFamily: "'Fredoka', sans-serif",
                    fontSize: 'clamp(42px, 11vw, 60px)',
                    fontWeight: 700,
                    color: col.text,
                    background: isWrong ? '#FF4444' : col.bg,
                    border: 'none',
                    borderRadius: 22,
                    boxShadow: isPressed || isCorrect
                      ? `0 2px 0 ${col.dark}, 0 3px 8px rgba(0,0,0,0.15)`
                      : `0 8px 0 ${col.dark}, 0 10px 20px rgba(0,0,0,0.12)`,
                    transform: isCorrect ? 'scale(1.08) translateY(6px)' : isPressed ? 'translateY(6px)' : 'translateY(0)',
                    transition: 'transform 0.12s, box-shadow 0.12s, background 0.12s',
                    cursor: 'pointer',
                    outline: isCorrect ? '4px solid #FFD700' : 'none',
                  }}
                  onMouseDown={() => setPressedIdx(i)}
                  onMouseUp={() => setPressedIdx(null)}
                  onMouseLeave={() => setPressedIdx(null)}
                >
                  {n}
                </button>
              )
            })}
          </div>
        </div>

        {/* Bear mascot at bottom-left of main */}
        <div style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          width: 82,
          opacity: 0.85,
          pointerEvents: 'none',
        }}
          className="tg-floatslow"
        >
          <PinkBearMascot />
        </div>
      </main>

      {/* Collected dinosaurs strip at the bottom */}
      {collectedDinos.length > 0 && (
        <div className="tg-dino-strip" style={{
          flex: '0 0 auto',
          height: dinoSize + 12,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 4,
          padding: '4px 8px 6px',
          pointerEvents: 'none',
          overflow: 'hidden',
        }}>
          {collectedDinos.map((dino, index) => (
            <img
              key={dino.key}
              src={dino.image_path}
              alt={dino.name}
              className={`tg-dino-strip-img ${celebrating && index === collectedDinos.length - 1 ? 'tg-hop' : ''}`}
              style={{
                height: dinoSize,
                width: dinoSize * 0.8,
                objectFit: 'contain',
                filter: 'drop-shadow(2px 2px 5px rgba(0,0,0,0.25))',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const pinkNavBtnStyle = {
  background: '#fff',
  border: '2px solid #FFD0E1',
  borderRadius: 999,
  padding: '7px 14px',
  fontSize: 13,
  fontWeight: 700,
  color: '#9B3D7A',
  cursor: 'pointer',
  boxShadow: '0 4px 0 #FFD0E1',
  fontFamily: "'Varela Round', sans-serif",
  whiteSpace: 'nowrap',
}
