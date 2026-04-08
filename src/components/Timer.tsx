import { useState, useEffect, useRef } from 'react'

interface TimerProps {
  targetSeconds?: number
  previousSeconds?: number
  onStop: (elapsed: number) => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function Timer({ targetSeconds, previousSeconds, onStop }: TimerProps) {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [stopped, setStopped] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed(e => e + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running])

  function handleStart() {
    setRunning(true)
  }

  function handleStop() {
    setRunning(false)
    setStopped(true)
    onStop(elapsed)
  }

  const targetReached = targetSeconds != null && elapsed >= targetSeconds
  const progressPct = targetSeconds
    ? Math.min((elapsed / targetSeconds) * 100, 100)
    : 0

  return (
    <div className="flex flex-col items-center gap-3 py-4">

      {/* Progress bar — only shown when there's a target */}
      {targetSeconds != null && running && (
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              targetReached ? 'bg-green-500' : 'bg-green-700'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* Elapsed time — shown once running or stopped */}
      {(running || stopped) && (
        <div
          className={`text-4xl font-mono font-light tracking-wide select-none ${
            targetReached ? 'text-green-600' : 'text-gray-900'
          }`}
        >
          {formatTime(elapsed)}
        </div>
      )}

      {/* Target + previous context */}
      <div className="flex items-center gap-3 text-xs text-gray-400">
        {targetSeconds != null && (
          <span>
            target: {formatTime(targetSeconds)}
            {targetReached && (
              <span className="ml-1.5 text-green-600 font-medium">✓ reached</span>
            )}
          </span>
        )}
        {previousSeconds != null && previousSeconds > 0 && (
          <span>last time: {previousSeconds}s</span>
        )}
      </div>

      {/* Controls */}
      {!running && !stopped && (
        <button
          onClick={handleStart}
          className="px-6 py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800 active:bg-green-900"
        >
          Start
        </button>
      )}
      {running && (
        <button
          onClick={handleStop}
          className="px-4 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-gray-300 hover:bg-gray-50"
        >
          Stop
        </button>
      )}
      {stopped && (
        <p className="text-xs text-gray-400">Logged {elapsed}s</p>
      )}
    </div>
  )
}
