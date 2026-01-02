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
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Sky gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100"></div>
      
      {/* Jungle green hills/middle ground */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-400/40 to-green-600" style={{
        backgroundPosition: 'center bottom',
        backgroundSize: '100% 60%',
        clipPath: 'polygon(0% 70%, 0% 100%, 100% 100%, 100% 70%, 90% 65%, 80% 68%, 70% 63%, 60% 66%, 50% 62%, 40% 65%, 30% 63%, 20% 66%, 10% 64%, 0% 70%)'
      }}></div>
      
      {/* Ground path in center - dirt/brown trail */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2/5 h-1/3" style={{
        background: 'linear-gradient(to bottom, #8B7355 0%, #6B5B4A 50%, #5A4A3A 100%)',
        clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
        borderRadius: '50% 50% 0 0 / 30% 30% 0 0'
      }}></div>
      
      {/* Path texture/center line */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/6 h-1/4 bg-gradient-to-b from-amber-200/30 via-transparent to-transparent" style={{
        clipPath: 'polygon(40% 0%, 60% 0%, 55% 100%, 45% 100%)'
      }}></div>
      
      {/* Additional jungle layers for depth */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-green-700 via-green-600 to-green-500/50" style={{
        clipPath: 'polygon(0% 100%, 0% 50%, 15% 45%, 25% 48%, 35% 44%, 45% 47%, 55% 43%, 65% 46%, 75% 44%, 85% 47%, 100% 45%, 100% 100%)'
      }}></div>
      {/* Top Header - Floating */}
      <header className="absolute top-0 left-0 right-0 w-full p-4 flex justify-between items-center z-30 bg-white/80 backdrop-blur-sm">
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
        <h1 className="text-2xl font-bold text-green-800">ברוך הבא למשחק של דינו!!!</h1>
        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-white text-gray-800 font-semibold rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          🔒 התנתקות
        </button>
      </header>

      {/* Large Dinosaur Character - Left Side */}
      <div className="absolute left-4 md:left-8 lg:left-16 bottom-0 z-20 pointer-events-none" style={{ height: '40vh', minHeight: '300px' }}>
        <div className="relative h-full flex items-end">
          {/* Large Dinosaur Body */}
          <div className="relative">
            {/* Main body */}
            <div className="w-32 h-40 md:w-48 md:h-60 lg:w-56 lg:h-72 bg-gradient-to-b from-green-400 via-green-500 to-green-600 rounded-full shadow-2xl flex items-center justify-center" style={{
              clipPath: 'polygon(50% 0%, 85% 15%, 100% 40%, 95% 70%, 80% 90%, 50% 100%, 20% 90%, 5% 70%, 0% 40%, 15% 15%)'
            }}>
              <div className="text-6xl md:text-8xl lg:text-9xl">🦕</div>
            </div>
            {/* Tail */}
            <div className="absolute -right-8 top-1/2 w-16 h-12 bg-green-500 rounded-full transform rotate-12"></div>
            {/* Speech bubble */}
            <div className="absolute -top-16 -right-4 md:-top-20 md:-right-8 bg-white rounded-2xl p-3 md:p-4 shadow-2xl border-4 border-gray-300 z-30" style={{
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 85% 75%, 75% 100%, 65% 75%, 0% 75%)',
              minWidth: '120px'
            }}>
              <div className="text-xl md:text-2xl font-bold text-gray-800" dir="ltr">5 + 2 = 7</div>
            </div>
          </div>
        </div>
      </div>

      {/* Large Dinosaur Character - Right Side */}
      <div className="absolute right-4 md:right-8 lg:right-16 bottom-0 z-20 pointer-events-none" style={{ height: '40vh', minHeight: '300px' }}>
        <div className="relative h-full flex items-end">
          {/* Large Dinosaur Body */}
          <div className="relative">
            {/* Main body */}
            <div className="w-32 h-40 md:w-48 md:h-60 lg:w-56 lg:h-72 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 rounded-full shadow-2xl flex items-center justify-center" style={{
              clipPath: 'polygon(20% 0%, 80% 0%, 100% 25%, 95% 60%, 85% 85%, 50% 100%, 15% 85%, 5% 60%, 0% 25%)'
            }}>
              <div className="text-6xl md:text-8xl lg:text-9xl">🦖</div>
            </div>
            {/* Frill/crest */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-20 h-8 bg-blue-300 rounded-full"></div>
            {/* Basket/backpack on back */}
            <div className="absolute top-1/3 -right-4 w-16 h-20 md:w-20 md:h-24 bg-amber-800 rounded-lg shadow-lg border-4 border-amber-900 transform rotate-12">
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-2 bg-amber-900 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Scene Container - Centered */}
      <main className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10" style={{ paddingTop: '80px' }}>
        {/* Centered Wooden Sign Card for Question - Part of Scene */}
        <div className="w-full max-w-2xl relative z-30" style={{
          marginTop: '5vh',
          marginBottom: '5vh',
          background: 'linear-gradient(135deg, #D2B48C 0%, #C19A6B 25%, #B8860B 50%, #C19A6B 75%, #D2B48C 100%)',
          padding: '2rem',
          borderRadius: '45% 55% 40% 60% / 60% 40% 60% 40%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)',
          border: '8px solid #8B6914',
          transform: 'rotate(-1deg)',
          position: 'relative'
        }}>
          {/* Wood grain texture effect */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `
              repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139, 105, 20, 0.3) 2px, rgba(139, 105, 20, 0.3) 4px),
              repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139, 105, 20, 0.2) 2px, rgba(139, 105, 20, 0.2) 4px)
            `,
            borderRadius: 'inherit',
            pointerEvents: 'none'
          }}></div>
          
          {/* Nail/screw decorations */}
          <div className="absolute top-2 left-2 w-3 h-3 bg-gray-700 rounded-full shadow-inner"></div>
          <div className="absolute top-2 right-2 w-3 h-3 bg-gray-700 rounded-full shadow-inner"></div>
          <div className="absolute bottom-2 left-2 w-3 h-3 bg-gray-700 rounded-full shadow-inner"></div>
          <div className="absolute bottom-2 right-2 w-3 h-3 bg-gray-700 rounded-full shadow-inner"></div>
          
          {/* Player Greeting */}
          {playerName && (
            <h2 className="text-2xl mb-4 text-center relative z-10 text-amber-900 font-bold drop-shadow-md">
              שלום {playerName}
            </h2>
          )}
          
          {/* Question Display - Wooden Sign Style */}
          <div className="relative z-10 mb-6" style={{
            background: 'linear-gradient(135deg, #F5DEB3 0%, #DEB887 50%, #F5DEB3 100%)',
            padding: '2rem 3rem',
            borderRadius: '35% 65% 30% 70% / 50% 30% 70% 50%',
            border: '6px solid #8B6914',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.2)',
            position: 'relative'
          }}>
            {/* Inner wood texture */}
            <div className="absolute inset-0 opacity-15" style={{
              backgroundImage: `
                repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(139, 105, 20, 0.2) 3px, rgba(139, 105, 20, 0.2) 6px)
              `,
              borderRadius: 'inherit',
              pointerEvents: 'none'
            }}></div>
            
            <h2 className="question text-6xl font-bold text-center relative z-10" dir="ltr" style={{
              color: '#654321',
              textShadow: '2px 2px 0px rgba(255,255,255,0.5), 4px 4px 8px rgba(0,0,0,0.3)',
              letterSpacing: '0.1em',
              fontFamily: 'Arial, sans-serif'
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
          <div className="flex justify-center gap-4 mb-6">
            <div id="stage" className="text-xl font-semibold">רמה: {stage}</div>
            <div id="score" className="text-xl font-semibold">ניקוד: {score}</div>
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
              className="flex-1 max-w-xs px-6 py-4 text-2xl text-center border-4 border-amber-400 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-300"
            />
            <button 
              type="submit"
              className="px-8 py-4 bg-green-500 text-white text-xl font-bold rounded-xl shadow-lg hover:bg-green-600 transition-colors"
            >
              שלח
            </button>
          </form>

          {/* Result Feedback */}
          {result && (
            <div className="result text-2xl font-bold text-center mb-4">
              {result}
            </div>
          )}

          {/* Wrong Questions */}
          {wrongQuestions.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-2">השאלות שלא ידע לענות עליהן:</h4>
              <div id="wrong-questions" dir="ltr" className="bg-white rounded-lg p-4">
                <ul className="list-disc list-inside">
                  {wrongQuestions.map((q, i) => (
                    <li key={i} className="text-lg">{q}</li>
                  ))}
                </ul>
              </div>
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

