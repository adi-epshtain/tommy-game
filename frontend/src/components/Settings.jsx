import { useState, useEffect } from 'react'
import { api } from '../services/api'
import Button from '../components/Button'

function Settings({ onSettingsSaved }) {
  const [difficulty, setDifficulty] = useState(1)
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
      await api.saveSettings(difficulty, winningScore, currentStage)
      setMessage('🎮 ההגדרות נשמרו בהצלחה!')
      setTimeout(() => setMessage(''), 3000)
      if (onSettingsSaved) {
        onSettingsSaved()
      }
    } catch (err) {
      setMessage('שגיאה בשמירת ההגדרות')
    } finally {
      setLoading(false)
    }
  }

  if (loadingState) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-amber-300">
        <div className="text-center">טוען...</div>
      </div>
    )
  }

  return (
    <div id="settings" className="bg-white rounded-xl p-6 shadow-lg border-2 border-amber-300">
      <div className="space-y-4">
        <div>
          <label className="block text-lg font-semibold mb-2">רמה נוכחית (למשחק הנוכחי):</label>
          <input
            type="number"
            id="current_stage"
            min="1"
            max="5"
            value={currentStage}
            onChange={(e) => setCurrentStage(parseInt(e.target.value))}
            className="w-full max-w-xs mx-auto px-4 py-2 text-center border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <p className="text-sm text-gray-600 mt-1 text-center">שינוי הרמה הנוכחית ישפיע מיד על המשחק</p>
        </div>
        <div>
          <label className="block text-lg font-semibold mb-2">ניקוד לניצחון:</label>
          <input
            type="number"
            id="winning_score"
            min="2"
            max="10"
            value={winningScore}
            onChange={(e) => setWinningScore(parseInt(e.target.value))}
            className="w-full max-w-xs mx-auto px-4 py-2 text-center border-2 border-amber-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>
        {message && (
          <p className={`text-center font-semibold ${message.includes('שגיאה') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}
        <div className="text-center">
          <Button 
            variant="info"
            onClick={handleSave} 
            disabled={loading}
          >
            {loading ? 'שומר...' : 'שמור הגדרות'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Settings

