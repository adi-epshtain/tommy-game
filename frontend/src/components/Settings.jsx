import { useState, useEffect } from 'react'
import { api } from '../services/api'

function Settings({ onSettingsSaved }) {
  const [currentStage, setCurrentStage] = useState(1)
  const [winningScore, setWinningScore] = useState(5)
  const [loading, setLoading] = useState(false)
  const [loadingState, setLoadingState] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadCurrentState = async () => {
      try {
        const state = await api.getCurrentGameState()
        setCurrentStage(state.current_stage)
        setWinningScore(state.winning_score)
      } catch (err) {
        console.error('Failed to load current game state:', err)
      } finally {
        setLoadingState(false)
      }
    }
    loadCurrentState()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await api.saveSettings(1, winningScore, currentStage)
      setMessage('✅ ההגדרות נשמרו!')
      if (onSettingsSaved) await onSettingsSaved(res)
    } catch {
      setMessage('שגיאה בשמירת ההגדרות')
    } finally {
      setLoading(false)
    }
  }

  if (loadingState) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0', color: '#4E8C3A', fontFamily: "'Varela Round', sans-serif", fontSize: 18 }}>
        ⏳ טוען...
      </div>
    )
  }

  const fieldStyle = {
    display: 'block',
    width: '100%',
    maxWidth: 160,
    margin: '0 auto',
    padding: '10px 16px',
    fontSize: 22,
    fontWeight: 700,
    textAlign: 'center',
    border: '2.5px solid #CDE8A8',
    borderRadius: 16,
    background: '#FAFFF6',
    color: '#4E8C3A',
    outline: 'none',
    fontFamily: "'Fredoka', sans-serif",
    boxSizing: 'border-box',
  }

  return (
    <div style={{ fontFamily: "'Varela Round', 'Heebo', sans-serif" }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Stage */}
        <div style={{ background: '#F4FFF4', borderRadius: 18, padding: '18px 22px', border: '1.5px solid #CDE8A8' }}>
          <label style={{ display: 'block', fontSize: 16, fontWeight: 700, color: '#4E8C3A', marginBottom: 10, textAlign: 'center' }}>
            🎯 רמה נוכחית
          </label>
          <input
            type="number"
            min="1"
            max="5"
            value={currentStage}
            onChange={(e) => setCurrentStage(parseInt(e.target.value))}
            style={fieldStyle}
            onFocus={e => { e.target.style.borderColor = '#6AB840' }}
            onBlur={e => { e.target.style.borderColor = '#CDE8A8' }}
          />
          <p style={{ textAlign: 'center', fontSize: 13, color: '#7AB85A', marginTop: 8 }}>
            1 - קל, 5 - מאתגר
          </p>
        </div>

        {/* Winning score */}
        <div style={{ background: '#F4FFF4', borderRadius: 18, padding: '18px 22px', border: '1.5px solid #CDE8A8' }}>
          <label style={{ display: 'block', fontSize: 16, fontWeight: 700, color: '#4E8C3A', marginBottom: 10, textAlign: 'center' }}>
            🏆 ניקוד לניצחון
          </label>
          <input
            type="number"
            min="2"
            max="20"
            value={winningScore}
            onChange={(e) => setWinningScore(parseInt(e.target.value))}
            style={fieldStyle}
            onFocus={e => { e.target.style.borderColor = '#6AB840' }}
            onBlur={e => { e.target.style.borderColor = '#CDE8A8' }}
          />
          <p style={{ textAlign: 'center', fontSize: 13, color: '#7AB85A', marginTop: 8 }}>
            כמה נקודות נדרשות לניצחון
          </p>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            textAlign: 'center', fontWeight: 700, fontSize: 15,
            color: message.includes('שגיאה') ? '#C0392B' : '#4E8C3A',
            background: message.includes('שגיאה') ? '#FFF0F0' : '#E8F5DB',
            border: `2px solid ${message.includes('שגיאה') ? '#FFB0B0' : '#CDE8A8'}`,
            borderRadius: 14, padding: '10px 16px',
          }}>
            {message}
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            padding: '13px 24px', fontSize: 17, fontWeight: 700, color: '#fff',
            background: loading ? '#88C87A' : '#52C36E',
            border: 'none', borderRadius: 999,
            boxShadow: loading ? 'none' : '0 7px 0 #36A452',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'Fredoka', 'Varela Round', sans-serif",
            transition: 'transform .1s, box-shadow .1s',
          }}
          onMouseDown={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(4px)'; e.currentTarget.style.boxShadow = '0 3px 0 #36A452' }}}
          onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = loading ? 'none' : '0 7px 0 #36A452' }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = loading ? 'none' : '0 7px 0 #36A452' }}
        >
          {loading ? '⏳ שומר...' : '💾 שמור הגדרות'}
        </button>
      </div>
    </div>
  )
}

export default Settings
