import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, removeToken } from '../services/api'
import Button from '../components/Button'

function AdminDashboard() {
  const [players, setPlayers] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [playerStats, setPlayerStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10
  const navigate = useNavigate()

  const formatLocalTime = (utcTimestamp) => {
    if (!utcTimestamp) return ''
    try {
      let dateStr = utcTimestamp
      if (!utcTimestamp.includes('Z') && !utcTimestamp.includes('+') && !utcTimestamp.includes('-', 10)) {
        dateStr = utcTimestamp.endsWith('Z') ? utcTimestamp : utcTimestamp + 'Z'
      }
      const date = new Date(dateStr)
      
      if (isNaN(date.getTime())) {
        return utcTimestamp
      }
      
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${day}/${month}/${year} ${hours}:${minutes}`
    } catch (e) {
      return utcTimestamp
    }
  }

  useEffect(() => {
    loadPlayers()
  }, [currentPage, searchTerm])

  const loadPlayers = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await api.getPlayers(currentPage, pageSize, searchTerm)
      setPlayers(data.players)
      setTotalPages(data.total_pages)
      setTotal(data.total)
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403')) {
        handleLogout()
      } else {
        setError(`שגיאה: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    loadPlayers()
  }

  const handlePlayerClick = async (playerId) => {
    try {
      setLoadingStats(true)
      setError('')
      const stats = await api.getPlayerStatsAdmin(playerId)
      setPlayerStats(stats)
      setSelectedPlayer(playerId)
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403')) {
        handleLogout()
      } else {
        setError(`שגיאה בטעינת סטטיסטיקות: ${err.message}`)
      }
    } finally {
      setLoadingStats(false)
    }
  }

  const handleLogout = () => {
    removeToken()
    navigate('/admin/login')
  }

  const handleBackToList = () => {
    setSelectedPlayer(null)
    setPlayerStats(null)
  }

  if (loading && !selectedPlayer) {
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

  // Show player stats view
  if (selectedPlayer && playerStats) {
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
                <Button onClick={handleBackToList}>
                  ← חזור לרשימה
                </Button>
              </div>
              <h2 className="text-2xl font-semibold text-center" style={{ color: '#654321' }}>
                שחקן: {playerStats.player_name} (ID: {playerStats.player_id})
              </h2>
            </div>
      
            <div className="space-y-6">
              {playerStats.player_stats && playerStats.player_stats.length > 0 ? (
                playerStats.player_stats.map((session, idx) => (
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
                  <p className="text-lg text-gray-600">לשחקן הזה עדיין אין סטטיסטיקות.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show players list view
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
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white z-20 pb-4 mb-4 border-b-2 border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold" style={{ color: '#654321' }}>🔧 לוח בקרת מנהל</h1>
              <Button onClick={handleLogout}>
                התנתק
              </Button>
            </div>
            
            <div className="flex gap-4 items-center">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="חפש לפי שם..."
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
              />
              <Button onClick={handleSearch}>
                🔍 חפש
              </Button>
            </div>
            
            <div className="mt-2 text-sm text-gray-600">
              סה"כ משתמשים: {total}
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {loadingStats && (
            <div className="text-center py-8">
              <div className="text-xl" style={{ color: '#654321' }}>⏳ טוען סטטיסטיקות...</div>
            </div>
          )}

          <div className="space-y-2 mb-6">
            {players.length > 0 ? (
              players.map((player) => (
                <div
                  key={player.id}
                  onClick={() => handlePlayerClick(player.id)}
                  className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border-2 border-blue-200 hover:shadow-lg cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xl font-bold" style={{ color: '#654321' }}>
                        👤 {player.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        ID: {player.id} {player.age && `| גיל: ${player.age}`} 
                        {player.created_at && ` | נרשם: ${formatLocalTime(player.created_at)}`}
                      </div>
                    </div>
                    <div className="text-2xl">👉</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <div className="text-xl text-gray-600">אין משתמשים</div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <Button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ← הקודם
              </Button>
              <div className="text-lg font-semibold" style={{ color: '#654321' }}>
                עמוד {currentPage} מתוך {totalPages}
              </div>
              <Button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                הבא →
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard

