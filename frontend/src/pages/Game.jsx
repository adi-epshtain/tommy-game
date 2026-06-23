import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, removeToken } from '../services/api'
import Settings from '../components/Settings'
import Leaderboard from '../components/Leaderboard'
import Button from '../components/Button'
import DinosaurSelection from '../components/DinosaurSelection'
import { useSounds } from '../hooks/useSounds'

const MATH_GAME = 'Math Game'

function Game({ onLogout }) {
  const [playerName, setPlayerName] = useState('')
  const [question, setQuestion] = useState('')
  const [currentQuestionId, setCurrentQuestionId] = useState(null)
  const [score, setScore] = useState(0)
  const [stage, setStage] = useState(1)
  const [result, setResult] = useState('')
  const [answer, setAnswer] = useState('')
  const [wrongQuestions, setWrongQuestions] = useState([])
  const [gameEnded, setGameEnded] = useState(false)
  const [gameEndData, setGameEndData] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showTop3Celebration, setShowTop3Celebration] = useState(false) // Celebration for top 3
  const [playerRank, setPlayerRank] = useState(null) // Player's rank (1, 2, or 3)
  const [winningScore, setWinningScore] = useState(5) // Default, will be updated from settings
  const [showScorePopup, setShowScorePopup] = useState(false)
  const [scoreChange, setScoreChange] = useState(0)
  const [questionFade, setQuestionFade] = useState(false)
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false)
  const [advanceInfo, setAdvanceInfo] = useState(null)
  const [showDinosaurSelection, setShowDinosaurSelection] = useState(false)
  const [playerDinosaurs, setPlayerDinosaurs] = useState([]) // All dinosaurs in player's collection
  const [showDinosaurGallery, setShowDinosaurGallery] = useState(false) // Gallery view
  const [showDinosaurViewOnly, setShowDinosaurViewOnly] = useState(false) // View-only mode (browse all dinosaurs)
  // Mute is shared across games and remembered between sessions.
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('tommy_muted') === '1')
  const navigate = useNavigate()
  const { playCelebrationSound, playErrorSound, playTop3VictorySound } = useSounds(isMuted)

  useEffect(() => {
    localStorage.setItem('tommy_muted', isMuted ? '1' : '0')
  }, [isMuted])



  useEffect(() => {
    loadPlayerInfo()
    loadPlayerDinosaurs()
  }, [])

  const loadPlayerInfo = async () => {
    try {
      const data = await api.getPlayerInfo()
      setPlayerName(data.name)
      await startGame(data.name)
    } catch (err) {
      console.error('Failed to load player info:', err)
      navigate('/login')
    }
  }

  const loadPlayerDinosaurs = async () => {
    try {
      const dinosaurs = await api.getMyDinosaurs()
      setPlayerDinosaurs(dinosaurs)
    } catch (err) {
      console.error('Failed to load player dinosaurs:', err)
      // Don't fail completely if dinosaurs fail to load
    }
  }

  const startGame = async (name, advanceStage = null) => {
    try {
      // Reset all game-related states first
      setGameEnded(false)
      setGameEndData(null)
      setShowDinosaurSelection(false)
      setShowTop3Celebration(false)
      setPlayerRank(null)
      setShowAdvanceDialog(false)
      setAdvanceInfo(null)
      setResult('')
      setAnswer('')
      setWrongQuestions([])
      setScore(0)
      setShowCelebration(false)

      const data = await api.startGame(5, advanceStage)
      
      // בדוק אם השחקן מוכן לעלות רמה
      if (data.ready_to_advance) {
        setAdvanceInfo(data)
        setShowAdvanceDialog(true)
        return
      }
      
      // אם לא צריך אישור, התחל משחק רגיל
      setQuestion(data.question)
      setCurrentQuestionId(data.question_id)
      setStage(data.stage || 1)
      // Reload player's dinosaurs to show any newly unlocked ones
      await loadPlayerDinosaurs()
      // Load winning score from current game state
      try {
        const state = await api.getCurrentGameState()
        setWinningScore(state.winning_score)
      } catch (err) {
        console.error('Failed to load game state:', err)
      }
    } catch (err) {
      alert('אירעה שגיאה בהתחלת המשחק')
      console.error(err)
    }
  }

  const handleAdvanceConfirm = async () => {
    setShowAdvanceDialog(false)
    await startGame(playerName, true) // מאשרים לעלות רמה
  }

  const handleAdvanceCancel = async () => {
    setShowAdvanceDialog(false)
    await startGame(playerName, false) // לא מאשרים - נשארים ברמה הנוכחית
  }

  const handleSubmitAnswer = async (e) => {
    e.preventDefault()
    if (!answer || !currentQuestionId) return

    try {
      const data = await api.submitAnswer(answer, currentQuestionId, MATH_GAME)
      
      if (data.redirect) {
        await showGameEnd()
      } else {
        setScore(data.score)
        setStage(data.stage)
        
        if (data.is_correct) {
          setShowCelebration(true)
          playCelebrationSound() // Play celebration sound
          setTimeout(() => setShowCelebration(false), 1500)
          
          // Score popup animation
          setScoreChange(1)
          setShowScorePopup(true)
          setTimeout(() => setShowScorePopup(false), 1000)
          
          setResult('✅ נכון! כל הכבוד!')
        } else {
          playErrorSound() // Play error sound
          setResult('❌ לא נכון! נסה שוב! 💪')
          setScoreChange(-1)
          setShowScorePopup(true)
          setTimeout(() => setShowScorePopup(false), 1000)
        }
        
        // Question transition animation
        setQuestionFade(true)
        setTimeout(() => {
          setQuestion(data.question)
          setQuestionFade(false)
        }, 300)
        setAnswer('')
        setCurrentQuestionId(data.question_id)
        setWrongQuestions(data.wrong_questions || [])
      }
    } catch (err) {
      console.error('Failed to submit answer:', err)
      // Don't leave the child stuck on a frozen screen — give feedback and let them retry.
      setResult('😅 אופס! משהו השתבש. נסו שוב')
      setAnswer('')
    }
  }

  const showGameEnd = async () => {
    try {
      const data = await api.getGameEnd()
      setGameEndData(data)
      
      // Reload player dinosaurs to get the latest collection
      await loadPlayerDinosaurs()
      
      // בדוק אם השחקן במקום 1-3 בלוח התוצאות (מהבאק אנד יש player_rank)
      const playerRank = data.player_rank
      if (playerRank && playerRank >= 1 && playerRank <= 3) {
        setPlayerRank(playerRank)
        setShowTop3Celebration(true)
        setGameEnded(false) // Reset כדי שהרקע יוצג במסך החגיגה
        playTop3VictorySound(playerRank) // Play applause sound
        // לאחר 2.5 שניות, עבר למסך הסיום הרגיל
        setTimeout(() => {
          setShowTop3Celebration(false)
          setGameEnded(false) // ודא ש-gameEnded false למסך בחירת דינוזאור
          setShowDinosaurSelection(true) // הצג בחירת דינוזאור
        }, 2500)
      } else {
        // אחרי ניצחון רגיל, הצג בחירת דינוזאור
        setPlayerRank(null) // ודא שלא נשאר rank ישן
        setGameEnded(false) // Reset כדי שהרקע יוצג במסך בחירת דינוזאור
        setShowDinosaurSelection(true)
      }
    } catch (err) {
      alert('אירעה שגיאה בטעינת סיום המשחק')
      console.error(err)
    }
  }

  const handleDinosaurSelected = async (dinosaurId) => {
    try {
      // Close selection screen first
      setShowDinosaurSelection(false)
      // Reload player's dinosaurs (new one was just unlocked) - do this after closing selection screen
      await loadPlayerDinosaurs()
      // Small delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 100))
      // Show game end screen with leaderboard (don't reset - gameEndData is already set)
      setGameEnded(true)
    } catch (err) {
      console.error('Failed to handle dinosaur selection:', err)
      alert('אירעה שגיאה בבחירת הדינוזאור')
    }
  }

  const handleDinosaurSkip = async () => {
    // Close selection screen
    setShowDinosaurSelection(false)
    // Show game end screen with leaderboard (don't reset - gameEndData is already set)
    setGameEnded(true)
  }

  const handleLogout = () => {
    removeToken()
    onLogout()
    navigate('/login')
  }

  // Dinosaur View-Only Screen - shows all available dinosaurs (browse only)
  if (showDinosaurViewOnly) {
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
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 md:p-8 z-10 overflow-y-auto">
          <div className="max-w-6xl w-full">
            <DinosaurSelection
              viewOnly={true}
              onSelect={null}
              onSkip={() => setShowDinosaurViewOnly(false)}
              playerStage={stage}
              playerDinosaurs={playerDinosaurs}
            />
          </div>
        </div>
      </div>
    )
  }

  // Dinosaur Selection Screen - shows after victory
  if (showDinosaurSelection) {
    return (
      <div
        className="min-h-screen w-full relative overflow-hidden flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #B6E2F2 0%, #D6F0C4 48%, #A9DE84 100%)' }}
      >
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 md:p-8 z-10 overflow-y-auto">
          <div className="max-w-6xl w-full">
            <DinosaurSelection
              onSelect={handleDinosaurSelected}
              onSkip={handleDinosaurSkip}
              playerStage={stage}
              playerDinosaurs={playerDinosaurs}
            />
          </div>
        </div>
      </div>
    )
  }

  // Top 3 Celebration Screen - shows when player reaches top 3
  if (showTop3Celebration && playerRank && gameEndData) {
    const rankMessages = {
      1: { emoji: '👑', text: 'מקום ראשון!', color: '#FFD700' },
      2: { emoji: '🥈', text: 'מקום שני!', color: '#C0C0C0' },
      3: { emoji: '🥉', text: 'מקום שלישי!', color: '#CD7F32' }
    }
    const rankInfo = rankMessages[playerRank] || rankMessages[3]

    return (
      <div 
        className="min-h-screen w-full relative overflow-hidden flex items-center justify-center" 
        style={{
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.1) 50%, rgba(255, 192, 203, 0.1) 100%)',
          backgroundImage: 'url(/static/math_dino2.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundBlendMode: 'overlay'
        }}
      >
        {/* Gentle pulsing glow effect - smooth and pleasant */}
        <div 
          className="fixed inset-0 pointer-events-none z-50"
          style={{
            background: `radial-gradient(circle at center, ${rankInfo.color}15 0%, transparent 70%)`,
            animation: 'gentle-pulse 3s ease-in-out infinite',
          }}
        />

        {/* Main Celebration Content - Simplified */}
        <div className="absolute inset-0 flex items-center justify-center z-40 backdrop-blur-sm bg-white/20">
          <div className="text-center relative z-50 bg-white/90 rounded-3xl p-12 shadow-2xl border-4 max-w-2xl mx-4" style={{ borderColor: rankInfo.color }}>
            {/* Rank Emoji */}
            <div 
              className="text-8xl mb-6 animate-bounce-slow"
              style={{
                animation: 'bounce-slow 2s ease-in-out infinite',
                filter: `drop-shadow(0 0 20px ${rankInfo.color})`
              }}
            >
              {rankInfo.emoji}
            </div>

            <h1 
              className="text-5xl md:text-6xl font-extrabold mb-4"
              style={{
                color: rankInfo.color,
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                animation: 'fade-in 0.5s ease-out'
              }}
            >
              {rankInfo.text}
            </h1>

            <h2 
              className="text-3xl md:text-4xl font-bold mb-6"
              style={{
                color: '#654321',
                textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
                animation: 'fade-in 0.7s ease-out'
              }}
            >
              כל הכבוד {gameEndData.player_name}!
            </h2>

            {/* Score Display - Simpler */}
            <div 
              className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-6 border-3 border-green-400 inline-block"
              style={{
                borderColor: rankInfo.color,
                boxShadow: `0 0 20px ${rankInfo.color}40`,
                animation: 'fade-in 1s ease-out'
              }}
            >
              <div className="text-5xl font-bold text-green-700 mb-1">{gameEndData.score}</div>
              <div className="text-xl font-semibold text-green-800">ניקוד</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Game End Screen (only if not showing top 3 celebration or dinosaur selection)
  if (gameEnded && gameEndData && !showTop3Celebration && !showDinosaurSelection) {
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
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center p-4 sm:p-6 md:p-8 z-10">
          {/* Fixed Header with Play Again Button - Always visible at top */}
          <div className="fixed top-0 left-0 right-0 z-50 w-full" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <div className="max-w-4xl mx-auto px-4 py-3">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: '#654321' }}>
                  🎉 כל הכבוד {gameEndData.player_name}!
                </h1>
                <Button
                  onClick={() => window.location.reload()}
                  size="lg"
                  style={{ fontSize: '1.1rem', padding: '0.6rem 1.25rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                >
                  🎮 שחק שוב
                </Button>
              </div>
            </div>
          </div>
          
          {/* Scrollable Content - with top padding to account for fixed header */}
          <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-8 max-w-4xl w-full flex-1 overflow-y-auto" style={{ marginTop: '116px' }}>
            <div className="text-center mb-6">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-6 border-2 border-green-300 inline-block">
                <div className="text-5xl font-bold text-green-700 mb-2">{gameEndData.score}</div>
                <div className="text-xl font-semibold text-green-800">ניקוד סופי</div>
              </div>
            </div>
            
            <div className="my-8">
              <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: '#654321' }}>🏆 לוח התוצאות</h2>
              <Leaderboard topPlayers={gameEndData.top_players} />
            </div>
            
          </div>
        </div>
      </div>
    )
  }

  // Advance stage dialog - shows before starting game if player is ready to advance
  if (showAdvanceDialog && advanceInfo) {
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
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold mb-4" style={{ color: '#654321' }}>
                כל הכבוד!
              </h2>
              <p className="text-lg text-gray-700 mb-2">
                {advanceInfo.message}
              </p>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button
                onClick={handleAdvanceCancel}
                variant="secondary"
                className="flex-1"
              >
                לא, תודה
              </Button>
              <Button
                onClick={handleAdvanceConfirm}
                variant="primary"
                className="flex-1"
              >
                כן, אני רוצה! 🚀
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Dinosaur Gallery Screen
  if (showDinosaurGallery) {
    const levelColors = {
      '1': 'from-gray-100 to-gray-200 border-gray-300',
      '2': 'from-blue-100 to-blue-200 border-blue-400',
      '3': 'from-purple-100 to-purple-200 border-purple-500',
      '4': 'from-yellow-100 to-yellow-200 border-yellow-500',
      '5': 'from-red-100 to-pink-200 border-red-600'
    }

    return (
      <div className="min-h-screen w-full relative overflow-hidden" style={{
        background: 'linear-gradient(180deg, #B6E2F2 0%, #D6F0C4 48%, #A9DE84 100%)'
      }}>
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center p-4 sm:p-8 z-50">
          <div className="w-full max-w-5xl">
            <div className="bg-white rounded-xl shadow-lg p-4 mb-6 flex flex-wrap gap-3 justify-between items-center">
              <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: '#654321' }}>🦕 האוסף שלי</h2>
              <Button onClick={() => setShowDinosaurGallery(false)}>
                ← חזור למשחק
              </Button>
            </div>
            
            {playerDinosaurs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">🦕</div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: '#654321' }}>עדיין אין דינוזאורים באוסף</h3>
                <p className="text-lg text-gray-600">נצחי משחקים כדי לאסוף דינוזאורים חדשים!</p>
              </div>
            ) : (
              <div className="max-h-[75vh] overflow-y-auto p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  {playerDinosaurs.map((dino) => (
                    <div
                      key={dino.id}
                      style={{
                        background: '#F4FFF4',
                        border: '2px solid #CDE8A8',
                        borderRadius: 24,
                        padding: '20px 16px',
                        textAlign: 'center',
                        boxShadow: '0 6px 16px rgba(110,170,90,.14)',
                      }}
                    >
                      <img
                        src={dino.image_path}
                        alt={dino.name}
                        className="mx-auto object-contain mb-3"
                        style={{ width: 120, height: 120 }}
                      />
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#4E8C3A' }}>
                        {dino.name}
                      </div>
                      {dino.description && (
                        <div style={{ fontSize: 13, color: '#7AB85A', marginTop: 5 }}>
                          {dino.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Settings screen - separate full screen
  if (showSettings) {
    return (
      <div className="min-h-screen w-full relative overflow-hidden" style={{
        background: 'linear-gradient(180deg, #B6E2F2 0%, #D6F0C4 48%, #A9DE84 100%)'
      }}>
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-8 z-50 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-5 sm:p-8">
            <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: '#654321' }}>⚙️ הגדרות משחק</h2>
              <Button
                variant="secondary"
                onClick={() => setShowSettings(false)}
              >
                ← חזור למשחק (ללא שמירה)
              </Button>
            </div>
            <Settings onSettingsSaved={async (data) => {
              // Update stage and winning score after settings are saved
              try {
                const state = await api.getCurrentGameState()
                setStage(state.current_stage)
                setWinningScore(state.winning_score)
                // Swap to a fresh question matching the (possibly new) stage,
                // so changing the level mid-game doesn't leave the old question.
                if (data && data.question) {
                  setQuestion(data.question)
                  setCurrentQuestionId(data.question_id)
                  setAnswer('')
                  setResult('')
                }
                // Close settings screen after successful save
                setShowSettings(false)
              } catch (err) {
                console.error('Failed to reload game state:', err)
              }
            }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        background: 'linear-gradient(180deg, #B6E2F2 0%, #D6F0C4 48%, #A9DE84 100%)',
      }}
    >

      {/* Top Header */}
      <header className="flex justify-between items-center z-30 tg-game-topbar" style={{
        flex: '0 0 auto',
        margin: '16px 16px 0',
        padding: '10px 16px',
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(14px)',
        border: '2px solid rgba(255,255,255,.9)',
        borderRadius: 30,
        boxShadow: '0 10px 28px rgba(110,170,90,.28)',
        fontFamily: "'Varela Round', 'Heebo', sans-serif",
      }}>
        <div className="tg-topbar-group" style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
          {[
            { label: '🎮 חזרה', action: () => navigate('/game-select') },
            { label: '⚙️ הגדרות', action: () => setShowSettings(!showSettings) },
            { label: '📊 סטטיסטיקות', action: () => navigate('/player_stats') },
            { label: '🥇 דירוג', action: () => navigate('/top_players') },
            { label: `🦕 אוסף (${playerDinosaurs.length})`, action: () => setShowDinosaurGallery(true) },
            { label: '👀 דינוזאורים', action: () => setShowDinosaurViewOnly(true) },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action} style={gameNavBtnStyle}>{btn.label}</button>
          ))}
        </div>
        <div className="tg-center-title-lg" style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 26, fontWeight: 700, color: '#4E8C3A', flex: '1 1 auto', minWidth: 0, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 8px', pointerEvents: 'none' }}>
          משחק החשבון
        </div>
        <div className="tg-topbar-group" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'בטל השתקה' : 'השתק'}
            style={{ ...gameNavBtnStyle, padding: '7px 12px', fontSize: 17 }}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button onClick={handleLogout} style={gameNavBtnStyle}>
            התנתק
          </button>
        </div>
      </header>

      {/* placeholder - dinosaur strip moved to bottom flex child */}

      {/* Growing Dinosaur Progress Bar - Right Side */}
      {!gameEnded && !showDinosaurSelection && !showTop3Celebration && !showAdvanceDialog && !showSettings && !showDinosaurGallery && !showDinosaurViewOnly && winningScore > 0 && (
        <div className="tg-progress-rail absolute right-4 top-1/2 transform -translate-y-1/2 z-25 flex-col items-center" style={{ marginTop: '40px' }}>
          <div className="relative flex items-end gap-4" style={{ width: '150px', height: '400px' }}>
            {/* Progress Bar Track */}
            <div
              className="relative"
              style={{
                width: '30px',
                height: '300px',
                background: '#E8F5DB',
                borderRadius: '15px',
                border: '2px solid #CDE8A8',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.08)',
                overflow: 'hidden'
              }}
            >
              {/* Progress Fill */}
              {(() => {
                const progressPercent = Math.min(Math.max((score / winningScore) * 100, 0), 100)
                return (
                  <>
                    <div
                      className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
                      style={{
                        height: `${progressPercent}%`,
                        minHeight: score > 0 ? '4px' : '0px',
                        background: 'linear-gradient(180deg, #90D060 0%, #6AB840 50%, #4E8C3A 100%)',
                        borderRadius: '15px',
                        willChange: 'height'
                      }}
                    />
                    
                  </>
                )
              })()}
            </div>
            
            {/* Growing Dinosaur */}
            <div className="flex flex-col items-center justify-end" style={{ height: '300px' }}>
              {(() => {
                const progressRatio = winningScore > 0 ? Math.min(Math.max(score / winningScore, 0), 1) : 0
                const dinoSize = 60 + progressRatio * 140
                
                return (
                  <div
                    className="transition-all duration-700 ease-out flex items-center justify-center"
                    style={{
                      width: `${dinoSize}px`,
                      height: `${dinoSize}px`,
                      minWidth: '60px',
                      minHeight: '60px',
                      maxWidth: '200px',
                      maxHeight: '200px',
                      filter: `drop-shadow(0 ${3 + progressRatio * 5}px ${5 + progressRatio * 10}px rgba(0,0,0,0.2))`,
                      animation: score >= winningScore ? 'bounce 1s ease-in-out infinite' : 'none',
                      willChange: 'width, height, filter'
                    }}
                  >
                    <img 
                      src="/static/dino_progress.png" 
                      alt="Progress Dinosaur"
                      className="w-full h-full object-contain"
                      style={{
                        transition: 'all 0.7s ease-out'
                      }}
                    />
                  </div>
                )
              })()}
            </div>
            
            {/* Score Display */}
            <div
              className="absolute top-0 left-1/2 transform -translate-x-1/2 text-center"
              style={{ width: '150px' }}
            >
              <div
                className="text-lg font-bold"
                style={{
                  color: '#4E8C3A',
                  textShadow: '1px 1px 2px rgba(255,255,255,0.8)',
                  fontFamily: "'Fredoka', sans-serif",
                }}
              >
                {score} / {winningScore}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Scene Container */}
      <main className="flex flex-col items-center justify-center p-4 z-10" style={{
        flex: '1 1 auto',
        minHeight: 0,
        position: 'relative',
      }}>
        {/* Main Game Card */}
        <div className="w-full max-w-lg relative z-30 flex flex-col" style={{
          marginTop: '2vh',
          marginBottom: '2vh',
          background: 'rgba(255,255,255,0.96)',
          padding: 'clamp(18px, 4vw, 28px) clamp(18px, 4vw, 32px) clamp(22px, 4vw, 32px)',
          maxHeight: '90vh',
          borderRadius: 40,
          boxShadow: '0 22px 48px rgba(110,170,90,.24), 0 8px 20px rgba(0,0,0,.06)',
          border: '2px solid rgba(255,255,255,.9)',
          position: 'relative',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          
          {/* Player Greeting */}
          {playerName && (
            <h2 className="tg-greeting text-2xl md:text-3xl mb-3 text-center relative z-10 font-bold" style={{
              color: '#4E8C3A',
              fontFamily: "'Fredoka', 'Varela Round', sans-serif",
            }}>
              שלום {playerName} 👋
            </h2>
          )}
          
          {/* Question Display */}
          <div className="tg-question-box relative z-10 mb-4" style={{
            background: 'linear-gradient(135deg, #D4F4E0 0%, #C2EEF2 100%)',
            padding: '20px 24px',
            borderRadius: 24,
            boxShadow: '0 6px 0 #9ED8C8, 0 8px 20px rgba(110,170,90,.18)',
          }}>
            <h2
              className={`question text-4xl md:text-5xl font-extrabold text-center transition-opacity duration-300 ${questionFade ? 'opacity-0' : 'opacity-100'}`}
              dir="ltr"
              style={{
                margin: 0,
                color: '#1E6B4A',
                fontFamily: "'Fredoka', 'Varela Round', Arial, sans-serif",
                lineHeight: '1.2',
                textShadow: '0 3px 0 rgba(255,255,255,.6)',
              }}
            >
              {question}
            </h2>
          </div>

          {/* Result Feedback - kept directly under the exercise so it's always
              visible on phones (the keypad below can push lower content off-screen). */}
          {result && (
            <div className="result text-lg md:text-xl font-bold text-center mb-3 relative z-10" style={{
              color: result.includes('✅') || result.includes('🎉') || result.includes('🌟') || result.includes('🏆') || result.includes('🔥') ? '#22c55e' : '#ef4444',
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
              animation: showCelebration ? 'bounce 0.6s ease-in-out 2' : 'none'
            }}>
              {result}
            </div>
          )}

          {/* Stage (standalone row — hidden on phones, where it's shown inline in the progress row) */}
          <div className="tg-stage-row flex justify-center gap-4 mb-4 relative z-10">
            <div id="stage" style={{
              display: 'inline-block',
              padding: '6px 20px',
              background: '#E8F5DB',
              color: '#4E8C3A',
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 700,
              border: '2px solid #CDE8A8',
            }}>
              🎯 רמה: {stage}
            </div>
          </div>

          {/* Compact progress (shown on tablet/mobile, where the side rail is hidden) */}
          {winningScore > 0 && (
            <div className="tg-progress-compact relative z-10" style={{ alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
              <img
                src="/static/dino_progress.png"
                alt=""
                style={{ height: 'clamp(34px, 9vw, 48px)', width: 'auto', objectFit: 'contain', flexShrink: 0 }}
                onError={e => { e.target.style.display = 'none' }}
              />
              <div style={{ flex: 1, maxWidth: 240, height: 14, background: '#E8F5DB', border: '2px solid #CDE8A8', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(Math.max((score / winningScore) * 100, 0), 100)}%`,
                  background: 'linear-gradient(90deg, #90D060, #4E8C3A)',
                  borderRadius: 999,
                  transition: 'width .5s ease',
                }} />
              </div>
              <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 15, fontWeight: 700, color: '#4E8C3A', whiteSpace: 'nowrap' }}>
                {score}/{winningScore}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4E8C3A', background: '#E8F5DB', border: '2px solid #CDE8A8', borderRadius: 999, padding: '3px 10px', whiteSpace: 'nowrap' }}>
                🎯 {stage}
              </div>
            </div>
          )}

          {/* Answer entry: built-in on-screen number pad so the phone's native
              keyboard never opens (inputMode="none"). Physical typing still
              works on desktop. */}
          <form onSubmit={handleSubmitAnswer} style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <input
              type="text"
              inputMode="none"
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
              placeholder="תשובה"
              required
              style={{
                width: '100%',
                maxWidth: 200,
                padding: 'clamp(6px, 1.2vh, 12px) 16px',
                fontSize: 'clamp(22px, 5vw, 28px)',
                fontWeight: 700,
                textAlign: 'center',
                borderRadius: 16,
                border: '2.5px solid #CDE8A8',
                background: '#F4FFF4',
                color: '#1E6B4A',
                outline: 'none',
                boxShadow: 'inset 0 2px 6px rgba(110,170,90,.12)',
                fontFamily: "'Fredoka', sans-serif",
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, width: '100%', maxWidth: 260, direction: 'ltr' }}>
              {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(d => (
                <button type="button" key={d} onClick={() => setAnswer(prev => (String(prev) + d).slice(0, 3))} style={keypadBtnStyle}>{d}</button>
              ))}
              <button type="button" onClick={() => setAnswer(prev => String(prev).slice(0, -1))} style={keypadBtnStyle} aria-label="מחק">⌫</button>
              <button type="button" onClick={() => setAnswer(prev => (String(prev) + '0').slice(0, 3))} style={keypadBtnStyle}>0</button>
              <button type="submit" style={{ ...keypadBtnStyle, background: '#52C36E', color: '#fff', border: '2px solid #36A452', boxShadow: '0 4px 0 #36A452' }} aria-label="שלח">🔥</button>
            </div>
          </form>

          {/* Celebration Effect - Sparkles/Glitter */}
          {showCelebration && (
            <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
              {[...Array(60)].map((_, i) => {
                const angle = (Math.PI * 2 * i) / 60
                const distance = 150 + Math.random() * 200
                const tx = Math.cos(angle) * distance
                const ty = Math.sin(angle) * distance
                const delay = Math.random() * 0.3
                const duration = 0.8 + Math.random() * 0.4
                const colors = ['#FFD700', '#FFA500', '#FF69B4', '#00CED1', '#FF1493', '#FFD700', '#FF6347', '#32CD32']
                const color = colors[Math.floor(Math.random() * colors.length)]
                const size = 6 + Math.random() * 6
                
                return (
                  <div
                    key={i}
                    className="sparkle-particle absolute"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: `${size}px`,
                      height: `${size}px`,
                      background: color,
                      borderRadius: '50%',
                      boxShadow: `0 0 ${size * 2}px ${color}, 0 0 ${size * 4}px ${color}`,
                      animationDelay: `${delay}s`,
                      animationDuration: `${duration}s`,
                      transform: `translate(${tx}px, ${ty}px) scale(1.5)`,
                      opacity: 0
                    }}
                  />
                )
              })}
            </div>
          )}

          {/* Stage Progress Indicator */}
          {stage > 1 && (
            <div className="tg-stage-banner mb-4 text-center relative z-10">
              <div style={{ display: 'inline-block', background: '#E8F5DB', borderRadius: 999, padding: '8px 24px', border: '2px solid #CDE8A8', boxShadow: '0 4px 0 #CDE8A8' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#4E8C3A' }}>
                  🎯 עלית לשלב {stage}! כל הכבוד!
                </span>
              </div>
            </div>
          )}

          {/* Wrong Questions */}
          {wrongQuestions.length > 0 && (
            <div className="relative z-10 flex-shrink-0" style={{ marginTop: 16, maxHeight: '20vh', overflowY: 'auto' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#4E8C3A', marginBottom: 8, textAlign: 'center' }}>שאלות לתרגול:</div>
              <div style={{ background: '#F4FFF4', borderRadius: 16, padding: '8px 16px', border: '1.5px solid #CDE8A8' }}>
                <ul id="wrong-questions" dir="ltr" style={{ listStyle: 'none', margin: 0, padding: 0, textAlign: 'center' }}>
                  {wrongQuestions.map((q, i) => (
                    <li key={i} style={{ fontSize: 13, color: '#4E8C3A', padding: '2px 0' }}>• {q}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Dinosaur strip - responsive flex area at bottom */}
      <div className="tg-dino-strip" style={{
        flex: '0 0 auto',
        minHeight: 0,
        height: 'clamp(96px, 18vh, 170px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 8,
        padding: '0 8px 6px',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}>
        {playerDinosaurs.map((dino, index) => {
          const baseSize = 150
          const minSize = 90
          const sizeReduction = Math.max(0, (playerDinosaurs.length - 5) * 10)
          const size = Math.max(minSize, baseSize - sizeReduction)
          return (
            <img
              key={dino.id}
              src={dino.image_path}
              alt={dino.name}
              className={`tg-dino-strip-img ${showCelebration ? 'animate-bounce' : ''}`}
              style={{
                height: `clamp(70px, 13vh, ${size}px)`,
                width: 'auto',
                maxWidth: size * 0.8,
                objectFit: 'contain',
                flexShrink: 0,
                filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.25))',
                animationDelay: showCelebration ? `${index * 0.1}s` : '0s',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

export default Game

const gameNavBtnStyle = {
  background: '#fff',
  border: '2px solid #CDE8A8',
  borderRadius: 999,
  padding: '7px 14px',
  fontSize: 13,
  fontWeight: 700,
  color: '#4E8C3A',
  cursor: 'pointer',
  boxShadow: '0 4px 0 #CDE8A8',
  fontFamily: "'Varela Round', sans-serif",
  whiteSpace: 'nowrap',
}

// Compact on-screen number pad key — small so the pad doesn't dominate the card.
const keypadBtnStyle = {
  height: 'clamp(28px, 3.8vh, 40px)',
  fontSize: 'clamp(16px, 3.6vw, 21px)',
  fontWeight: 700,
  borderRadius: 14,
  border: '2px solid #CDE8A8',
  background: '#fff',
  color: '#1E6B4A',
  cursor: 'pointer',
  boxShadow: '0 3px 0 #CDE8A8',
  fontFamily: "'Fredoka', sans-serif",
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
}

