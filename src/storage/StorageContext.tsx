import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { StorageService } from './StorageService'
import { DexieStorageService } from './DexieStorageService'

const StorageContext = createContext<StorageService>(null!)

export function StorageProvider({ children }: { children: ReactNode }) {
  const service = useMemo(() => new DexieStorageService(), [])
  return (
    <StorageContext.Provider value={service}>
      {children}
    </StorageContext.Provider>
  )
}

export function useStorage(): StorageService {
  return useContext(StorageContext)
}
