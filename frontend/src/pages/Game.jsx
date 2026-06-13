import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, removeToken } from '../services/api'
import Settings from '../components/Settings'
import Leaderboard from '../components/Leaderboard'
import Button from '../components/Button'
import DinosaurSelection from '../components/DinosaurSelection'

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
  const [isMuted, setIsMuted] = useState(false) // Mute state for sound effects
  const navigate = useNavigate()

  // Function to play celebration sound (applause/clapping)
  const playCelebrationSound = () => {
    if (isMuted) return // Don't play if muted
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

  // Function to play top 3 victory sound (special win sound for top 3)
  const playTop3VictorySound = (rank) => {
    if (isMuted) return // Don't play if muted
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Create a pleasant victory fanfare
      const baseFreq = 440 // A4
      const notes = rank === 1 
        ? [0, 4, 7, 12, 16, 19, 16, 12] // Major scale - more impressive
        : rank === 2
        ? [0, 3, 7, 10, 12] // Less impressive but still nice
        : [0, 2, 5, 9] // Simple and pleasant
      
      const duration = 3.5 // 3.5 seconds total
      const noteDuration = duration / notes.length
      const startTime = audioContext.currentTime
      
      // Play each note
      notes.forEach((semitone, index) => {
        const freq = baseFreq * Math.pow(2, semitone / 12)
        const noteStart = startTime + index * noteDuration
        
        oscillator.frequency.setValueAtTime(freq, noteStart)
        
        // Volume envelope - quick attack, gentle decay
        const attackTime = 0.05
        const sustainTime = noteDuration * 0.6
        const decayTime = noteDuration * 0.35
        const volume = rank === 1 ? 0.4 : rank === 2 ? 0.35 : 0.3
        
        gainNode.gain.setValueAtTime(0, noteStart)
        gainNode.gain.linearRampToValueAtTime(volume, noteStart + attackTime)
        gainNode.gain.setValueAtTime(volume, noteStart + attackTime + sustainTime)
        gainNode.gain.linearRampToValueAtTime(0, noteStart + attackTime + sustainTime + decayTime)
      })
      
      oscillator.type = 'sine' // Smooth sine wave
      oscillator.start(startTime)
      oscillator.stop(startTime + duration + 0.1)
    } catch (err) {
      // Fallback: play celebration sound
      playCelebrationSound()
    }
  }

  // Function to play error sound ("אוי אוי אוי" - sad/disappointed sound)
  const playErrorSound = () => {
    if (isMuted) return // Don't play if muted
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
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center p-8 z-10">
          <div className="max-w-4xl w-full">
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
        style={{
          backgroundImage: 'url(/static/math_dino2.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center p-8 z-10">
          <div className="max-w-4xl w-full">
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
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center p-8 z-10">
          {/* Fixed Header with Play Again Button - Always visible at top */}
          <div className="fixed top-0 left-0 right-0 z-50 w-full" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <div className="max-w-4xl mx-auto px-4 py-4">
              <div className="flex justify-between items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#654321' }}>
                  🎉 כל הכבוד {gameEndData.player_name}!
                </h1>
                <Button 
                  onClick={() => window.location.reload()} 
                  size="lg"
                  style={{ fontSize: '1.25rem', padding: '0.75rem 1.5rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                >
                  🎮 שחק שוב
                </Button>
              </div>
            </div>
          </div>
          
          {/* Scrollable Content - with top padding to account for fixed header */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full flex-1 overflow-y-auto" style={{ marginTop: '100px' }}>
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
        backgroundImage: 'url(/static/math_dino2.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}>
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center p-8 z-50">
          <div className="w-full max-w-5xl">
            <div className="bg-white rounded-xl shadow-lg p-4 mb-6 flex justify-between items-center">
              <h2 className="text-3xl font-bold" style={{ color: '#654321' }}>🦕 האוסף שלי</h2>
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
              <div className="max-h-[70vh] overflow-y-auto p-4 space-y-6">
                {[1, 2, 3, 4, 5].map((level) => {
                  const levelDinosaurs = playerDinosaurs.filter(d => parseInt(d.level) === level)
                  if (levelDinosaurs.length === 0) return null
                  
                  return (
                    <div key={level} className="space-y-2">
                      <h3 className="text-xl font-bold mb-3" style={{ color: '#654321' }}>
                        רמה {level}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {levelDinosaurs.map((dino) => (
                          <div
                            key={dino.id}
                            className={`rounded-xl p-4 shadow-lg border-2 bg-gradient-to-br ${levelColors[dino.level] || levelColors['1']}`}
                          >
                            <div className="text-center">
                              <img
                                src={dino.image_path}
                                alt={dino.name}
                                className="mx-auto w-32 h-32 object-contain mb-3"
                              />
                              <div className="font-bold text-lg mb-1" style={{ color: '#654321' }}>
                                {dino.name}
                              </div>
                              {dino.description && (
                                <div className="text-xs text-gray-600 mb-2">
                                  {dino.description}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
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
                variant="secondary"
                onClick={() => setShowSettings(false)}
              >
                ← חזור למשחק (ללא שמירה)
              </Button>
            </div>
            <Settings onSettingsSaved={async () => {
              // Update stage and winning score after settings are saved
              try {
                const state = await api.getCurrentGameState()
                setStage(state.current_stage)
                setWinningScore(state.winning_score)
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
        <div className="flex gap-2 flex-shrink-0">
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
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowDinosaurGallery(true)}
          >
            🦕 האוסף שלי ({playerDinosaurs.length})
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowDinosaurViewOnly(true)}
          >
            👀 דינוזאורים זמינים
          </Button>
        </div>
        <h1 className="flex-1 text-center text-xl md:text-2xl font-bold px-4" style={{ color: '#2d5016', textShadow: '1px 1px 2px rgba(255,255,255,0.5)' }}>ברוך הבא למשחק של דינו וטומי!!!</h1>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="px-3 py-2 rounded-lg border-2 font-semibold text-sm transition-all duration-200 flex items-center gap-2"
            style={{ 
              backgroundColor: isMuted ? '#ff6b6b' : '#4ade80',
              borderColor: isMuted ? '#dc2626' : '#22c55e',
              color: 'white',
              boxShadow: isMuted ? '0 2px 8px rgba(220, 38, 38, 0.3)' : '0 2px 8px rgba(34, 197, 94, 0.3)',
              transform: 'scale(1)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span className="text-lg">{isMuted ? '🔇' : '🔊'}</span>
            <span>{isMuted ? 'מושתק' : 'פעיל'}</span>
          </button>
          <Button 
            variant="secondary"
            size="sm"
            onClick={handleLogout}
          >
            🔒 התנתקות
          </Button>
        </div>
      </header>

      {/* Display player's collected dinosaurs - positioned at bottom to avoid the question card */}
      {playerDinosaurs.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-15 pointer-events-none flex items-end justify-center gap-2 md:gap-3 flex-wrap px-4 py-2" style={{ maxHeight: 'calc(40vh)', overflowY: 'auto' }}>
          {playerDinosaurs.map((dino, index) => {
            // Calculate size based on number of dinosaurs - smaller when there are more
            const baseSize = 240
            const minSize = 150
            const totalDinosaurs = playerDinosaurs.length
            // Reduce size as more dinosaurs are added, but keep minimum size
            const sizeReduction = Math.max(0, (totalDinosaurs - 5) * 12)
            const size = Math.max(minSize, baseSize - sizeReduction)
            
            return (
              <div
                key={dino.id}
                className={`transition-transform duration-500 ${showCelebration ? 'animate-bounce' : ''}`}
                style={{
                  height: `${size}px`,
                  width: `${size * 0.8}px`,
                  flexShrink: 0,
                  animationDelay: showCelebration ? `${index * 0.1}s` : '0s'
                }}
              >
                <img 
                  src={dino.image_path} 
                  alt={dino.name} 
                  className="h-full w-full object-contain"
                  style={{ 
                    filter: 'drop-shadow(4px 4px 8px rgba(0,0,0,0.3))'
                  }}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Growing Dinosaur Progress Bar - Right Side */}
      {!gameEnded && !showDinosaurSelection && !showTop3Celebration && !showAdvanceDialog && !showSettings && !showDinosaurGallery && !showDinosaurViewOnly && winningScore > 0 && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-25 flex flex-col items-center" style={{ marginTop: '40px' }}>
          <div className="relative flex items-end gap-4" style={{ width: '150px', height: '400px' }}>
            {/* Progress Bar Track - Vertical (Blue Style) */}
            <div 
              className="relative"
              style={{
                width: '30px',
                height: '300px',
                background: '#E3F2FD',
                borderRadius: '15px',
                border: '2px solid #90CAF9',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}
            >
              {/* Progress Fill - Light Blue */}
              {(() => {
                const progressPercent = Math.min(Math.max((score / winningScore) * 100, 0), 100)
                return (
                  <>
                    <div 
                      className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
                      style={{
                        height: `${progressPercent}%`,
                        minHeight: score > 0 ? '4px' : '0px',
                        background: 'linear-gradient(180deg, #64B5F6 0%, #42A5F5 50%, #2196F3 100%)',
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
                  color: '#1976D2',
                  textShadow: '1px 1px 2px rgba(255,255,255,0.8)'
                }}
              >
                {winningScore} / {score}
              </div>
            </div>
          </div>
        </div>
      )}

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
            <h2 className="text-2xl md:text-3xl mb-3 text-center relative z-10 font-bold" style={{
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

          {/* Stage */}
          <div className="flex justify-center gap-4 mb-4 relative z-10">
            <div id="stage" className="text-sm md:text-base font-bold px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 shadow-md" style={{ color: '#654321' }}>
              🎯 רמה: {stage}
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

