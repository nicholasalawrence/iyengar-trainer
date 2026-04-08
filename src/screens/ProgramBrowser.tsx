import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { useStorage } from '../storage/StorageContext'
import type { UserProgram } from '../types'

export default function ProgramBrowser() {
  const storage = useStorage()
  const navigate = useNavigate()
  const programs = storage.getPrograms()
  const [userPrograms, setUserPrograms] = useState<UserProgram[]>([])
  const [enrolling, setEnrolling] = useState<string | null>(null)

  useEffect(() => {
    storage.getUserPrograms().then(setUserPrograms).catch(console.error)
  }, [storage])

  async function enroll(programId: string) {
    const user = await storage.getUser()
    if (!user) return

    setEnrolling(programId)
    try {
      const program = programs.find(p => p.id === programId)
      if (!program) return

      const newUserProgram: UserProgram = {
        id: uuidv4(),
        userId: user.id,
        programId,
        practiceType: program.practiceType,
        status: 'active',
        currentLessonId: program.lessons[0].id,
        startedAt: new Date().toISOString(),
        lessonProgress: [],
        progressionThreshold: 14,
      }

      await storage.saveUserProgram(newUserProgram)
      setUserPrograms(prev => [...prev, newUserProgram])
      navigate('/')
    } finally {
      setEnrolling(null)
    }
  }

  const enrolledProgramIds = new Set(
    userPrograms.filter(up => up.status === 'active').map(up => up.programId)
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-2 rounded-lg text-gray-400 hover:text-gray-600"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">Programs</h1>
      </div>

      <div className="space-y-4">
        {programs.map(program => {
          const isEnrolled = enrolledProgramIds.has(program.id)
          return (
            <div key={program.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{program.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      program.tier === 'free'
                        ? 'bg-green-50 text-green-700'
                        : program.tier === 'premium'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {program.tier}
                    </span>
                    {isEnrolled && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  {program.subtitle && (
                    <p className="text-sm text-gray-500 mt-0.5">{program.subtitle}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3 text-sm text-gray-400">
                <span>{program.lessons.length} lessons</span>
                <span>·</span>
                <span className="capitalize">{program.practiceType}</span>
              </div>

              {program.schemeOfPractice && (
                <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                  {program.schemeOfPractice}
                </p>
              )}

              {!isEnrolled && (
                <button
                  onClick={() => enroll(program.id)}
                  disabled={enrolling === program.id}
                  className="w-full py-2 px-4 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800 active:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enrolling === program.id ? 'Enrolling...' : 'Enroll'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
