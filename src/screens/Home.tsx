import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStorage } from '../storage/StorageContext'
import ProgramCard from '../components/ProgramCard'
import type { UserProgram, Program, Session } from '../types'

export default function Home() {
  const storage = useStorage()
  const navigate = useNavigate()
  const [userPrograms, setUserPrograms] = useState<UserProgram[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const programs = storage.getPrograms()

  useEffect(() => {
    async function load() {
      const [ups, sess] = await Promise.all([
        storage.getUserPrograms(),
        storage.getSessions(),
      ])
      setUserPrograms(ups.filter(up => up.status === 'active'))
      setSessions(sess)
      setIsLoading(false)
    }
    load().catch(console.error)
  }, [storage])

  const activePrograms = userPrograms.filter(up => up.status === 'active')

  function getProgramForUserProgram(up: UserProgram): Program | undefined {
    return programs.find(p => p.id === up.programId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yoga Tracker</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {activePrograms.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🧘</div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No active programs</h2>
          <p className="text-sm text-gray-400 mb-6">Add a program to get started.</p>
          <button
            onClick={() => navigate('/programs')}
            className="bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-green-800 active:bg-green-900"
          >
            Browse Programs
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {activePrograms.map(up => {
            const prog = getProgramForUserProgram(up)
            if (!prog) return null
            return (
              <ProgramCard
                key={up.id}
                userProgram={up}
                program={prog}
                sessions={sessions}
                onStart={() => {}}
              />
            )
          })}

          <button
            onClick={() => navigate('/programs')}
            className="w-full py-2.5 px-4 rounded-lg border border-dashed border-gray-200 text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
          >
            + Add Program
          </button>
        </div>
      )}
    </div>
  )
}
