import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

function TopPlayers() {
  const [topPlayers, setTopPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handlePlayAgain = async () => {
    try {
      await api.startGame(5)
      navigate('/game')
    } catch (err) {
      alert('אירעה שגיאה בהתחלת המשחק')
      console.error(err)
    }
  }

  useEffect(() => { loadTopPlayers() }, [])

  const loadTopPlayers = async () => {
    try {
      const data = await api.getTopPlayers()
      setTopPlayers(data.top_players || [])
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
          ⏳ טוען...
        </div>
      </div>
    )
  }

  const medals = ['🥇', '🥈', '🥉']
  const medalBg = [
    { bg: 'linear-gradient(135deg, #FFF9D0, #FFF0A0)', border: '#F0D060', color: '#8A7020' },
    { bg: 'linear-gradient(135deg, #F0F0F0, #E0E0E0)', border: '#C0C0C0', color: '#606060' },
    { bg: 'linear-gradient(135deg, #FFE8D0, #FFD8B0)', border: '#D4954A', color: '#8A5020' },
  ]

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
          🏆 לוח התוצאות
        </div>
        <button onClick={handlePlayAgain} style={navBtn}>🎮 שחק שוב</button>
      </header>

      {/* Content */}
      <div style={{ flex: 1, padding: '20px 16px 32px', maxWidth: 640, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {error ? (
          <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 24, padding: 32, textAlign: 'center', boxShadow: '0 8px 28px rgba(110,170,90,.14)' }}>
            <div style={{ fontSize: 18, color: '#C0392B', fontWeight: 700 }}>{error}</div>
          </div>
        ) : topPlayers.length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 28, padding: '48px 32px', textAlign: 'center', boxShadow: '0 8px 28px rgba(110,170,90,.14)', border: '2px solid rgba(255,255,255,.9)' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🏆</div>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 26, fontWeight: 700, color: '#4E8C3A', marginBottom: 10 }}>אין עדיין תוצאות</div>
            <p style={{ color: '#7AB85A', fontSize: 16 }}>שחק כדי להגיע ללוח!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topPlayers.map((player, i) => {
              const isMedal = i < 3
              const medal = medalBg[i] || null
              return (
                <div key={i} style={{
                  background: isMedal ? medal.bg : 'rgba(255,255,255,0.88)',
                  borderRadius: 22,
                  padding: '16px 22px',
                  border: `2px solid ${isMedal ? medal.border : '#CDE8A8'}`,
                  boxShadow: isMedal ? `0 8px 24px rgba(0,0,0,.10)` : '0 4px 14px rgba(110,170,90,.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}>
                  <div style={{ fontSize: isMedal ? 38 : 22, fontWeight: 700, width: 48, textAlign: 'center', color: isMedal ? medal.color : '#4E8C3A', fontFamily: "'Fredoka', sans-serif", flexShrink: 0 }}>
                    {isMedal ? medals[i] : i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20, fontWeight: 700, color: isMedal ? medal.color : '#4E8C3A' }}>
                      {player.name}
                    </div>
                    {isMedal && (
                      <div style={{ fontSize: 12, color: isMedal ? medal.color : '#7AB85A', fontWeight: 600, opacity: 0.8 }}>
                        {i === 0 ? 'מקום ראשון' : i === 1 ? 'מקום שני' : 'מקום שלישי'}
                      </div>
                    )}
                  </div>
                  <div style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: '10px 20px',
                    border: `1.5px solid ${isMedal ? medal.border : '#CDE8A8'}`,
                    textAlign: 'center',
                    minWidth: 72,
                    flexShrink: 0,
                  }}>
                    <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 24, fontWeight: 700, color: '#4E8C3A' }}>{player.score}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#7AB85A' }}>ניקוד</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default TopPlayers

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
