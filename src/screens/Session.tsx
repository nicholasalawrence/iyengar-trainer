import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { useStorage } from '../storage/StorageContext'
import PoseCard from '../components/PoseCard'
import { useSourceResolver } from '../hooks/useSourceResolver'
import { useWikipediaImage } from '../hooks/useWikipediaImage'
import type { UserProgram, Program, Lesson, PoseOutcome, Session as SessionType, PoseNote, User } from '../types'

export default function Session() {
  const { userProgramId } = useParams<{ userProgramId: string }>()
  const navigate = useNavigate()
  const storage = useStorage()

  const [userProgram, setUserProgram] = useState<UserProgram | null>(null)
  const [program, setProgram] = useState<Program | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [poseCursor, setPoseCursor] = useState(0)
  const [outcomes, setOutcomes] = useState<PoseOutcome[]>([])
  const [poseNotes, setPoseNotes] = useState<PoseNote[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [breathQuality, setBreathQuality] = useState<'easy' | 'labored' | 'not-logged' | null>(null)
  const sessionStart = useRef(new Date())

  const poses = storage.getPoses()

  useEffect(() => {
    if (!userProgramId) return

    async function load() {
      const ups = await storage.getUserPrograms()
      const up = ups.find(u => u.id === userProgramId)
      if (!up) return

      const progs = storage.getPrograms()
      const prog = progs.find(p => p.id === up.programId)
      if (!prog) return

      const les = prog.lessons.find(l => String(l.id) === String(up.currentLessonId))
      if (!les) return

      const notes = await storage.getPoseNotes()
      const currentUser = await storage.getUser()

      setUserProgram(up)
      setProgram(prog)
      setLesson(les)
      setPoseNotes(notes)
      setUser(currentUser)
    }

    load().catch(console.error)
  }, [userProgramId, storage])

  function handleOutcome(outcome: PoseOutcome) {
    const newOutcomes = [...outcomes, outcome]
    setOutcomes(newOutcomes)

    if (!lesson) return

    if (poseCursor + 1 >= lesson.poses.length) {
      // All poses done — show breath quality selection
      setIsComplete(true)
    } else {
      setPoseCursor(c => c + 1)
    }
  }

  async function handleFinish(bq: 'easy' | 'labored' | 'not-logged') {
    if (!userProgram || !lesson) return

    const user = await storage.getUser()
    if (!user) return

    const durationMinutes = Math.round(
      (new Date().getTime() - sessionStart.current.getTime()) / 60000
    )

    const session: SessionType = {
      id: uuidv4(),
      userId: user.id,
      userProgramId: userProgram.id,
      lessonId: lesson.id,
      date: new Date().toISOString().slice(0, 10),
      breathQuality: bq,
      durationMinutes,
      poseOutcomes: outcomes,
      completedAt: new Date().toISOString(),
    }

    navigate(`/session-complete/${userProgram.id}`, {
      state: { session, userProgram, program, lesson },
    })
  }

  // Resolve source info for the current pose (hooks must be called unconditionally)
  const enabledSources = user?.enabledSources ?? ['yoga-iyengar-way', 'tummee', 'youtube']
  const currentPoseForHook = lesson?.poses[poseCursor]
    ? poses.find(p => p.id === lesson.poses[poseCursor].poseId) ?? null
    : null
  const { referenceLabel, referenceUrl } = useSourceResolver(
    currentPoseForHook?.id ?? '',
    {
      canonicalSourceId: program?.canonicalSourceId ?? '',
      userEnabledSources: enabledSources,
    }
  )
  const wikipediaImageUrl = useWikipediaImage(currentPoseForHook)

  if (!userProgram || !program || !lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400 text-sm">Loading session...</div>
      </div>
    )
  }

  const currentLessonPose = lesson.poses[poseCursor]
  const currentPose = currentLessonPose
    ? poses.find(p => p.id === currentLessonPose.poseId)
    : null

  const currentPoseNote = currentPose
    ? poseNotes.find(n => n.poseId === currentPose.id)
    : undefined

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-1 -ml-1 text-gray-400 hover:text-gray-600"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 truncate">{program.name}</p>
          <p className="text-sm font-semibold text-gray-900 truncate">
            {lesson.label || `Lesson ${lesson.id}`}
          </p>
        </div>
        {!isComplete && (
          <div className="text-xs text-gray-400 flex-shrink-0">
            {poseCursor + 1} / {lesson.poses.length}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {!isComplete && (
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-green-600 transition-all"
            style={{ width: `${((poseCursor + 1) / lesson.poses.length) * 100}%` }}
          />
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-6">
        {isComplete ? (
          /* Breath quality selection */
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2 text-center">
              Session complete!
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              How was your breathing during this session?
            </p>
            <div className="space-y-3">
              {(
                [
                  { value: 'easy' as const, label: 'Easy', desc: 'Breath was relaxed and steady' },
                  { value: 'labored' as const, label: 'Labored', desc: 'Breath felt strained or effortful' },
                  { value: 'not-logged' as const, label: 'Not logging', desc: "I didn't pay attention" },
                ] as const
              ).map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => {
                    setBreathQuality(value)
                    handleFinish(value)
                  }}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    breathQuality === value
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-gray-900">{label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
                </button>
              ))}
            </div>
          </div>
        ) : currentPose && currentLessonPose ? (
          <PoseCard
            key={`${poseCursor}-${currentPose.id}`}
            lessonPose={currentLessonPose}
            pose={currentPose}
            poseNote={currentPoseNote}
            referenceLabel={referenceLabel || undefined}
            referenceUrl={referenceUrl}
            imageUrl={wikipediaImageUrl}
            onOutcome={handleOutcome}
          />
        ) : (
          <div className="text-center text-gray-400 text-sm py-8">
            Pose not found in library
          </div>
        )}

        {/* Instructor notes */}
        {!isComplete && lesson.instructorNotes && lesson.instructorNotes.length > 0 && poseCursor === 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs font-medium text-blue-700 mb-1.5">Instructor notes</p>
            {lesson.instructorNotes.map((note, i) => (
              <p key={i} className="text-xs text-blue-600 leading-relaxed">{note}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
