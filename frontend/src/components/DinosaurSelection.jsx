import { useState, useEffect } from 'react'
import { api } from '../services/api'
import Button from './Button'

function DinosaurSelection({ onSelect, onSkip, playerStage = 1, playerDinosaurs = [], viewOnly = false }) {
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

  const levelColors = {
    '1': 'from-gray-100 to-gray-200 border-gray-300',
    '2': 'from-blue-100 to-blue-200 border-blue-400',
    '3': 'from-purple-100 to-purple-200 border-purple-500',
    '4': 'from-yellow-100 to-yellow-200 border-yellow-500',
    '5': 'from-red-100 to-pink-200 border-red-600'
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
        {viewOnly ? '🦕 דינוזאורים זמינים' : '🦕 בחר דינוזאור חדש לאוסף שלך!'}
      </h2>
      
      {error && (
        <div className="bg-red-100 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="mb-6 max-h-96 overflow-y-auto space-y-6">
        {[1, 2, 3, 4, 5].map((level) => {
          const levelDinosaurs = dinosaurs.filter(d => parseInt(d.level) === level)
          if (levelDinosaurs.length === 0) return null
          
          return (
            <div key={level} className="space-y-2">
              <h3 className="text-xl font-bold mb-3" style={{ color: '#654321' }}>
                רמה {level}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {levelDinosaurs.map((dino) => {
                  const dinoLevel = parseInt(dino.level) || 1
                  const isLevelLocked = dinoLevel > playerStage
                  // Check if dinosaur is owned by comparing IDs
                  const isOwned = playerDinosaurs.some(ownedDino => ownedDino.id === dino.id)
                  const isDisabled = (!viewOnly && (isLevelLocked || isOwned))
                  const isClickable = !viewOnly && !isDisabled
                  
                  return (
                    <div
                      key={dino.id}
                      onClick={() => isClickable && setSelectedId(dino.id)}
                      className={`rounded-xl p-4 transition-all border-2 relative ${
                        isDisabled
                          ? 'opacity-50 cursor-not-allowed bg-gray-200 border-gray-400'
                          : selectedId === dino.id
                          ? 'bg-gradient-to-br from-green-200 to-emerald-200 border-green-500 scale-105 shadow-lg cursor-pointer'
                          : `bg-gradient-to-br ${levelColors[dino.level] || levelColors['1']} border-gray-300 ${viewOnly ? 'cursor-default' : 'hover:scale-102 cursor-pointer'}`
                      }`}
                    >
                      <div className="text-center">
                        {isLevelLocked && (
                          <div className="absolute top-2 right-2 text-2xl">🔒</div>
                        )}
                        {isOwned && !isLevelLocked && (
                          <div className="absolute top-2 right-2 text-2xl">✅</div>
                        )}
                        <img
                          src={dino.image_path}
                          alt={dino.name}
                          className={`mx-auto w-24 h-24 object-contain mb-2 ${isDisabled ? 'grayscale' : ''}`}
                        />
                        <div className="font-bold text-lg mb-1" style={{ color: isDisabled ? '#999' : '#654321' }}>
                          {dino.name}
                        </div>
                        {isLevelLocked && (
                          <div className="text-xs mt-1 text-red-600 font-semibold">
                            🔒 חסום - נצח ברמה {dinoLevel} כדי לפתוח
                          </div>
                        )}
                        {isOwned && !isLevelLocked && (
                          <div className="text-xs mt-1 text-green-600 font-semibold">
                            ✅ כבר קיים באוסף שלך
                          </div>
                        )}
                        {dino.description && !isDisabled && (
                          <div className="text-xs mt-1 text-gray-600">
                            {dino.description}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {dinosaurs.length === 0 ? (
        <div className="text-center py-4 text-gray-600">
          אין דינוזאורים זמינים כרגע. אנא צור דינוזאורים ב-DB.
        </div>
      ) : (
        <div className="flex gap-4 justify-center">
          {!viewOnly && (
            <>
              <Button
                onClick={handleUnlock}
                disabled={!selectedId || unlocking}
                variant="primary"
                style={{ 
                  opacity: (!selectedId || unlocking) ? 0.5 : 1,
                  cursor: (!selectedId || unlocking) ? 'not-allowed' : 'pointer'
                }}
              >
                {unlocking ? 'בוחר...' : '✅ בחר דינוזאור'}
              </Button>
              {onSkip && (
                <Button
                  onClick={onSkip}
                  variant="secondary"
                >
                  דלג
                </Button>
              )}
            </>
          )}
          {viewOnly && onSkip && (
            <Button
              onClick={onSkip}
              variant="secondary"
            >
              ← חזור למשחק
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default DinosaurSelection

