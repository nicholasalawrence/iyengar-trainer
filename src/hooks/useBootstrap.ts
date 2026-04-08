import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useStorage } from '../storage/StorageContext'
import type { User } from '../types'

interface BootstrapResult {
  user: User | null
  isReady: boolean
}

export function useBootstrap(): BootstrapResult {
  const storage = useStorage()
  const [user, setUser] = useState<User | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      let existingUser = await storage.getUser()

      if (!existingUser) {
        existingUser = {
          id: uuidv4(),
          subscriptionTier: 'free',
          enabledSources: ['yoga-iyengar-way', 'tummee', 'youtube'],
          createdAt: new Date().toISOString(),
        }
        await storage.saveUser(existingUser)
      }

      if (!cancelled) {
        setUser(existingUser)
        setIsReady(true)
      }
    }

    bootstrap().catch(console.error)

    return () => {
      cancelled = true
    }
  }, [storage])

  return { user, isReady }
}
