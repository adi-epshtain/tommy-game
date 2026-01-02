import { useState } from 'react'
import { api } from '../services/api'
import Button from '../components/Button'

function Settings() {
  const [difficulty, setDifficulty] = useState(1)
  const [winningScore, setWinningScore] = useState(5)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSave = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      await api.saveSettings(difficulty, winningScore)
      setMessage('🎮 ההגדרות נשמרו בהצלחה!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('שגיאה בשמירת ההגדרות')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id="settings" className="bg-white rounded-xl p-6 shadow-lg border-2 border-amber-300">
      <h3 className="text-2xl font-bold mb-4 text-center">⚙️ הגדרות משחק</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-lg font-semibold mb-2">רמת קושי התחלתית:</label>
          <input
            type="number"
            id="difficulty"
            min="1"
            max="5"
            value={difficulty}
            onChange={(e) => setDifficulty(parseInt(e.target.value))}
            className="w-full max-w-xs mx-auto px-4 py-2 text-center border-2 border-amber-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
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

