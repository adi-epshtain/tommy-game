import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, removeToken } from '../services/api'
import Timer from '../components/Timer'
import Settings from '../components/Settings'
import Leaderboard from '../components/Leaderboard'
import Button from '../components/Button'

const MATH_GAME = 'Math Game'

function Game({ onLogout }) {
  const [playerName, setPlayerName] = useState('')
  const [question, setQuestion] = useState('')
  const [currentQuestionId, setCurrentQuestionId] = useState(null)
  const [score, setScore] = useState(0)
  const [stage, setStage] = useState(1)
  const [result, setResult] = useState('')
  const [answer, setAnswer] = useState('')
  const [timeLimit, setTimeLimit] = useState(30)
  const [wrongQuestions, setWrongQuestions] = useState([])
  const [gameEnded, setGameEnded] = useState(false)
  const [gameEndData, setGameEndData] = useState(null)
  const [timerPaused, setTimerPaused] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [winningScore, setWinningScore] = useState(5) // Default, will be updated from settings
  const [showScorePopup, setShowScorePopup] = useState(false)
  const [scoreChange, setScoreChange] = useState(0)
  const [remainingTime, setRemainingTime] = useState(30)
  const [questionFade, setQuestionFade] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadPlayerInfo()
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

  const startGame = async (name) => {
    try {
      const data = await api.startGame(5)
      setQuestion(data.question)
      setTimeLimit(data.time_limit)
      setRemainingTime(data.time_limit)
      setCurrentQuestionId(data.question_id)
      setScore(0)
      setStage(1)
      setResult('')
      setWrongQuestions([])
      setGameEnded(false)
      setShowCelebration(false)
    } catch (err) {
      alert('אירעה שגיאה בהתחלת המשחק')
      console.error(err)
    }
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
          setTimeout(() => setShowCelebration(false), 1500)
          
          // Score popup animation
          setScoreChange(1)
          setShowScorePopup(true)
          setTimeout(() => setShowScorePopup(false), 1000)
          
          setResult('✅ נכון! כל הכבוד!')
        } else {
          setResult('❌ לא נכון! נסה שוב! 💪')
          setScoreChange(-1)
          setShowScorePopup(true)
          setTimeout(() => setShowScorePopup(false), 1000)
        }
        
        // Question transition animation
        setQuestionFade(true)
        setTimeout(() => {
          setQuestion(data.question)
          setTimeLimit(data.time_limit)
          setRemainingTime(data.time_limit)
          setQuestionFade(false)
        }, 300)
        setAnswer('')
        setCurrentQuestionId(data.question_id)
        setWrongQuestions(data.wrong_questions || [])
      }
    } catch (err) {
      console.error('Failed to submit answer:', err)
    }
  }

  const handleTimeUp = async () => {
    setResult('לא הספקת בזמן 😢')
    setTimerPaused(true)
    
    setTimeout(async () => {
      setAnswer('')
      // Submit empty answer (treated as wrong)
      try {
        const data = await api.submitAnswer('', currentQuestionId, MATH_GAME)
        if (data.redirect) {
          await showGameEnd()
        } else {
          setScore(data.score)
          setStage(data.stage)
          setResult('')
          
          // Question transition animation
          setQuestionFade(true)
          setTimeout(() => {
            setQuestion(data.question)
            setTimeLimit(data.time_limit)
            setRemainingTime(data.time_limit) // Reset timer for new question
            setQuestionFade(false)
          }, 300)
          
          setAnswer('')
          setCurrentQuestionId(data.question_id)
          setWrongQuestions(data.wrong_questions || [])
        }
      } catch (err) {
        console.error('Failed to submit answer:', err)
      }
      setTimerPaused(false)
    }, 1500)
  }

  const showGameEnd = async () => {
    try {
      const data = await api.getGameEnd()
      setGameEndData(data)
      setGameEnded(true)
    } catch (err) {
      alert('אירעה שגיאה בטעינת סיום המשחק')
      console.error(err)
    }
  }

  const handleLogout = () => {
    removeToken()
    onLogout()
    navigate('/login')
  }

  if (gameEnded && gameEndData) {
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
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center p-8 z-10">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-bold mb-4" style={{ color: '#654321' }}>
                🎉 כל הכבוד {gameEndData.player_name}!
              </h1>
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-6 border-2 border-green-300 inline-block">
                <div className="text-5xl font-bold text-green-700 mb-2">{gameEndData.score}</div>
                <div className="text-xl font-semibold text-green-800">ניקוד סופי</div>
              </div>
            </div>
            
            <div className="my-8">
              <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: '#654321' }}>🏆 לוח התוצאות</h2>
              <Leaderboard topPlayers={gameEndData.top_players} />
            </div>
            
            <div className="text-center my-6">
              <img src="/static/dino.png" alt="דינוזאור חמוד" className="mx-auto w-32 h-32 object-contain" />
            </div>
            
            <div className="text-center">
              <Button onClick={() => window.location.reload()}>
                🎮 שחק שוב
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Settings screen - separate full screen
  if (showSettings) {
    return (
      <div className="min-h-screen w-full relative overflow-hidden" style={{
        backgroundImage: 'url(/static/math_dino2.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}>
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center p-8 z-50">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold" style={{ color: '#654321' }}>⚙️ הגדרות משחק</h2>
              <Button
                variant="primary"
                onClick={() => setShowSettings(false)}
              >
                ← חזור למשחק
              </Button>
            </div>
            <Settings />
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
      
      {/* Top Header - Light green semi-transparent */}
      <header className="absolute top-0 left-0 right-0 w-full p-3 md:p-4 flex justify-between items-center z-30" style={{
        background: 'rgba(144, 238, 144, 0.85)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            ⚙️ הגדרות
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/player_stats')}
          >
            📊 סטטיסטיקות
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/top_players')}
          >
            🥇 לוח תוצאות
          </Button>
        </div>
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-base md:text-lg font-bold text-center" style={{ color: '#2d5016', textShadow: '1px 1px 2px rgba(255,255,255,0.5)' }}>ברוך הבא למשחק של דינו!!!</h1>
        <Button 
          variant="secondary"
          size="sm"
          onClick={handleLogout}
        >
          🔒 התנתקות
        </Button>
      </header>

      {/* Left Dinosaur - Green Brontosaurus with yellow crest */}
      <div className={`absolute left-2 md:left-4 lg:left-8 bottom-0 z-20 pointer-events-none transition-transform duration-500 ${showCelebration ? 'animate-bounce' : ''}`} style={{ height: '25vh', minHeight: '180px', maxHeight: '250px' }}>
        <div className="relative h-full flex items-end">
          <div className="relative">
            {/* Long neck */}
            <div className="absolute bottom-16 md:bottom-20 left-1/2 transform -translate-x-1/2 w-8 h-20 md:w-12 md:h-28 bg-gradient-to-b from-green-300 to-green-500 rounded-full"></div>
            {/* Body */}
            <div className="w-20 md:w-28 h-24 md:h-32 bg-gradient-to-b from-green-300 via-green-400 to-green-600 rounded-full shadow-xl flex items-center justify-center" style={{
              clipPath: 'polygon(30% 0%, 70% 0%, 90% 30%, 95% 60%, 90% 90%, 50% 100%, 10% 90%, 5% 60%, 10% 30%)'
            }}>
              <div className="text-3xl md:text-5xl">🦕</div>
            </div>
            {/* Yellow spiky crest on head */}
            <div className="absolute -top-8 md:-top-12 left-1/2 transform -translate-x-1/2" style={{
              width: '40px',
              height: '60px',
              background: 'linear-gradient(to bottom, #FFD700, #FFA500)',
              clipPath: 'polygon(50% 0%, 80% 30%, 70% 50%, 90% 70%, 50% 100%, 10% 70%, 30% 50%, 20% 30%)',
              filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
            }}></div>
            {/* Speech bubble */}
            <div className="absolute -top-20 md:-top-24 -right-8 md:-right-12 bg-white rounded-2xl p-3 md:p-4 shadow-2xl z-30 border-2 border-gray-300" style={{
              minWidth: '110px',
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 80%, 88% 80%, 78% 100%, 68% 80%, 0% 80%)'
            }}>
              <div className="text-lg md:text-xl font-bold text-gray-800" dir="ltr">5 + 2 = 7</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Dinosaur - Blue Triceratops with brown backpack */}
      <div className={`absolute right-2 md:right-4 lg:right-8 bottom-0 z-20 pointer-events-none transition-transform duration-500 ${showCelebration ? 'animate-bounce' : ''}`} style={{ height: '25vh', minHeight: '180px', maxHeight: '250px' }}>
        <div className="relative h-full flex items-end">
          <div className="relative">
            {/* Body */}
            <div className="w-20 md:w-28 h-24 md:h-32 bg-gradient-to-b from-cyan-300 via-blue-400 to-blue-600 rounded-full shadow-xl flex items-center justify-center" style={{
              clipPath: 'polygon(20% 0%, 80% 0%, 100% 25%, 95% 60%, 85% 85%, 50% 100%, 15% 85%, 5% 60%, 0% 25%)'
            }}>
              <div className="text-3xl md:text-5xl">🦖</div>
            </div>
            {/* Frill */}
            <div className="absolute -top-6 md:-top-8 left-1/2 transform -translate-x-1/2 w-24 h-10 md:w-32 md:h-12 bg-gradient-to-b from-blue-200 to-blue-400 rounded-full shadow-md" style={{
              clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)'
            }}></div>
            {/* Three small horns */}
            <div className="absolute -top-12 md:-top-16 left-1/2 transform -translate-x-1/2 w-2 h-6 md:h-8 bg-gray-700 rounded-full"></div>
            <div className="absolute -top-10 md:-top-14 left-1/3 transform -translate-x-1/2 w-1.5 h-4 md:h-6 bg-gray-700 rounded-full"></div>
            <div className="absolute -top-10 md:-top-14 right-1/3 transform translate-x-1/2 w-1.5 h-4 md:h-6 bg-gray-700 rounded-full"></div>
            {/* Brown backpack/basket on back */}
            <div className="absolute top-1/4 -right-6 md:-right-8 w-14 h-18 md:w-18 md:h-22 bg-gradient-to-b from-amber-700 to-amber-900 rounded-lg shadow-xl border-3 border-amber-950 transform rotate-12" style={{
              borderWidth: '3px'
            }}>
              <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-10 h-1.5 bg-amber-950 rounded"></div>
              <div className="absolute top-4 left-1 right-1 h-1 bg-amber-800 rounded"></div>
              <div className="absolute top-7 left-1 right-1 h-1 bg-amber-800 rounded"></div>
              <div className="absolute top-10 left-1 right-1 h-1 bg-amber-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Scene Container - Centered */}
      <main className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10" style={{ paddingTop: '80px' }}>
        {/* Centered Wooden Sign Card - Large irregular organic shape */}
        <div className="w-full max-w-2xl relative z-30 flex flex-col" style={{
          marginTop: '2vh',
          marginBottom: '2vh',
          background: 'linear-gradient(135deg, #CD853F 0%, #D2691E 20%, #B8860B 40%, #CD853F 60%, #D2691E 80%, #B8860B 100%)',
          padding: '1.5rem 1.5rem 2rem 1.5rem',
          maxHeight: '90vh',
          borderRadius: '50% 40% 55% 45% / 45% 55% 40% 50%',
          boxShadow: '0 25px 50px rgba(0,0,0,0.4), inset 0 3px 6px rgba(255,255,255,0.2), inset 0 -3px 6px rgba(0,0,0,0.3)',
          border: '10px solid #8B4513',
          transform: 'rotate(-0.5deg)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Wood grain texture */}
          <div className="absolute inset-0 opacity-25" style={{
            backgroundImage: `
              repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(139, 69, 19, 0.4) 3px, rgba(139, 69, 19, 0.4) 6px),
              repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(160, 82, 45, 0.3) 4px, rgba(160, 82, 45, 0.3) 8px),
              repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(139, 69, 19, 0.2) 8px, rgba(139, 69, 19, 0.2) 16px)
            `,
            borderRadius: 'inherit',
            pointerEvents: 'none'
          }}></div>
          
          {/* Dark decorative nails at corners */}
          <div className="absolute top-3 left-3 w-4 h-4 bg-gray-800 rounded-full shadow-inner border border-gray-900"></div>
          <div className="absolute top-3 right-3 w-4 h-4 bg-gray-800 rounded-full shadow-inner border border-gray-900"></div>
          <div className="absolute bottom-3 left-3 w-4 h-4 bg-gray-800 rounded-full shadow-inner border border-gray-900"></div>
          <div className="absolute bottom-3 right-3 w-4 h-4 bg-gray-800 rounded-full shadow-inner border border-gray-900"></div>
          
          {/* Player Greeting */}
          {playerName && (
            <h2 className="text-lg md:text-xl mb-3 text-center relative z-10 font-bold" style={{
              color: '#654321',
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
            }}>
              שלום {playerName}
            </h2>
          )}
          
          {/* Question Display - Cream colored paper area */}
          <div className="relative z-10 mb-4" style={{
            background: 'linear-gradient(135deg, #FFF8DC 0%, #F5E6D3 50%, #FFF8DC 100%)',
            padding: '1.5rem 2rem',
            borderRadius: '30% 70% 25% 75% / 60% 40% 60% 40%',
            boxShadow: 'inset 0 3px 10px rgba(0,0,0,0.08), 0 5px 15px rgba(0,0,0,0.15)',
            position: 'relative'
          }}>
            {/* Subtle paper texture */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `
                repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139, 105, 20, 0.15) 2px, rgba(139, 105, 20, 0.15) 4px)
              `,
              borderRadius: 'inherit',
              pointerEvents: 'none'
            }}></div>
            
            <h2 
              className={`question text-4xl md:text-5xl font-extrabold text-center relative z-10 transition-opacity duration-300 ${questionFade ? 'opacity-0' : 'opacity-100'}`}
              dir="ltr" 
              style={{
                color: '#DC143C',
                textShadow: '2px 2px 0px rgba(255,255,255,0.6), 3px 3px 8px rgba(0,0,0,0.2)',
                letterSpacing: '0.05em',
                fontFamily: 'Arial, "Helvetica Neue", sans-serif',
                lineHeight: '1.2'
              }}
            >
              {question}
            </h2>
          </div>

          {/* Timer with Visual Progress Bar */}
          <div className="mb-6 w-full max-w-md mx-auto">
            <Timer
              seconds={timeLimit}
              onTimeUp={handleTimeUp}
              isPaused={timerPaused}
              onTimeChange={setRemainingTime}
            />
            {/* Visual Timer Bar */}
            <div className="mt-2 w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full transition-all duration-1000 ease-linear rounded-full"
                style={{
                  width: `${(remainingTime / timeLimit) * 100}%`,
                  background: remainingTime > timeLimit * 0.5 
                    ? 'linear-gradient(90deg, #22c55e, #10b981)' 
                    : remainingTime > timeLimit * 0.25
                    ? 'linear-gradient(90deg, #f59e0b, #f97316)'
                    : 'linear-gradient(90deg, #ef4444, #dc2626)',
                  boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)'
                }}
              />
            </div>
          </div>

          {/* Progress Bar to Victory */}
          <div className="mb-3 w-full max-w-md mx-auto relative z-10">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs md:text-sm font-semibold" style={{ color: '#654321' }}>התקדמות לניצחון</span>
              <span className="text-xs md:text-sm font-bold" style={{ color: '#654321' }}>{score} / {winningScore}</span>
            </div>
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner border-2 border-gray-300">
              <div 
                className="h-full transition-all duration-500 ease-out rounded-full relative"
                style={{
                  width: `${Math.min((score / winningScore) * 100, 100)}%`,
                  background: score >= winningScore 
                    ? 'linear-gradient(90deg, #fbbf24, #f59e0b, #d97706)'
                    : 'linear-gradient(90deg, #22c55e, #10b981, #059669)',
                  boxShadow: '0 0 15px rgba(34, 197, 94, 0.6)'
                }}
              >
                {score >= winningScore && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse opacity-50"></div>
                )}
              </div>
            </div>
          </div>

          {/* Stage and Score */}
          <div className="flex justify-center gap-4 mb-4 relative z-10">
            <div id="stage" className="text-sm md:text-base font-bold px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 shadow-md" style={{ color: '#654321' }}>
              🎯 רמה: {stage}
            </div>
            <div id="score" className={`text-sm md:text-base font-bold px-3 py-1.5 rounded-lg border-2 shadow-md transition-all duration-300 relative ${score > 0 ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-400 scale-105' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300'}`} style={{ color: '#654321' }}>
              ⭐ ניקוד: {score}
              {/* Score Popup */}
              {showScorePopup && (
                <div 
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-lg font-bold animate-bounce"
                  style={{ 
                    color: scoreChange > 0 ? '#22c55e' : '#ef4444',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                    animation: 'bounce 1s ease-out forwards'
                  }}
                >
                  {scoreChange > 0 ? `+${scoreChange} ⭐` : `${scoreChange} ⭐`}
                </div>
              )}
            </div>
          </div>

          {/* Input + Submit Grouped Together */}
          <form onSubmit={handleSubmitAnswer} className="flex gap-2 justify-center items-center mb-4">
            <input
              type="number"
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="התשובה שלך"
              required
              autoFocus
              className="flex-1 max-w-xs px-4 py-3 text-xl text-center rounded-full focus:outline-none focus:ring-4 focus:ring-green-300"
              style={{
                background: '#FFF8DC',
                boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.15)'
              }}
            />
            <Button 
              type="submit"
              variant="secondary"
              size="sm"
            >
              🚀 שלח
            </Button>
          </form>

          {/* Result Feedback */}
          {result && (
            <div className="result text-lg md:text-xl font-bold text-center mb-3 relative z-10" style={{
              color: result.includes('✅') || result.includes('🎉') || result.includes('🌟') || result.includes('🏆') || result.includes('🔥') ? '#22c55e' : '#ef4444',
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
              animation: showCelebration ? 'bounce 0.6s ease-in-out 2' : 'none'
            }}>
              {result}
            </div>
          )}

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
            <div className="mb-4 text-center relative z-10">
              <div className="inline-block bg-gradient-to-r from-purple-200 to-pink-200 rounded-full px-6 py-2 border-2 border-purple-400 shadow-lg">
                <span className="text-lg font-bold" style={{ color: '#654321' }}>
                  🎯 עלית לשלב {stage}! כל הכבוד!
                </span>
              </div>
            </div>
          )}

          {/* Wrong Questions - Integrated into wooden sign with scroll */}
          {wrongQuestions.length > 0 && (
            <div className="mt-3 mb-2 relative z-10 text-center flex-shrink-0" style={{ maxHeight: '20vh', overflowY: 'auto' }}>
              <h4 className="text-sm md:text-base font-bold mb-2" style={{ color: '#654321' }}>השאלות שלא ידע לענות עליהן:</h4>
              <div className="bg-white/50 rounded-lg p-2 border-2 border-amber-300">
                <ul id="wrong-questions" dir="ltr" className="list-none text-left space-y-0.5">
                  {wrongQuestions.map((q, i) => (
                    <li key={i} className="text-xs md:text-sm" style={{ color: '#654321' }}>• {q}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}

export default Game

