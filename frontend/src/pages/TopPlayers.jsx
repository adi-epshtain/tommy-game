import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import Leaderboard from '../components/Leaderboard'
import Button from '../components/Button'

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
    return (
      <div 
        className="min-h-screen w-full relative overflow-hidden flex items-center justify-center" 
        style={{
          backgroundImage: 'url(/static/math_dino2.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-2xl font-bold text-center" style={{ color: '#654321' }}>
              ⏳ טוען נתונים...
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen w-full relative overflow-hidden" 
      style={{
        backgroundImage: 'url(/static/math_dino2.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center p-8 z-10">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
          <div className="sticky top-0 bg-white z-20 pb-4 mb-6 border-b-2 border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold" style={{ color: '#654321' }}>🏆 לוח התוצאות</h1>
              <Button onClick={() => navigate('/game')}>
                ← חזור למשחק
              </Button>
            </div>
          </div>
          {error ? (
            <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200 text-center">
              <div className="text-2xl font-bold mb-2 text-red-600">❌ שגיאה</div>
              <p className="text-lg text-gray-700">{error}</p>
            </div>
          ) : (
            <Leaderboard topPlayers={topPlayers} />
          )}
        </div>
      </div>
    </div>
  )
}

export default TopPlayers

