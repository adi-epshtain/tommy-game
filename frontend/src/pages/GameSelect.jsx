import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { removeToken } from '../services/api'

const PinkBear = () => (
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

const GreenBear = () => (
  <svg viewBox="0 0 160 170" width="100%" height="auto">
    <ellipse cx="80" cy="161" rx="46" ry="8" fill="rgba(0,0,0,0.07)"/>
    <path d="M50 40 Q56 18 64 40 Z" fill="#6FB84E"/>
    <path d="M72 30 Q80 6 88 30 Z" fill="#6FB84E"/>
    <path d="M96 40 Q104 18 110 40 Z" fill="#6FB84E"/>
    <path d="M80 32 C42 32 26 66 26 96 C26 138 50 158 80 158 C110 158 134 138 134 96 C134 66 118 32 80 32 Z" fill="#8FD06A"/>
    <ellipse cx="58" cy="156" rx="16" ry="10" fill="#8FD06A"/>
    <ellipse cx="102" cy="156" rx="16" ry="10" fill="#8FD06A"/>
    <ellipse cx="30" cy="106" rx="11" ry="16" fill="#8FD06A"/>
    <ellipse cx="130" cy="106" rx="11" ry="16" fill="#8FD06A"/>
    <ellipse cx="80" cy="112" rx="33" ry="37" fill="#E8F5DB"/>
    <ellipse cx="62" cy="80" rx="15" ry="17" fill="#fff"/>
    <ellipse cx="98" cy="80" rx="15" ry="17" fill="#fff"/>
    <circle cx="64" cy="84" r="8" fill="#3F4A2E"/>
    <circle cx="96" cy="84" r="8" fill="#3F4A2E"/>
    <circle cx="67" cy="81" r="3" fill="#fff"/>
    <circle cx="99" cy="81" r="3" fill="#fff"/>
    <ellipse cx="46" cy="100" rx="9" ry="6" fill="#FF9DB0" opacity="0.6"/>
    <ellipse cx="114" cy="100" rx="9" ry="6" fill="#FF9DB0" opacity="0.6"/>
    <path d="M68 102 Q80 114 92 102" fill="none" stroke="#3F4A2E" strokeWidth="3.5" strokeLinecap="round"/>
  </svg>
)

function GameSelect({ onLogout }) {
  const navigate = useNavigate()
  const [isMuted, setIsMuted] = useState(false)

  const handleLogout = () => {
    removeToken()
    onLogout()
    navigate('/login')
  }

  return (
    <div
      dir="rtl"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        overflow: 'hidden',
        fontFamily: "'Varela Round', 'Heebo', sans-serif",
        background: 'linear-gradient(180deg, #CDEBFF 0%, #EAF7FF 42%, #FFF1F7 100%)',
      }}
    >
      {/* Clouds */}
      <div style={{
        position: 'absolute', top: '12%', right: '8%',
        width: 170, height: 64, background: '#fff', opacity: .75,
        borderRadius: 60, boxShadow: '-44px 8px 0 -6px #fff, 40px 6px 0 -10px #fff',
        animation: 'tg-floatslow 9s ease-in-out infinite',
        pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', top: '22%', left: '12%',
        width: 130, height: 50, background: '#fff', opacity: .65,
        borderRadius: 60, boxShadow: '-32px 6px 0 -6px #fff',
        animation: 'tg-floatslow 12s ease-in-out infinite',
        pointerEvents: 'none',
      }}/>

      {/* Bottom hills */}
      <div style={{
        position: 'absolute', bottom: -60, right: -40,
        width: '62%', height: 230,
        background: 'radial-gradient(120% 100% at 50% 0, #A9E08A, #7FCB6A)',
        borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
        pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', bottom: -70, left: -40,
        width: '58%', height: 200,
        background: 'radial-gradient(120% 100% at 50% 0, #FFC9DE, #FFB0CF)',
        borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
        pointerEvents: 'none',
      }}/>

      {/* Top bar */}
      <div style={{
        position: 'relative', zIndex: 5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        margin: '18px 22px', padding: '10px 18px',
        background: 'rgba(255,255,255,.62)',
        backdropFilter: 'blur(14px)',
        border: '2px solid rgba(255,255,255,.9)',
        borderRadius: 30,
        boxShadow: '0 10px 28px rgba(120,150,200,.2)',
      }}>
        <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20, fontWeight: 700, color: '#5B6BA8' }}>
          Tommy Game
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setIsMuted(m => !m)}
            title={isMuted ? 'בטל השתקה' : 'השתק'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44,
              border: '2px solid rgba(255,255,255,.9)', borderRadius: '50%',
              background: '#fff', cursor: 'pointer', fontSize: 20,
              boxShadow: '0 4px 12px rgba(120,150,200,.2)',
            }}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={handleLogout}
            style={{
              height: 44, padding: '0 18px',
              border: '2px solid rgba(255,255,255,.9)', borderRadius: 999,
              background: '#fff', cursor: 'pointer',
              fontSize: 14, fontWeight: 700, color: '#5B6BA8',
              boxShadow: '0 4px 12px rgba(120,150,200,.2)',
              fontFamily: "'Varela Round', sans-serif",
            }}
          >
            התנתק
          </button>
        </div>
      </div>

      {/* Heading */}
      <div style={{ position: 'relative', zIndex: 4, textAlign: 'center', marginTop: 16 }}>
        <h1 style={{
          margin: 0,
          fontFamily: "'Fredoka', 'Varela Round', sans-serif",
          fontSize: 'clamp(28px, 5vw, 46px)',
          fontWeight: 700, color: '#5B4A7E',
          textShadow: '0 3px 0 rgba(255,255,255,.8)',
        }}>
          איזה משחק נשחק עכשיו?
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: 18, color: '#8C7AA8' }}>
          בחרו משחק
        </p>
      </div>

      {/* Cards */}
      <div style={{
        position: 'relative', zIndex: 4,
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        gap: 36, marginTop: 30, padding: '0 24px 32px', flexWrap: 'wrap',
      }}>

        {/* Numbers game - Pink card */}
        <GameCard
          onClick={() => navigate('/numbers')}
          headerGradient="radial-gradient(120% 120% at 50% 20%, #FFE3F0, #FFC2DD)"
          shadow="rgba(214,150,180,.38)"
          decorLeft={{ text: '4', top: 60, left: 26, size: 34, opacity: .85 }}
          decorRight={{ text: '123', top: 18, right: 22, size: 40 }}
          mascot={<PinkBear />}
          mascotAnim="tg-float"
          title="משחק המספרים"
          titleColor="#C2477E"
          label="גילאי 2-4"
          labelBg="#FFE3F0"
          labelColor="#C2477E"
          desc={'לחצו על המספר הנכון\nוקבלו דינוזאורים!'}
          descColor="#8C7AA8"
          decorColor="rgba(240,122,160,.5)"
        />

        {/* Math game - Green card */}
        <GameCard
          onClick={() => navigate('/game')}
          headerGradient="radial-gradient(120% 120% at 50% 20%, #CFEFB6, #A6DE84)"
          shadow="rgba(120,170,110,.34)"
          decorLeft={{ text: '÷', top: 24, left: 30, size: 36, opacity: .9 }}
          decorRight={{ text: '+', top: 22, right: 26, size: 40 }}
          mascot={<GreenBear />}
          mascotAnim="tg-float"
          title="משחק החשבון"
          titleColor="#4E8C3A"
          label="גילאי 5-9"
          labelBg="#E4F3D6"
          labelColor="#4E8C3A"
          desc={'פתרו תרגילי חשבון, אספו\nדינוזאורים וטפסו בדירוג!'}
          descColor="#8C7AA8"
          decorColor="rgba(110,160,80,.5)"
        />

      </div>

      {/* Parent note */}
      <div style={{
        position: 'relative', zIndex: 4,
        margin: '0 auto 200px',
        maxWidth: 720,
        padding: '18px 28px',
        background: 'rgba(255,255,255,0.62)',
        backdropFilter: 'blur(12px)',
        border: '2px solid rgba(255,255,255,.85)',
        borderRadius: 24,
        boxShadow: '0 8px 24px rgba(120,150,200,.15)',
        textAlign: 'center',
        fontFamily: "'Varela Round', 'Heebo', sans-serif",
        fontSize: 15,
        color: '#6B7A99',
        lineHeight: 1.7,
      }}>
        <span style={{ fontWeight: 700, color: '#5B4A7E' }}>הורה יקר,</span> Tommy Game שומר היסטוריה מלאה של כל משחק: תשובות נכונות ושגויות, כמות משחקים - הכל נשמר ונגיש לעקוב אחר התקדמות הילד. ללא פרסומות, ללא הסחות דעת - רק משחק ולימודים.
      </div>
    </div>
  )
}

function GameCard({ onClick, headerGradient, shadow, decorLeft, decorRight, mascot, mascotAnim, title, titleColor, label, labelBg, labelColor, desc, descColor, decorColor }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        all: 'unset',
        cursor: 'pointer',
        width: 300,
        background: '#fff',
        borderRadius: 40,
        overflow: 'hidden',
        boxShadow: hovered
          ? `0 30px 56px ${shadow}`
          : `0 22px 44px ${shadow}`,
        transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
        transition: 'transform .18s ease, box-shadow .18s ease',
      }}
    >
      {/* Colored header area */}
      <div style={{
        position: 'relative',
        height: 200,
        background: headerGradient,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Right number decorator */}
        <div style={{
          position: 'absolute',
          top: decorRight.top,
          right: decorRight.right,
          fontFamily: "'Fredoka', sans-serif",
          fontWeight: 700,
          fontSize: decorRight.size,
          color: '#fff',
          textShadow: `0 3px 0 ${decorColor}`,
          pointerEvents: 'none',
        }}>
          {decorRight.text}
        </div>
        {/* Left number decorator */}
        <div style={{
          position: 'absolute',
          top: decorLeft.top,
          left: decorLeft.left,
          fontFamily: "'Fredoka', sans-serif",
          fontWeight: 700,
          fontSize: decorLeft.size,
          color: '#fff',
          opacity: decorLeft.opacity || 1,
          textShadow: `0 3px 0 ${decorColor}`,
          pointerEvents: 'none',
        }}>
          {decorLeft.text}
        </div>
        {/* Bear mascot peeking from bottom */}
        <div style={{ width: 130, transform: 'translateY(14px)' }}>
          <div className={mascotAnim}>
            {mascot}
          </div>
        </div>
      </div>

      {/* Text area */}
      <div style={{ padding: '22px 24px 30px', textAlign: 'center' }}>
        <div style={{
          fontSize: 26,
          fontWeight: 700,
          color: titleColor,
          fontFamily: "'Fredoka', 'Varela Round', sans-serif",
        }}>
          {title}
        </div>
        <div style={{
          display: 'inline-block',
          margin: '10px 0 14px',
          padding: '5px 16px',
          background: labelBg,
          color: labelColor,
          borderRadius: 999,
          fontSize: 14,
          fontWeight: 700,
        }}>
          {label}
        </div>
        <p style={{
          margin: 0,
          fontSize: 15,
          color: descColor,
          lineHeight: 1.6,
          whiteSpace: 'pre-line',
        }}>
          {desc}
        </p>
      </div>
    </button>
  )
}

export default GameSelect
