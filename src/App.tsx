import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { StorageProvider } from './storage/StorageContext'
import { useBootstrap } from './hooks/useBootstrap'
import Home from './screens/Home'
import ProgramBrowser from './screens/ProgramBrowser'
import Session from './screens/Session'
import SessionCompletion from './screens/SessionCompletion'
import Progress from './screens/Progress'
import Settings from './screens/Settings'

// SVG Icons
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#15803d' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function ChartIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#15803d' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function ListIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#15803d' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

function GearIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#15803d' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function BottomNav() {
  const location = useLocation()
  const isSession = location.pathname.startsWith('/session')

  if (isSession) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50 safe-area-inset-bottom">
      {[
        { to: '/', label: 'Home', Icon: HomeIcon },
        { to: '/progress', label: 'Progress', Icon: ChartIcon },
        { to: '/programs', label: 'Programs', Icon: ListIcon },
        { to: '/settings', label: 'Settings', Icon: GearIcon },
      ].map(({ to, label, Icon }) => {
        const active = to === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(to)
        return (
          <NavLink
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5"
          >
            <Icon active={active} />
            <span className={`text-xs font-medium ${active ? 'text-green-700' : 'text-gray-400'}`}>
              {label}
            </span>
          </NavLink>
        )
      })}
    </nav>
  )
}

function AppContent() {
  const { isReady } = useBootstrap()

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <div className="flex-1 pb-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/programs" element={<ProgramBrowser />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/session/:userProgramId" element={<Session />} />
          <Route path="/session-complete/:userProgramId" element={<SessionCompletion />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <StorageProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </StorageProvider>
  )
}
