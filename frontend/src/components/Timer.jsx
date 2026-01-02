import { useState, useEffect, useRef } from 'react'
import Button from './Button'

function Timer({ seconds, onTimeUp, isPaused: externalPaused, onTimeChange }) {
  const [remainingTime, setRemainingTime] = useState(seconds)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef(null)
  const remainingTimeRef = useRef(seconds)

  // Update ref when state changes
  useEffect(() => {
    remainingTimeRef.current = remainingTime
  }, [remainingTime])

  // Reset timer when seconds prop changes
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setRemainingTime(seconds)
    remainingTimeRef.current = seconds
    setIsPaused(false)
    if (onTimeChange) {
      onTimeChange(seconds)
    }
  }, [seconds, onTimeChange])

  // Handle timer countdown
  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Start timer if not paused and time > 0
    if (!isPaused && !externalPaused && remainingTimeRef.current > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          const current = remainingTimeRef.current
          if (current <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            remainingTimeRef.current = 0
            if (onTimeChange) {
              onTimeChange(0)
            }
            onTimeUp()
            return 0
          }
          const newTime = current - 1
          remainingTimeRef.current = newTime
          if (onTimeChange) {
            onTimeChange(newTime)
          }
          return newTime
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isPaused, externalPaused, onTimeUp, onTimeChange])

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

