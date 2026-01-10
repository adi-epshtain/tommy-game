import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, removeToken } from '../services/api'
import Button from '../components/Button'
import Leaderboard from '../components/Leaderboard'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'

function AdminDashboard() {
  const [players, setPlayers] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [playerStats, setPlayerStats] = useState(null)
  const [playerTrends, setPlayerTrends] = useState(null)
  const [viewType, setViewType] = useState('stats') // 'stats', 'trends', 'compare'
  const [trendPeriod, setTrendPeriod] = useState('week') // 'week' or 'month'
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)
  const [loadingTrends, setLoadingTrends] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [playerToDelete, setPlayerToDelete] = useState(null)
  const [topPlayers, setTopPlayers] = useState([])
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
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

  const loadTopPlayers = async () => {
    try {
      setLoadingLeaderboard(true)
      setError('')
      const data = await api.getTopPlayers()
      setTopPlayers(data.top_players || [])
      setShowLeaderboard(true)
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403')) {
        handleLogout()
      } else {
        setError(`שגיאה בטעינת לוח התוצאות: ${err.message}`)
      }
    } finally {
      setLoadingLeaderboard(false)
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
      setViewType('stats')
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

  const loadPlayerTrends = async (playerId, period) => {
    try {
      setLoadingTrends(true)
      setError('')
      const trends = await api.getPlayerTrends(playerId, period)
      setPlayerTrends(trends)
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403')) {
        handleLogout()
      } else {
        setError(`שגיאה בטעינת מגמות: ${err.message}`)
      }
    } finally {
      setLoadingTrends(false)
    }
  }

  const handleTrendPeriodChange = (period) => {
    setTrendPeriod(period)
    if (selectedPlayer) {
      loadPlayerTrends(selectedPlayer, period)
    }
  }

  const handleViewTypeChange = (type) => {
    setViewType(type)
    if (type === 'trends' && selectedPlayer && !playerTrends) {
      loadPlayerTrends(selectedPlayer, trendPeriod)
    }
  }

  const handleDeleteClick = (playerId, playerName) => {
    setPlayerToDelete({ id: playerId, name: playerName })
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!playerToDelete) return
    
    try {
      await api.deletePlayer(playerToDelete.id)
      setShowDeleteConfirm(false)
      setPlayerToDelete(null)
      if (selectedPlayer === playerToDelete.id) {
        handleBackToList()
      }
      loadPlayers()
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403')) {
        handleLogout()
      } else {
        setError(`שגיאה במחיקת שחקן: ${err.message}`)
      }
    }
  }

  const handleLogout = () => {
    removeToken()
    navigate('/admin/login')
  }

  const handleBackToList = () => {
    setSelectedPlayer(null)
    setPlayerStats(null)
    setPlayerTrends(null)
    setViewType('stats')
  }

  const handleExcludeFromLeaderboard = async (playerId) => {
    if (!confirm('האם אתה בטוח שברצונך להחריג שחקן זה מלוח התוצאות?')) {
      return
    }
    
    try {
      await api.excludePlayerFromLeaderboard(playerId)
      loadPlayers() // Refresh list to show updated status
      // Refresh leaderboard if it's currently shown
      if (showLeaderboard) {
        await loadTopPlayers()
      }
      if (selectedPlayer === playerId) {
        handleBackToList() // Go back to list to see updated status
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403')) {
        handleLogout()
      } else {
        setError(`שגיאה בהחרגת שחקן מלוח התוצאות: ${err.message}`)
      }
    }
  }

  const handleIncludeInLeaderboard = async (playerId) => {
    if (!confirm('האם אתה בטוח שברצונך להחזיר שחקן זה ללוח התוצאות?')) {
      return
    }
    
    try {
      await api.includePlayerInLeaderboard(playerId)
      loadPlayers() // Refresh list to show updated status
      // Refresh leaderboard if it's currently shown
      if (showLeaderboard) {
        await loadTopPlayers()
      }
      if (selectedPlayer === playerId) {
        handleBackToList() // Go back to list to see updated status
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403')) {
        handleLogout()
      } else {
        setError(`שגיאה בהחזרת שחקן ללוח התוצאות: ${err.message}`)
      }
    }
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
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto relative">
            <div className="sticky top-0 bg-white z-20 pb-4 mb-4 border-b-2 border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold" style={{ color: '#654321' }}>סטטיסטיקות שחקן</h1>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleDeleteClick(playerStats.player_id, playerStats.player_name)}
                    variant="danger"
                  >
                    🗑️ מחק שחקן
                  </Button>
                  <Button onClick={handleBackToList}>
                    ← חזור לרשימה
                  </Button>
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-center" style={{ color: '#654321' }}>
                שחקן: {playerStats.player_name} (ID: {playerStats.player_id})
              </h2>
              
              {/* Tabs */}
              <div className="flex gap-2 mt-4 border-b-2 border-gray-200">
                <button
                  onClick={() => handleViewTypeChange('stats')}
                  className={`px-4 py-2 font-semibold transition-colors ${
                    viewType === 'stats' 
                      ? 'border-b-4 border-amber-500 text-amber-700' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📊 סטטיסטיקות
                </button>
                <button
                  onClick={() => handleViewTypeChange('trends')}
                  className={`px-4 py-2 font-semibold transition-colors ${
                    viewType === 'trends' 
                      ? 'border-b-4 border-amber-500 text-amber-700' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📈 מגמות
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {/* Stats View */}
            {viewType === 'stats' && (
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
            )}

            {/* Trends View */}
            {viewType === 'trends' && (
              <div className="space-y-6">
                {/* Period selector */}
                <div className="flex gap-4 items-center justify-center mb-6">
                  <label className="text-lg font-semibold" style={{ color: '#654321' }}>בחר תקופה:</label>
                  <button
                    onClick={() => handleTrendPeriodChange('week')}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                      trendPeriod === 'week'
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    שבועי
                  </button>
                  <button
                    onClick={() => handleTrendPeriodChange('month')}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                      trendPeriod === 'month'
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    חודשי
                  </button>
                </div>

                {loadingTrends ? (
                  <div className="text-center py-8">
                    <div className="text-xl" style={{ color: '#654321' }}>⏳ טוען מגמות...</div>
                  </div>
                ) : playerTrends && playerTrends.trends && playerTrends.trends.length > 0 ? (
                  <>
                    {/* Charts */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 shadow-lg border-2 border-blue-200 mb-6">
                      <h3 className="text-2xl font-bold mb-4 text-center" style={{ color: '#654321' }}>
                        ממוצע ציונים לפי תקופה
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={playerTrends.trends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="period_label" 
                            style={{ fontSize: '12px' }}
                          />
                          <YAxis style={{ fontSize: '12px' }} />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="avg_score" 
                            stroke="#f59e0b" 
                            strokeWidth={2}
                            name="ממוצע ציון"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-lg border-2 border-green-200 mb-6">
                      <h3 className="text-2xl font-bold mb-4 text-center" style={{ color: '#654321' }}>
                        אחוז הצלחה לפי תקופה
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={playerTrends.trends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="period_label" 
                            style={{ fontSize: '12px' }}
                          />
                          <YAxis style={{ fontSize: '12px' }} />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="success_rate" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            name="אחוז הצלחה (%)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-lg border-2 border-purple-200 mb-6">
                      <h3 className="text-2xl font-bold mb-4 text-center" style={{ color: '#654321' }}>
                        מספר משחקים לפי תקופה
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={playerTrends.trends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="period_label" 
                            style={{ fontSize: '12px' }}
                          />
                          <YAxis style={{ fontSize: '12px' }} />
                          <Tooltip />
                          <Legend />
                          <Bar 
                            dataKey="total_games" 
                            fill="#a855f7"
                            name="מספר משחקים"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
                      <h3 className="text-2xl font-bold mb-4 text-center" style={{ color: '#654321' }}>
                        טבלת נתונים מפורטת
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                          <thead>
                            <tr className="bg-amber-100">
                              <th className="border-2 border-gray-300 px-4 py-2">תקופה</th>
                              <th className="border-2 border-gray-300 px-4 py-2">מספר משחקים</th>
                              <th className="border-2 border-gray-300 px-4 py-2">ממוצע ציון</th>
                              <th className="border-2 border-gray-300 px-4 py-2">אחוז הצלחה</th>
                              <th className="border-2 border-gray-300 px-4 py-2">תשובות נכונות</th>
                              <th className="border-2 border-gray-300 px-4 py-2">תשובות שגויות</th>
                            </tr>
                          </thead>
                          <tbody>
                            {playerTrends.trends.map((trend, idx) => (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                <td className="border-2 border-gray-300 px-4 py-2 font-semibold">{trend.period_label}</td>
                                <td className="border-2 border-gray-300 px-4 py-2">{trend.total_games}</td>
                                <td className="border-2 border-gray-300 px-4 py-2">{trend.avg_score}</td>
                                <td className="border-2 border-gray-300 px-4 py-2">{trend.success_rate}%</td>
                                <td className="border-2 border-gray-300 px-4 py-2 text-green-700 font-semibold">{trend.total_correct}</td>
                                <td className="border-2 border-gray-300 px-4 py-2 text-red-700 font-semibold">{trend.total_incorrect}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8 text-center border-2 border-blue-200 shadow-lg">
                    <div className="text-6xl mb-4">📈</div>
                    <h3 className="text-2xl font-bold mb-2" style={{ color: '#654321' }}>אין עדיין נתוני מגמות</h3>
                    <p className="text-lg text-gray-600">לשחקן הזה עדיין אין מספיק נתונים להצגת מגמות.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Show leaderboard view
  if (showLeaderboard) {
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
                <h1 className="text-3xl font-bold" style={{ color: '#654321' }}>🏆 לוח התוצאות</h1>
                <div className="flex gap-2">
                  <Button onClick={() => {
                    setShowLeaderboard(false)
                    loadPlayers()
                  }}>
                    ← חזרה לרשימת שחקנים
                  </Button>
                  <Button onClick={handleLogout}>
                    התנתק
                  </Button>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {loadingLeaderboard ? (
              <div className="text-center py-8">
                <div className="text-xl" style={{ color: '#654321' }}>⏳ טוען לוח תוצאות...</div>
              </div>
            ) : (
              <div className="mb-6">
                <Leaderboard topPlayers={topPlayers} />
              </div>
            )}
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
              <div className="flex gap-2">
                <Button onClick={loadTopPlayers}>
                  🏆 לוח תוצאות
                </Button>
                <Button onClick={handleLogout}>
                  התנתק
                </Button>
              </div>
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
                  className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border-2 border-blue-200 hover:shadow-lg transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div 
                      onClick={() => handlePlayerClick(player.id)}
                      className="flex-1 cursor-pointer hover:scale-[1.02] transition-transform"
                    >
                      <div className="text-xl font-bold" style={{ color: '#654321' }}>
                        👤 {player.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        ID: {player.id} {player.age && `| גיל: ${player.age}`} 
                        {player.created_at && ` | נרשם: ${formatLocalTime(player.created_at)}`}
                        {player.excluded_from_leaderboard && (
                          <span className="ml-2 px-2 py-0.5 bg-red-200 text-red-700 rounded-full text-xs font-semibold">
                            🚫 הוחרג מלוח התוצאות
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {player.excluded_from_leaderboard ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleIncludeInLeaderboard(player.id)
                          }}
                          className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-semibold"
                          title="החזר ללוח התוצאות"
                        >
                          ✅ החזר ללוח
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleExcludeFromLeaderboard(player.id)
                          }}
                          className="px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-semibold"
                          title="החרג מלוח התוצאות"
                        >
                          🚫 החרג מלוח
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteClick(player.id, player.name)
                        }}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold"
                      >
                        🗑️ מחק
                      </button>
                      <div className="text-2xl">👉</div>
                    </div>
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

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && playerToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: '#654321' }}>
              ⚠️ אישור מחיקה
            </h2>
            <p className="text-lg text-gray-700 mb-6 text-center">
              האם אתה בטוח שברצונך למחוק את השחקן <strong>{playerToDelete.name}</strong>?
              <br />
              <span className="text-red-600 font-semibold">פעולה זו אינה ניתנת לביטול!</span>
              <br />
              כל הנתונים הקשורים לשחקן זה יימחקו (משחקים, תשובות, סטטיסטיקות).
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setPlayerToDelete(null)
                }}
                className="bg-gray-500 hover:bg-gray-600"
              >
                ביטול
              </Button>
              <Button
                onClick={confirmDelete}
                variant="danger"
              >
                מחק
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard

