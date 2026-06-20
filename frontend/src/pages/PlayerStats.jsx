import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

function PlayerStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const formatLocalTime = (utcTimestamp) => {
    if (!utcTimestamp) return ''
    try {
      let dateStr = utcTimestamp
      if (!utcTimestamp.includes('Z') && !utcTimestamp.includes('+') && !utcTimestamp.includes('-', 10)) {
        dateStr = utcTimestamp.endsWith('Z') ? utcTimestamp : utcTimestamp + 'Z'
      }
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return utcTimestamp
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${day}/${month}/${year} ${hours}:${minutes}`
    } catch {
      return utcTimestamp
    }
  }

  useEffect(() => { loadStats() }, [])

  const loadStats = async () => {
    try {
      const data = await api.getPlayerStats()
      setStats(data)
    } catch (err) {
      setError(`שגיאה: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const bg = 'linear-gradient(180deg, #B6E2F2 0%, #D6F0C4 48%, #A9DE84 100%)'

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Varela Round', 'Heebo', sans-serif" }}>
        <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 32, padding: '40px 48px', boxShadow: '0 16px 48px rgba(110,170,90,.2)', fontSize: 22, fontWeight: 700, color: '#4E8C3A' }}>
          ⏳ טוען נתונים...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Varela Round', 'Heebo', sans-serif" }}>
        <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 32, padding: 40, boxShadow: '0 16px 48px rgba(110,170,90,.2)', textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
          <div style={{ fontSize: 18, color: '#C0392B', fontWeight: 700, marginBottom: 20 }}>{error}</div>
          <button onClick={() => navigate('/game')} style={navBtn}>← חזרה למשחק</button>
        </div>
      </div>
    )
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: bg,
        fontFamily: "'Varela Round', 'Heebo', sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header pill */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        margin: '16px 16px 0', padding: '10px 18px',
        background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(14px)',
        border: '2px solid rgba(255,255,255,.9)', borderRadius: 30,
        boxShadow: '0 10px 28px rgba(110,170,90,.28)',
        position: 'sticky', top: 16, zIndex: 10,
      }}>
        <button onClick={() => navigate('/game')} style={navBtn}>🎮 חזרה</button>
        <div className="tg-center-title" style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 24, fontWeight: 700, color: '#4E8C3A', position: 'absolute', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          📊 סטטיסטיקות
        </div>
        <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 16, fontWeight: 700, color: '#4E8C3A' }}>
          {stats?.player_name}
        </div>
      </header>

      {/* Content */}
      <div style={{ flex: 1, padding: '20px 16px 32px', maxWidth: 760, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {stats?.player_stats && stats.player_stats.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {stats.player_stats.map((session, idx) => (
              <div key={idx} style={{
                background: 'rgba(255,255,255,0.92)',
                borderRadius: 24,
                padding: '22px 24px',
                boxShadow: '0 8px 28px rgba(110,170,90,.14)',
                border: '2px solid rgba(255,255,255,.9)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 22, fontWeight: 700, color: '#4E8C3A' }}>
                    🎮 סשן {idx + 1}
                  </div>
                  <div style={{ fontSize: 13, color: '#7AB85A', background: '#E8F5DB', borderRadius: 999, padding: '4px 14px', border: '1.5px solid #CDE8A8', fontWeight: 600 }}>
                    ⏰ {formatLocalTime(session.started_at)}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: session.wrong_answer?.length > 0 ? 16 : 0 }}>
                  <div style={{ background: 'linear-gradient(135deg, #E8F5DB, #D4F0BE)', borderRadius: 18, padding: '16px 12px', textAlign: 'center', border: '2px solid #CDE8A8' }}>
                    <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 36, fontWeight: 700, color: '#4E8C3A' }}>{session.correct_count}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#5A9A40' }}>✅ תשובות נכונות</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #FFE8E8, #FFD0D0)', borderRadius: 18, padding: '16px 12px', textAlign: 'center', border: '2px solid #FFBBBB' }}>
                    <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 36, fontWeight: 700, color: '#C0392B' }}>{session.incorrect_count}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#B03030' }}>❌ תשובות שגויות</div>
                  </div>
                </div>

                {session.wrong_answer && session.wrong_answer.length > 0 && (
                  <div style={{ background: '#FAFFF6', borderRadius: 16, padding: '14px 18px', border: '1.5px solid #CDE8A8' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#4E8C3A', marginBottom: 8 }}>📝 שאלות לתרגול:</div>
                    <ul dir="ltr" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {session.wrong_answer.map((q, i) => (
                        <li key={i} style={{ background: '#fff', border: '1.5px solid #E0EDD8', borderRadius: 10, padding: '4px 12px', fontSize: 14, color: '#4E8C3A', fontWeight: 600 }}>
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 28, padding: '48px 32px', textAlign: 'center', boxShadow: '0 8px 28px rgba(110,170,90,.14)', border: '2px solid rgba(255,255,255,.9)' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📊</div>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 26, fontWeight: 700, color: '#4E8C3A', marginBottom: 10 }}>אין עדיין סטטיסטיקות</div>
            <p style={{ color: '#7AB85A', fontSize: 16, marginBottom: 24 }}>שחק כדי לראות את ההתקדמות שלך!</p>
            <button onClick={() => navigate('/game')} style={{ ...navBtn, padding: '12px 32px', fontSize: 16 }}>🎮 התחל לשחק</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlayerStats

const navBtn = {
  background: '#fff',
  border: '2px solid #CDE8A8',
  borderRadius: 999,
  padding: '7px 16px',
  fontSize: 13,
  fontWeight: 700,
  color: '#4E8C3A',
  cursor: 'pointer',
  boxShadow: '0 4px 0 #CDE8A8',
  fontFamily: "'Varela Round', sans-serif",
  whiteSpace: 'nowrap',
}
