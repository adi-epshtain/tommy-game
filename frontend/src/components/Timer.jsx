import { useState, useEffect, useRef } from 'react'
import Button from './Button'

function Timer({ seconds, onTimeUp, isPaused: externalPaused, onTimeChange }) {
  const [remainingTime, setRemainingTime] = useState(seconds)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef(null)
  const onTimeUpRef = useRef(onTimeUp)
  const onTimeChangeRef = useRef(onTimeChange)
  const externalPausedRef = useRef(externalPaused)
  const isPausedRef = useRef(false)

  // Update refs when props change (without causing re-renders)
  useEffect(() => {
    onTimeUpRef.current = onTimeUp
    onTimeChangeRef.current = onTimeChange
    externalPausedRef.current = externalPaused
  }, [onTimeUp, onTimeChange, externalPaused])

  // Reset timer when seconds prop changes (new question)
  useEffect(() => {
    // Clear existing interval immediately
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    // Reset all timer state
    setRemainingTime(seconds)
    setIsPaused(false)
    isPausedRef.current = false
    
    // Notify parent of new time
    if (onTimeChangeRef.current) {
      onTimeChangeRef.current(seconds)
    }
  }, [seconds])

  // Handle timer countdown
  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Start timer if not paused and time > 0
    const shouldRun = !isPaused && !externalPaused && remainingTime > 0
    
    if (shouldRun) {
      intervalRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            // Time is up
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            if (onTimeChangeRef.current) {
              onTimeChangeRef.current(0)
            }
            if (onTimeUpRef.current) {
              onTimeUpRef.current()
            }
            return 0
          }
          const newTime = prev - 1
          if (onTimeChangeRef.current) {
            onTimeChangeRef.current(newTime)
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
  }, [isPaused, externalPaused, remainingTime])

  const togglePause = () => {
    const newPausedState = !isPaused
    setIsPaused(newPausedState)
    isPausedRef.current = newPausedState
    
    // Clear interval when pausing
    if (newPausedState && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  return (
    <div className="flex flex-col items-center">
      <p className="text-center text-base md:text-lg">
        <span className="text-2xl md:text-3xl">⏰</span> זמן שנותר: {remainingTime} שניות
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

