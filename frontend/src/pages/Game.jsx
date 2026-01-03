import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, removeToken } from '../services/api'
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
  const [wrongQuestions, setWrongQuestions] = useState([])
  const [gameEnded, setGameEnded] = useState(false)
  const [gameEndData, setGameEndData] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [winningScore, setWinningScore] = useState(5) // Default, will be updated from settings
  const [showScorePopup, setShowScorePopup] = useState(false)
  const [scoreChange, setScoreChange] = useState(0)
  const [questionFade, setQuestionFade] = useState(false)
  const navigate = useNavigate()

  // Function to play celebration sound (applause/clapping)
  const playCelebrationSound = () => {
    try {
      // Create a simple applause-like sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const duration = 0.5 // 500ms
      const sampleRate = audioContext.sampleRate
      const numSamples = duration * sampleRate
      const buffer = audioContext.createBuffer(1, numSamples, sampleRate)
      const data = buffer.getChannelData(0)

      // Generate applause-like sound (multiple claps)
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate
        // Multiple overlapping claps with different frequencies
        let sample = 0
        for (let clap = 0; clap < 5; clap++) {
          const clapTime = t - clap * 0.1
          if (clapTime >= 0 && clapTime < 0.3) {
            const freq = 200 + clap * 50 + Math.random() * 100
            const envelope = Math.exp(-clapTime * 10) * (1 - clapTime / 0.3)
            sample += Math.sin(2 * Math.PI * freq * clapTime) * envelope * 0.3
          }
        }
        // Add some noise for texture
        sample += (Math.random() * 2 - 1) * 0.1 * Math.exp(-t * 5)
        data[i] = Math.max(-1, Math.min(1, sample))
      }

      const source = audioContext.createBufferSource()
      source.buffer = buffer
      source.connect(audioContext.destination)
      source.start(0)
    } catch (err) {
      // Fallback: try to play a simple beep if Web Audio API fails
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.value = 800
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      } catch (e) {
        console.log('Audio not available')
      }
    }
  }

  // Function to play error sound ("אוי אוי אוי" - sad/disappointed sound)
  const playErrorSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const duration = 0.6 // 600ms
      const sampleRate = audioContext.sampleRate
      const numSamples = duration * sampleRate
      const buffer = audioContext.createBuffer(1, numSamples, sampleRate)
      const data = buffer.getChannelData(0)

      // Generate "אוי אוי אוי" sound - descending sad tones
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate
        let sample = 0
        
        // Three descending "אוי" sounds
        for (let oy = 0; oy < 3; oy++) {
          const oyStart = oy * 0.15
          const oyDuration = 0.12
          if (t >= oyStart && t < oyStart + oyDuration) {
            const localTime = t - oyStart
            // Descending frequency for each "אוי"
            const startFreq = 300 - oy * 30
            const endFreq = 200 - oy * 20
            const freq = startFreq + (endFreq - startFreq) * (localTime / oyDuration)
            const envelope = Math.sin(Math.PI * localTime / oyDuration) * 0.4
            sample += Math.sin(2 * Math.PI * freq * localTime) * envelope
          }
        }
        
        // Add some low-frequency rumble for disappointment
        if (t < 0.5) {
          sample += Math.sin(2 * Math.PI * 80 * t) * 0.1 * Math.exp(-t * 3)
        }
        
        data[i] = Math.max(-1, Math.min(1, sample))
      }

      const source = audioContext.createBufferSource()
      source.buffer = buffer
      source.connect(audioContext.destination)
      source.start(0)
    } catch (err) {
      // Fallback: try to play a low sad beep
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        // Low descending frequency for sad sound
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.4)
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.4)
      } catch (e) {
        console.log('Audio not available')
      }
    }
  }

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
      setCurrentQuestionId(data.question_id)
      setScore(0)
      setStage(1)
      setResult('')
      setWrongQuestions([])
      setGameEnded(false)
      setShowCelebration(false)
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
    }
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
            <Settings onSettingsSaved={async () => {
              // Update stage and winning score after settings are saved
              try {
                const state = await api.getCurrentGameState()
                setStage(state.current_stage)
                setWinningScore(state.winning_score)
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

      {/* Left Dinosaur - Image */}
      <div className={`absolute left-2 md:left-4 lg:left-8 bottom-0 z-20 pointer-events-none transition-transform duration-500 ${showCelebration ? 'animate-bounce' : ''}`} style={{ height: '25vh', minHeight: '180px', maxHeight: '250px' }}>
        <img 
          src="/static/dino_1.png" 
          alt="דינוזאור שמאלי" 
          className="h-full w-auto object-contain"
          style={{ 
            filter: 'drop-shadow(4px 4px 8px rgba(0,0,0,0.3))'
          }}
        />
      </div>

      {/* Right Dinosaur - Image */}
      <div className={`absolute right-2 md:right-4 lg:right-8 bottom-0 z-20 pointer-events-none transition-transform duration-500 ${showCelebration ? 'animate-bounce' : ''}`} style={{ height: '25vh', minHeight: '180px', maxHeight: '250px' }}>
        <img 
          src="/static/dino_2.png" 
          alt="דינוזאור ימני" 
          className="h-full w-auto object-contain"
          style={{ 
            filter: 'drop-shadow(4px 4px 8px rgba(0,0,0,0.3))'
          }}
        />
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

          {/* Stage and Score */}
          <div className="flex justify-center gap-4 mb-4 relative z-10">
            <div id="stage" className="text-sm md:text-base font-bold px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 shadow-md" style={{ color: '#654321' }}>
              🎯 רמה: {stage}
            </div>
            <div id="score" className={`text-sm md:text-base font-bold px-3 py-1.5 rounded-lg border-2 shadow-md transition-all duration-300 relative ${score > 0 ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-400 scale-105' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300'}`} style={{ color: '#654321' }}>
              ⭐ ניקוד: {score} / {winningScore}
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
              <h4 className="text-sm md:text-base font-bold mb-2 text-center" style={{ color: '#654321' }}>השאלות האחרונות שלא ידע לענות עליהן:</h4>
              <div className="bg-white/50 rounded-lg p-2 border-2 border-amber-300">
                <ul id="wrong-questions" dir="ltr" className="list-none text-center space-y-0.5">
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

