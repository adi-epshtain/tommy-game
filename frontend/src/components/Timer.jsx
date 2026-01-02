import { useState, useEffect, useRef } from 'react'
import Button from './Button'

function Timer({ seconds, onTimeUp, isPaused: externalPaused }) {
  const [remainingTime, setRemainingTime] = useState(seconds)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    setRemainingTime(seconds)
    setIsPaused(false)
  }, [seconds])

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    if (!isPaused && !externalPaused && remainingTime > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            onTimeUp()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPaused, externalPaused, remainingTime, onTimeUp])

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  return (
    <div className="flex flex-col items-center">
      <p className="text-center">
        <span className="text-4xl">⏰</span> זמן שנותר: {remainingTime} שניות
        {remainingTime === 0 && <span style={{ color: 'red' }}> - נגמר הזמן!</span>}
      </p>
      <div className="mt-2">
        <Button variant="secondary" size="sm" onClick={togglePause}>
          {isPaused ? '▶️ המשך' : '⏸️ עצור'}
        </Button>
      </div>
    </div>
  )
}

export default Timer

