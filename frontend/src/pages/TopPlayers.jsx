import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import Leaderboard from '../components/Leaderboard'

function TopPlayers() {
  const [topPlayers, setTopPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadTopPlayers()
  }, [])

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

  if (loading) {
    return <div>טוען נתונים...</div>
  }

  return (
    <div>
      <h1>🏆 לוח התוצאות</h1>
      {error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <Leaderboard topPlayers={topPlayers} />
      )}
      <button onClick={() => navigate('/game')} style={{ marginTop: '20px' }}>
        חזור למשחק
      </button>
    </div>
  )
}

export default TopPlayers

