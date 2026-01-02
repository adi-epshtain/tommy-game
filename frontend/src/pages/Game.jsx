import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, removeToken } from '../services/api'
import Timer from '../components/Timer'
import Settings from '../components/Settings'
import Leaderboard from '../components/Leaderboard'

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
      setCurrentQuestionId(data.question_id)
      setScore(0)
      setStage(1)
      setResult('')
      setWrongQuestions([])
      setGameEnded(false)
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
        setResult(data.is_correct ? '✅ נכון!' : '❌ לא נכון!')
        setQuestion(data.question)
        setTimeLimit(data.time_limit)
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
          setQuestion(data.question)
          setTimeLimit(data.time_limit)
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
      <div>
        <h1>כל הכבוד {gameEndData.player_name}!</h1>
        <h2>הניקוד שלך: {gameEndData.score}</h2>
        <hr />
        <h2>🏆 לוח התוצאות</h2>
        <Leaderboard topPlayers={gameEndData.top_players} />
        <br />
        <img src="/static/dino.png" alt="דינוזאור חמוד" className="dino-img" />
        <br />
        <button className="px-6 py-3 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600 transition-colors" onClick={() => window.location.reload()}>
          שחק שוב
        </button>
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
          <button
            onClick={() => navigate('/player_stats')}
            className="px-4 py-2 bg-white text-gray-800 font-semibold rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            📊 הצג סטטיסטיקות
          </button>
          <button
            onClick={() => navigate('/top_players')}
            className="px-4 py-2 bg-white text-gray-800 font-semibold rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            🥇 הצג לוח תוצאות
          </button>
        </div>
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#2d5016', textShadow: '1px 1px 2px rgba(255,255,255,0.5)' }}>ברוך הבא למשחק של דינו!!!</h1>
        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-white text-gray-800 font-semibold rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          🔒 התנתקות
        </button>
      </header>

      {/* Left Dinosaur - Green Brontosaurus with yellow crest */}
      <div className="absolute left-2 md:left-4 lg:left-8 bottom-0 z-20 pointer-events-none" style={{ height: '35vh', minHeight: '280px', maxHeight: '400px' }}>
        <div className="relative h-full flex items-end">
          <div className="relative">
            {/* Long neck */}
            <div className="absolute bottom-24 md:bottom-32 left-1/2 transform -translate-x-1/2 w-12 h-32 md:w-16 md:h-40 bg-gradient-to-b from-green-300 to-green-500 rounded-full"></div>
            {/* Body */}
            <div className="w-28 h-32 md:w-40 md:h-48 lg:w-48 lg:h-56 bg-gradient-to-b from-green-300 via-green-400 to-green-600 rounded-full shadow-xl flex items-center justify-center" style={{
              clipPath: 'polygon(30% 0%, 70% 0%, 90% 30%, 95% 60%, 90% 90%, 50% 100%, 10% 90%, 5% 60%, 10% 30%)'
            }}>
              <div className="text-5xl md:text-7xl lg:text-8xl">🦕</div>
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
      <div className="absolute right-2 md:right-4 lg:right-8 bottom-0 z-20 pointer-events-none" style={{ height: '35vh', minHeight: '280px', maxHeight: '400px' }}>
        <div className="relative h-full flex items-end">
          <div className="relative">
            {/* Body */}
            <div className="w-28 h-32 md:w-40 md:h-48 lg:w-48 lg:h-56 bg-gradient-to-b from-cyan-300 via-blue-400 to-blue-600 rounded-full shadow-xl flex items-center justify-center" style={{
              clipPath: 'polygon(20% 0%, 80% 0%, 100% 25%, 95% 60%, 85% 85%, 50% 100%, 15% 85%, 5% 60%, 0% 25%)'
            }}>
              <div className="text-5xl md:text-7xl lg:text-8xl">🦖</div>
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
        <div className="w-full max-w-3xl relative z-30" style={{
          marginTop: '3vh',
          marginBottom: '3vh',
          background: 'linear-gradient(135deg, #CD853F 0%, #D2691E 20%, #B8860B 40%, #CD853F 60%, #D2691E 80%, #B8860B 100%)',
          padding: '2.5rem 2rem 3rem 2rem',
          minHeight: 'fit-content',
          borderRadius: '50% 40% 55% 45% / 45% 55% 40% 50%',
          boxShadow: '0 25px 50px rgba(0,0,0,0.4), inset 0 3px 6px rgba(255,255,255,0.2), inset 0 -3px 6px rgba(0,0,0,0.3)',
          border: '10px solid #8B4513',
          transform: 'rotate(-0.5deg)',
          position: 'relative',
          overflow: 'visible'
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
            <h2 className="text-2xl md:text-3xl mb-5 text-center relative z-10 font-bold" style={{
              color: '#654321',
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
            }}>
              שלום {playerName}
            </h2>
          )}
          
          {/* Question Display - Cream colored paper area */}
          <div className="relative z-10 mb-6" style={{
            background: 'linear-gradient(135deg, #FFF8DC 0%, #F5E6D3 50%, #FFF8DC 100%)',
            padding: '2.5rem 3rem',
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
            
            <h2 className="question text-7xl md:text-8xl font-extrabold text-center relative z-10" dir="ltr" style={{
              color: '#DC143C',
              textShadow: '3px 3px 0px rgba(255,255,255,0.6), 5px 5px 10px rgba(0,0,0,0.2)',
              letterSpacing: '0.05em',
              fontFamily: 'Arial, "Helvetica Neue", sans-serif',
              lineHeight: '1.2'
            }}>
              {question}
            </h2>
          </div>

          {/* Timer */}
          <div className="mb-6">
            <Timer
              seconds={timeLimit}
              onTimeUp={handleTimeUp}
              isPaused={timerPaused}
            />
          </div>

          {/* Stage and Score */}
          <div className="flex justify-center gap-6 mb-6 relative z-10">
            <div id="stage" className="text-lg md:text-xl font-bold" style={{ color: '#654321' }}>רמה: {stage}</div>
            <div id="score" className="text-lg md:text-xl font-bold" style={{ color: '#654321' }}>ניקוד: {score}</div>
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
              className="flex-1 max-w-xs px-6 py-4 text-2xl text-center rounded-full focus:outline-none focus:ring-4 focus:ring-green-300"
              style={{
                background: '#FFF8DC',
                boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.15)'
              }}
            />
            <button 
              type="submit"
              className="px-8 py-4 text-white text-xl font-bold rounded-full shadow-lg hover:opacity-90 transition-opacity"
              style={{
                background: 'linear-gradient(to bottom, #4CAF50, #45a049)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25), inset 0 2px 4px rgba(255,255,255,0.3)'
              }}
            >
              שלח
            </button>
          </form>

          {/* Result Feedback */}
          {result && (
            <div className="result text-2xl md:text-3xl font-bold text-center mb-4 relative z-10" style={{
              color: '#654321',
              textShadow: '1px 1px 3px rgba(0,0,0,0.2)'
            }}>
              {result}
            </div>
          )}

          {/* Wrong Questions - Integrated into wooden sign */}
          {wrongQuestions.length > 0 && (
            <div className="mt-6 mb-2 relative z-10 text-center">
              <h4 className="text-lg md:text-xl font-bold mb-3" style={{ color: '#654321' }}>השאלות שלא ידע לענות עליהן:</h4>
              <ul id="wrong-questions" dir="ltr" className="list-none inline-block text-center" style={{
                maxHeight: '300px',
                overflowY: 'auto',
                padding: '0 1rem'
              }}>
                {wrongQuestions.map((q, i) => (
                  <li key={i} className="text-base md:text-lg mb-2" style={{ color: '#654321' }}>• {q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="w-full max-w-2xl">
          <Settings />
        </div>
      </main>
    </div>
  )
}

export default Game

