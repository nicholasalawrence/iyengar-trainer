import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useStorage } from '../storage/StorageContext'
import AdvancementPrompt from '../components/AdvancementPrompt'
import type { Session, UserProgram, Program, Lesson, LessonProgress } from '../types'

interface LocationState {
  session: Session
  userProgram: UserProgram
  program: Program
  lesson: Lesson
}

export default function SessionCompletion() {
  useParams<{ userProgramId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const storage = useStorage()

  const state = location.state as LocationState | null
  const savedRef = useRef(false)
  const [saved, setSaved] = useState(false)
  const [updatedUserProgram, setUpdatedUserProgram] = useState<UserProgram | null>(null)
  const [showAdvancement, setShowAdvancement] = useState(false)

  useEffect(() => {
    if (!state || savedRef.current) return
    savedRef.current = true

    async function saveAndUpdate() {
      const { session, userProgram, lesson } = state!

      // Save the session
      await storage.saveSession(session)

      // Update lesson progress
      const lessonIdStr = String(lesson.id)
      const existingProgress = userProgram.lessonProgress.find(
        lp => String(lp.lessonId) === lessonIdStr
      )

      // A session is clean when every pose was successful or deliberately skipped,
      // AND the breath was easy. Per spec: 'Incomplete' (working) on any pose = not clean.
      const totalCount = session.poseOutcomes.length
      const isClean =
        totalCount > 0 &&
        session.breathQuality === 'easy' &&
        session.poseOutcomes.every(o => o.status === 'pass' || o.status === 'skipped')

      let updatedProgress: LessonProgress
      if (existingProgress) {
        updatedProgress = {
          ...existingProgress,
          totalSessionCount: existingProgress.totalSessionCount + 1,
          cleanSessionCount: existingProgress.cleanSessionCount + (isClean ? 1 : 0),
          lastPassedAt: isClean ? session.completedAt : existingProgress.lastPassedAt,
          firstAttemptedAt: existingProgress.firstAttemptedAt ?? session.completedAt,
        }
      } else {
        updatedProgress = {
          lessonId: lesson.id,
          totalSessionCount: 1,
          cleanSessionCount: isClean ? 1 : 0,
          firstAttemptedAt: session.completedAt,
          lastPassedAt: isClean ? session.completedAt : undefined,
          promoted: false,
        }
      }

      const newLessonProgress = userProgram.lessonProgress
        .filter(lp => String(lp.lessonId) !== lessonIdStr)
        .concat(updatedProgress)

      const updated: UserProgram = {
        ...userProgram,
        lastSessionAt: session.completedAt,
        lessonProgress: newLessonProgress,
      }

      await storage.saveUserProgram(updated)
      setUpdatedUserProgram(updated)

      // Check if ready to advance: threshold met AND last 3 sessions all easy
      const threshold = userProgram.progressionThreshold
      if (updatedProgress.cleanSessionCount >= threshold) {
        const allSessions = await storage.getSessions({ userProgramId: userProgram.id })
        const lessonSessions = allSessions
          .filter(s => String(s.lessonId) === lessonIdStr)
          .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
        const recentThree = lessonSessions.slice(0, 3)
        const lastThreeEasy =
          recentThree.length >= 3 &&
          recentThree.every(s => s.breathQuality === 'easy')
        if (lastThreeEasy) {
          setShowAdvancement(true)
        }
      }

      setSaved(true)
    }

    saveAndUpdate().catch(console.error)
  }, [state, storage])

  async function handleAdvance() {
    if (!updatedUserProgram || !state) return

    const { program } = state
    const currentIdx = program.lessons.findIndex(
      l => String(l.id) === String(updatedUserProgram.currentLessonId)
    )
    const nextLesson = program.lessons[currentIdx + 1]

    if (nextLesson) {
      const currentLessonId = updatedUserProgram.currentLessonId
      const currentLessonIdStr = String(currentLessonId)

      const promoted: UserProgram = {
        ...updatedUserProgram,
        currentLessonId: nextLesson.id,
        lessonProgress: updatedUserProgram.lessonProgress.map(lp =>
          String(lp.lessonId) === currentLessonIdStr
            ? { ...lp, promoted: true, promotedAt: new Date().toISOString() }
            : lp
        ),
      }
      await storage.saveUserProgram(promoted)
    }

    setShowAdvancement(false)
    navigate('/')
  }

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-4">No session data found.</p>
          <button
            onClick={() => navigate('/')}
            className="text-green-700 font-medium text-sm"
          >
            Go home
          </button>
        </div>
      </div>
    )
  }

  const { session, lesson, program } = state
  const passed = session.poseOutcomes.filter(o => o.status === 'pass').length
  const working = session.poseOutcomes.filter(o => o.status === 'working').length
  const skipped = session.poseOutcomes.filter(o => o.status === 'skipped').length
  const total = session.poseOutcomes.length

  const currentLessonProgress = updatedUserProgram?.lessonProgress.find(
    lp => String(lp.lessonId) === String(lesson.id)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <p className="text-sm text-gray-400 truncate">{program.name}</p>
        <p className="text-base font-semibold text-gray-900">
          {lesson.label || `Lesson ${lesson.id}`} — Complete
        </p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Summary card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Session summary</h2>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-700">{passed}</div>
              <div className="text-xs text-green-600 mt-0.5">Successful</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-600">{working}</div>
              <div className="text-xs text-amber-500 mt-0.5">Incomplete</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-400">{skipped}</div>
              <div className="text-xs text-gray-400 mt-0.5">Skipped</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-700">{total}</div>
              <div className="text-xs text-gray-400 mt-0.5">Total poses</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm border-t border-gray-50 pt-3">
            {session.durationMinutes != null && (
              <div className="text-gray-500">
                <span className="font-medium text-gray-900">{session.durationMinutes}</span> min
              </div>
            )}
            {session.breathQuality && session.breathQuality !== 'not-logged' && (
              <div className="text-gray-500">
                Breath: <span className={`font-medium ${session.breathQuality === 'easy' ? 'text-green-600' : 'text-amber-600'}`}>
                  {session.breathQuality}
                </span>
              </div>
            )}
            {currentLessonProgress && (
              <div className="text-gray-400 text-xs">
                {currentLessonProgress.cleanSessionCount} clean / {currentLessonProgress.totalSessionCount} total
              </div>
            )}
          </div>
        </div>

        {/* Advancement prompt */}
        {showAdvancement && saved && updatedUserProgram && (
          <AdvancementPrompt
            lessonLabel={lesson.label || `Lesson ${lesson.id}`}
            cleanCount={currentLessonProgress?.cleanSessionCount ?? 0}
            threshold={updatedUserProgram.progressionThreshold}
            onAdvance={handleAdvance}
            onDismiss={() => {
              setShowAdvancement(false)
              navigate('/')
            }}
          />
        )}

        {/* Done button */}
        {(!showAdvancement || !saved) && (
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl bg-green-700 text-white font-medium hover:bg-green-800 active:bg-green-900"
          >
            Done
          </button>
        )}
      </div>
    </div>
  )
}
