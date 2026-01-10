import { useState, useEffect } from 'react'
import { api } from '../services/api'
import Button from './Button'

function DinosaurSelection({ onSelect, onSkip }) {
  const [dinosaurs, setDinosaurs] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unlocking, setUnlocking] = useState(false)

  useEffect(() => {
    loadDinosaurs()
  }, [])

  const loadDinosaurs = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await api.getAvailableDinosaurs()
      setDinosaurs(data)
    } catch (err) {
      setError(`שגיאה בטעינת דינוזאורים: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUnlock = async () => {
    if (!selectedId) return
    
    try {
      setUnlocking(true)
      setError('')
      const result = await api.unlockDinosaur(selectedId)
      // unlockDinosaur already selects the dinosaur, so we can proceed
      if (onSelect) {
        onSelect(selectedId)
      }
    } catch (err) {
      // If it's already unlocked, try to just select it
      if (err.message.includes('already unlocked') || err.message.includes('400')) {
        try {
          await api.selectDinosaur(selectedId)
          if (onSelect) {
            onSelect(selectedId)
          }
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

  const rarityColors = {
    common: 'from-gray-100 to-gray-200 border-gray-300',
    rare: 'from-blue-100 to-blue-200 border-blue-400',
    epic: 'from-purple-100 to-purple-200 border-purple-500',
    legendary: 'from-yellow-100 to-yellow-200 border-yellow-500'
  }

  const rarityLabels = {
    common: 'רגיל',
    rare: 'נדיר',
    epic: 'אפי',
    legendary: 'אגדי'
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-xl" style={{ color: '#654321' }}>⏳ טוען דינוזאורים...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 border-4 border-green-400">
      <h2 className="text-3xl font-bold text-center mb-6" style={{ color: '#654321' }}>
        🦕 בחר דינוזאור חדש לאוסף שלך!
      </h2>
      
      {error && (
        <div className="bg-red-100 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 max-h-96 overflow-y-auto">
        {dinosaurs.map((dino) => (
          <div
            key={dino.id}
            onClick={() => setSelectedId(dino.id)}
            className={`rounded-xl p-4 cursor-pointer transition-all border-2 ${
              selectedId === dino.id
                ? 'bg-gradient-to-br from-green-200 to-emerald-200 border-green-500 scale-105 shadow-lg'
                : `bg-gradient-to-br ${rarityColors[dino.rarity] || rarityColors.common} border-gray-300 hover:scale-102`
            }`}
          >
            <div className="text-center">
              <img
                src={dino.image_path}
                alt={dino.name}
                className="mx-auto w-24 h-24 object-contain mb-2"
                onError={(e) => {
                  e.target.src = '/static/dino.png' // Fallback image
                }}
              />
              <div className="font-bold text-lg mb-1" style={{ color: '#654321' }}>
                {dino.name}
              </div>
              <div className="text-xs font-semibold" style={{ color: '#666' }}>
                {rarityLabels[dino.rarity] || 'רגיל'}
              </div>
              {dino.description && (
                <div className="text-xs mt-1 text-gray-600">
                  {dino.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {dinosaurs.length === 0 ? (
        <div className="text-center py-4 text-gray-600">
          אין דינוזאורים זמינים כרגע. אנא צור דינוזאורים ב-DB.
        </div>
      ) : (
        <div className="flex gap-4 justify-center">
          <Button
            onClick={handleUnlock}
            disabled={!selectedId || unlocking}
            variant="primary"
            style={{ 
              opacity: (!selectedId || unlocking) ? 0.5 : 1,
              cursor: (!selectedId || unlocking) ? 'not-allowed' : 'pointer'
            }}
          >
            {unlocking ? 'פותח...' : '🔓 פתח דינוזאור'}
          </Button>
          {onSkip && (
            <Button
              onClick={onSkip}
              variant="secondary"
            >
              דלג
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default DinosaurSelection

