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
        <button className="btn" onClick={() => window.location.reload()}>
          שחק שוב
        </button>
      </div>
    )
  }

  return (
    <div>
      <button
        id="stats-btn"
        style={{ marginLeft: '10px', padding: '8px 16px', fontSize: '1em' }}
        onClick={() => navigate('/player_stats')}
      >
        📊 הצג סטטיסטיקות
      </button>
      <button
        id="top-players-btn"
        style={{ marginLeft: '10px', padding: '8px 16px', fontSize: '1em' }}
        onClick={() => navigate('/top_players')}
      >
        🥇 הצג לוח תוצאות
      </button>
      
      <div id="game-area">
        <h1>ברוך הבא למשחק של דינו!</h1>
        <button className="logout-btn" onClick={handleLogout}>
          🔒 התנתקות
        </button>
        
        <div id="game">
          <h2>{playerName ? `שלום ${playerName}` : ''}</h2>
          <h2 className="question">{question}</h2>
          
          <Timer
            seconds={timeLimit}
            onTimeUp={handleTimeUp}
            isPaused={timerPaused}
          />
          
          <div id="stage">רמה: {stage}</div>
          
          <form onSubmit={handleSubmitAnswer} className="centered-form">
            <input
              type="number"
              id="answer"
              className="answer-input"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="התשובה שלך"
              required
              autoFocus
            />
            <button type="submit">שלח</button>
          </form>

          <div className="result">{result}</div>
          <div id="score">ניקוד: {score}</div>
          
          {wrongQuestions.length > 0 && (
            <>
              <h4>השאלות שלא ידע לענות עליהן:</h4>
              <div id="wrong-questions" dir="ltr">
                <ul>
                  {wrongQuestions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
          
          <img src="/static/math_dino2.png" alt="דינוזאור ומספרים" className="dino-img" />
        </div>
      </div>
      
      <Settings />
    </div>
  )
}

export default Game

