import { useNavigate } from 'react-router-dom'
import type { UserProgram, Program, Session } from '../types'

interface ProgramCardProps {
  userProgram: UserProgram
  program: Program
  sessions: Session[]
  onStart: () => void
}

function formatLastPracticed(dateStr: string): string {
  const last = new Date(dateStr)
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10)
  const lastDate = last.toISOString().slice(0, 10)

  if (lastDate === today) return 'Today'
  if (lastDate === yesterday) return 'Yesterday'

  const diffDays = Math.floor((now.getTime() - last.getTime()) / 86400000)
  return `${diffDays} days ago`
}

function computeStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0

  const today = new Date()
  const dates = [...new Set(sessions.map(s => s.date))].sort().reverse()

  let streak = 0
  let checkDate = new Date(today)

  for (const dateStr of dates) {
    const d = new Date(dateStr)
    const diffDays = Math.floor((checkDate.getTime() - d.getTime()) / 86400000)

    if (diffDays <= 1) {
      streak++
      checkDate = d
    } else {
      break
    }
  }

  return streak
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function ProgramCard({ userProgram, program, sessions, onStart }: ProgramCardProps) {
  const navigate = useNavigate()

  const currentLesson = program.lessons.find(
    l => String(l.id) === String(userProgram.currentLessonId)
  )

  const todayStr = getTodayStr()
  const hasSessionToday = sessions.some(
    s => s.userProgramId === userProgram.id && s.date === todayStr
  )

  const programSessions = sessions.filter(s => s.userProgramId === userProgram.id)
  const streak = computeStreak(programSessions)

  const lastSessionDate = userProgram.lastSessionAt
  const daysSinceLast = lastSessionDate
    ? Math.floor((new Date().getTime() - new Date(lastSessionDate).getTime()) / 86400000)
    : null

  const showGap = daysSinceLast !== null && daysSinceLast >= 2

  const handleStart = () => {
    navigate(`/session/${userProgram.id}`)
    onStart()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{program.name}</h3>
            {showGap && (
              <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="Gap in practice" />
            )}
          </div>
          {program.subtitle && (
            <p className="text-sm text-gray-500">{program.subtitle}</p>
          )}
        </div>
        {streak > 0 && (
          <div className="flex-shrink-0 ml-2 text-right">
            <div className="text-lg font-bold text-green-700">{streak}</div>
            <div className="text-xs text-gray-400">day streak</div>
          </div>
        )}
      </div>

      <div className="space-y-1 mb-4">
        {currentLesson && (
          <p className="text-sm text-gray-700">
            <span className="text-gray-400">Current: </span>
            {currentLesson.label || `Lesson ${currentLesson.id}`}
          </p>
        )}
        {lastSessionDate && (
          <p className="text-sm text-gray-400">
            Last practiced: {formatLastPracticed(lastSessionDate)}
          </p>
        )}
      </div>

      <button
        onClick={handleStart}
        disabled={hasSessionToday}
        className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-colors ${
          hasSessionToday
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-green-700 text-white hover:bg-green-800 active:bg-green-900'
        }`}
      >
        {hasSessionToday ? 'Done today' : 'Start Session'}
      </button>
    </div>
  )
}
