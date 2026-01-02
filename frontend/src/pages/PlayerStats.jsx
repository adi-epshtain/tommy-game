import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

function PlayerStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadStats()
  }, [])

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

  if (loading) {
    return <div>טוען נתונים...</div>
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>
  }

  return (
    <div>
      <h1>סטטיסטיקות שחקן</h1>
      <h2>שחקן: {stats?.player_name}</h2>
      
      {stats?.player_stats?.map((session, idx) => (
        <div key={idx} className="session">
          <h3>סשן {idx + 1}</h3>
          <h4>זמן משחק {session.started_at}</h4>
          <p>תשובות נכונות: {session.correct_count}</p>
          <p>תשובות שגויות: {session.incorrect_count}</p>
          <p>שאלות שגויות:</p>
          <ul>
            {session.wrong_answer?.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      ))}
      
      <button onClick={() => navigate('/game')} style={{ marginTop: '20px' }}>
        חזור למשחק
      </button>
    </div>
  )
}

export default PlayerStats

