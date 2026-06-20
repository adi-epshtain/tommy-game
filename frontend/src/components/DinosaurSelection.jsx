import { useState, useEffect } from 'react'
import { api } from '../services/api'

function DinosaurSelection({ onSelect, onSkip, playerDinosaurs = [], viewOnly = false }) {
  const [dinosaurs, setDinosaurs] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unlocking, setUnlocking] = useState(false)

  useEffect(() => {
    api.getAvailableDinosaurs()
      .then(data => setDinosaurs(data))
      .catch(err => setError(`שגיאה בטעינת דינוזאורים: ${err.message}`))
      .finally(() => setLoading(false))
  }, [])

  const handleUnlock = async () => {
    if (!selectedId) return
    try {
      setUnlocking(true)
      setError('')
      await api.unlockDinosaur(selectedId)
      if (onSelect) onSelect(selectedId)
    } catch (err) {
      if (err.message.includes('already unlocked') || err.message.includes('400')) {
        try {
          await api.selectDinosaur(selectedId)
          if (onSelect) onSelect(selectedId)
        } catch (selectErr) {
          setError(`שגיאה בבחירת דינוזאור: ${selectErr.message}`)
        }
      } else {
        setError(`שגיאה בפתיחת דינוזאור: ${err.message}`)
      }
    } finally {
      setUnlocking(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', fontFamily: "'Varela Round', sans-serif", fontSize: 18, color: '#4E8C3A' }}>
        ⏳ טוען דינוזאורים...
      </div>
    )
  }

  return (
    <div dir="rtl" style={{
      background: 'rgba(255,255,255,0.97)',
      borderRadius: 36,
      padding: '28px 28px 24px',
      boxShadow: '0 18px 48px rgba(110,170,90,.22)',
      border: '2px solid rgba(255,255,255,.9)',
      fontFamily: "'Varela Round', 'Heebo', sans-serif",
      maxWidth: 960,
      width: '100%',
    }}>
      <h2 style={{
        fontFamily: "'Fredoka', 'Varela Round', sans-serif",
        fontSize: 28,
        fontWeight: 700,
        color: '#4E8C3A',
        textAlign: 'center',
        margin: '0 0 20px',
      }}>
        {viewOnly ? '🦕 כל הדינוזאורים' : '🦕 בחר דינוזאור לאוסף שלך!'}
      </h2>

      {error && (
        <div style={{
          background: '#FFF0F0', border: '1.5px solid #FFB0B0', color: '#C0392B',
          borderRadius: 14, padding: '10px 16px', marginBottom: 16, fontSize: 14,
        }}>
          {error}
        </div>
      )}

      <div style={{ maxHeight: '64vh', overflowY: 'auto', marginBottom: 20 }}>
        {dinosaurs.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#8C7AA8', padding: '20px 0' }}>
            אין דינוזאורים זמינים כרגע
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 14,
          }}>
            {dinosaurs.map((dino) => {
              const isOwned = playerDinosaurs.some(d => d.id === dino.id)
              const isSelected = selectedId === dino.id
              const isClickable = !viewOnly && !isOwned

              return (
                <div
                  key={dino.id}
                  onClick={() => isClickable && setSelectedId(dino.id)}
                  style={{
                    borderRadius: 20,
                    padding: '14px 10px',
                    textAlign: 'center',
                    cursor: isClickable ? 'pointer' : 'default',
                    position: 'relative',
                    border: isSelected
                      ? '2.5px solid #6AB840'
                      : isOwned
                      ? '2px solid #CDE8A8'
                      : '2px solid #E0EDD8',
                    background: isSelected
                      ? 'linear-gradient(135deg, #E0F7D0, #D0F0E0)'
                      : isOwned
                      ? '#F4FFF4'
                      : '#FAFFFE',
                    boxShadow: isSelected
                      ? '0 6px 18px rgba(106,184,64,.3)'
                      : '0 3px 10px rgba(110,170,90,.1)',
                    transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                    transition: 'transform .15s, box-shadow .15s, border-color .15s',
                  }}
                >
                  {isOwned && (
                    <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 16 }}>✅</div>
                  )}
                  <img
                    src={dino.image_path}
                    alt={dino.name}
                    style={{ width: 72, height: 72, objectFit: 'contain', marginBottom: 8 }}
                  />
                  <div style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: '#4E8C3A',
                    lineHeight: 1.3,
                  }}>
                    {dino.name}
                  </div>
                  {isOwned && (
                    <div style={{ fontSize: 11, color: '#7AB85A', marginTop: 4 }}>
                      באוסף שלך
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {!viewOnly && (
          <button
            onClick={handleUnlock}
            disabled={!selectedId || unlocking}
            style={{
              padding: '12px 32px',
              fontSize: 16,
              fontWeight: 700,
              borderRadius: 999,
              border: '2px solid #CDE8A8',
              background: selectedId && !unlocking ? '#fff' : '#f5f5f5',
              color: selectedId && !unlocking ? '#4E8C3A' : '#aaa',
              cursor: selectedId && !unlocking ? 'pointer' : 'not-allowed',
              boxShadow: selectedId && !unlocking ? '0 6px 0 #CDE8A8' : 'none',
              fontFamily: "'Varela Round', sans-serif",
              transition: 'box-shadow .1s, transform .1s',
            }}
            onMouseDown={e => { if (selectedId && !unlocking) { e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.boxShadow = '0 3px 0 #CDE8A8' }}}
            onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = selectedId && !unlocking ? '0 6px 0 #CDE8A8' : 'none' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = selectedId && !unlocking ? '0 6px 0 #CDE8A8' : 'none' }}
          >
            {unlocking ? '⏳ בוחר...' : '✅ בחר דינוזאור'}
          </button>
        )}
        {onSkip && (
          <button
            onClick={onSkip}
            style={{
              padding: '12px 28px',
              fontSize: 16,
              fontWeight: 700,
              borderRadius: 999,
              border: '2px solid #E0EDD8',
              background: '#fff',
              color: '#7AB85A',
              cursor: 'pointer',
              boxShadow: '0 6px 0 #E0EDD8',
              fontFamily: "'Varela Round', sans-serif",
            }}
          >
            {viewOnly ? '← חזור למשחק' : 'דלג'}
          </button>
        )}
      </div>
    </div>
  )
}

export default DinosaurSelection
