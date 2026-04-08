import { useState, useEffect } from 'react'
import { useStorage } from '../storage/StorageContext'
import type { Session, UserProgram, Program } from '../types'

interface GroupedSession {
  date: string
  sessions: Array<{
    session: Session
    userProgram: UserProgram | undefined
    program: Program | undefined
  }>
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function Progress() {
  const storage = useStorage()
  const [sessions, setSessions] = useState<Session[]>([])
  const [userPrograms, setUserPrograms] = useState<UserProgram[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const programs = storage.getPrograms()

  useEffect(() => {
    async function load() {
      const [sess, ups] = await Promise.all([
        storage.getSessions(),
        storage.getUserPrograms(),
      ])
      setSessions(sess.sort((a, b) => b.date.localeCompare(a.date)))
      setUserPrograms(ups)
      setIsLoading(false)
    }
    load().catch(console.error)
  }, [storage])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    )
  }

  // Group sessions by date
  const grouped: GroupedSession[] = []
  const dateMap = new Map<string, GroupedSession>()

  for (const session of sessions) {
    if (!dateMap.has(session.date)) {
      const group: GroupedSession = { date: session.date, sessions: [] }
      dateMap.set(session.date, group)
      grouped.push(group)
    }
    const userProgram = userPrograms.find(up => up.id === session.userProgramId)
    const program = programs.find(p => p.id === userProgram?.programId)
    dateMap.get(session.date)!.sessions.push({ session, userProgram, program })
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Progress</h1>

      {grouped.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No sessions yet</h2>
          <p className="text-sm text-gray-400">Complete a session to see your progress here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(group => (
            <div key={group.date}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {formatDate(group.date)}
              </h2>
              <div className="space-y-2">
                {group.sessions.map(({ session, program }) => {
                  const passed = session.poseOutcomes.filter(o => o.status === 'pass').length
                  const total = session.poseOutcomes.length

                  return (
                    <div
                      key={session.id}
                      className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {program?.name ?? 'Unknown program'}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Lesson {session.lessonId}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-medium text-green-700">{passed}/{total}</p>
                          <p className="text-xs text-gray-400">passed</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        {session.breathQuality && session.breathQuality !== 'not-logged' && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            session.breathQuality === 'easy'
                              ? 'bg-green-50 text-green-600'
                              : 'bg-amber-50 text-amber-600'
                          }`}>
                            {session.breathQuality} breath
                          </span>
                        )}
                        {session.durationMinutes != null && (
                          <span className="text-xs text-gray-400">{session.durationMinutes} min</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
