import { useState } from 'react'
import { api } from '../services/api'

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
    <div id="settings">
      <h3>⚙️ הגדרות משחק</h3>
      <label>רמת קושי התחלתית:</label>
      <input
        type="number"
        id="difficulty"
        min="1"
        max="5"
        value={difficulty}
        onChange={(e) => setDifficulty(parseInt(e.target.value))}
      />
      <br />
      <label>ניקוד לניצחון:</label>
      <input
        type="number"
        id="winning_score"
        min="2"
        max="10"
        value={winningScore}
        onChange={(e) => setWinningScore(parseInt(e.target.value))}
      />
      <br />
      {message && <p style={{ color: message.includes('שגיאה') ? 'red' : 'green' }}>{message}</p>}
      <button onClick={handleSave} disabled={loading}>
        {loading ? 'שומר...' : 'שמור הגדרות'}
      </button>
    </div>
  )
}

export default Settings

