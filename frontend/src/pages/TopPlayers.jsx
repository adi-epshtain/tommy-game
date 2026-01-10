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

  const handlePlayAgain = async () => {
    try {
      await api.startGame(5)
      navigate('/game')
    } catch (err) {
      alert('אירעה שגיאה בהתחלת המשחק')
      console.error(err)
    }
  }

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
      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center p-8 z-10">
        {/* Fixed Header with Play Again Button - Always visible at top */}
        <div className="w-full max-w-4xl mb-4 z-30 fixed top-8 left-1/2 transform -translate-x-1/2" style={{ maxWidth: '56rem' }}>
          <div className="bg-white rounded-xl shadow-2xl p-4 border-4 border-green-400" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <div className="flex justify-between items-center gap-4">
              <h1 className="text-3xl font-bold" style={{ color: '#654321' }}>🏆 לוח התוצאות</h1>
              <Button onClick={handlePlayAgain} size="lg" style={{ fontSize: '1.25rem', padding: '0.75rem 1.5rem', fontWeight: 'bold' }}>
                🎮 שחק שוב
              </Button>
            </div>
          </div>
        </div>
        
        {/* Scrollable Content - with top padding to account for fixed header */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full flex-1 overflow-y-auto mt-24">
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

