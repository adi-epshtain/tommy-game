import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import Button from '../components/Button'

function PlayerStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Format UTC timestamp (ISO format) to local time
  const formatLocalTime = (utcTimestamp) => {
    if (!utcTimestamp) return ''
    try {
      // Parse ISO format timestamp - JavaScript Date automatically handles UTC
      // If timestamp doesn't have timezone, assume UTC
      let dateStr = utcTimestamp
      if (!utcTimestamp.includes('Z') && !utcTimestamp.includes('+') && !utcTimestamp.includes('-', 10)) {
        // If no timezone indicator, append 'Z' to indicate UTC
        dateStr = utcTimestamp.endsWith('Z') ? utcTimestamp : utcTimestamp + 'Z'
      }
      const date = new Date(dateStr)
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return utcTimestamp // Fallback if invalid
      }
      
      // Format to local time: DD/MM/YYYY HH:MM
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${day}/${month}/${year} ${hours}:${minutes}`
    } catch (e) {
      return utcTimestamp // Fallback to original if parsing fails
    }
  }

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

  if (error) {
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
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="text-2xl font-bold mb-4 text-red-600">❌ שגיאה</div>
            <p className="text-lg text-gray-700 mb-6">{error}</p>
            <Button onClick={() => navigate('/game')}>
              ← חזור למשחק
            </Button>
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
          <div className="sticky top-0 bg-white z-20 pb-4 mb-4 border-b-2 border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold" style={{ color: '#654321' }}>סטטיסטיקות שחקן</h1>
              <Button onClick={() => navigate('/game')}>
                ← חזור למשחק
              </Button>
            </div>
            <h2 className="text-2xl font-semibold text-center" style={{ color: '#654321' }}>שחקן: {stats?.player_name}</h2>
          </div>
      
          <div className="space-y-6">
            {stats?.player_stats && stats.player_stats.length > 0 ? (
              stats.player_stats.map((session, idx) => (
              <div 
                key={idx} 
                className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 shadow-lg border-2 border-amber-200 hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold" style={{ color: '#654321' }}>
                    🎮 סשן {idx + 1}
                  </h3>
                  <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full shadow-sm">
                    ⏰ {formatLocalTime(session.started_at)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-100 rounded-lg p-4 text-center border-2 border-green-300">
                    <div className="text-3xl font-bold text-green-700">{session.correct_count}</div>
                    <div className="text-sm font-semibold text-green-800">✅ תשובות נכונות</div>
                  </div>
                  <div className="bg-red-100 rounded-lg p-4 text-center border-2 border-red-300">
                    <div className="text-3xl font-bold text-red-700">{session.incorrect_count}</div>
                    <div className="text-sm font-semibold text-red-800">❌ תשובות שגויות</div>
                  </div>
                </div>
                
                {session.wrong_answer && session.wrong_answer.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-lg font-bold mb-3" style={{ color: '#654321' }}>
                      📝 שאלות שגויות:
                    </h4>
                    <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                      <ul className="space-y-2">
                        {session.wrong_answer.map((q, i) => (
                          <li 
                            key={i} 
                            className="flex items-center gap-2 text-gray-700"
                            dir="ltr"
                          >
                            <span className="text-red-500 font-bold">•</span>
                            <span className="text-lg">{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              ))
            ) : (
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8 text-center border-2 border-blue-200 shadow-lg">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: '#654321' }}>אין עדיין סטטיסטיקות</h3>
                <p className="text-lg text-gray-600 mb-6">עדיין לא שיחקת משחקים. התחל לשחק כדי לראות את הסטטיסטיקות שלך!</p>
                <Button onClick={() => navigate('/game')}>
                  🎮 התחל לשחק
                </Button>
              </div>
            )}
          </div>
      
        </div>
      </div>
    </div>
  )
}

export default PlayerStats

