import { useState, useEffect, useRef } from 'react'
import { useStorage } from '../storage/StorageContext'
import type { User, UserSettings } from '../types'

const PROPS_OPTIONS = ['block', 'strap', 'blanket', 'bolster', 'chair', 'wall']
const HOLD_MULTIPLIER_OPTIONS = [
  { value: 0.5, label: '0.5x' },
  { value: 0.75, label: '0.75x' },
  { value: 1, label: '1x (default)' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
]

export default function Settings() {
  const storage = useStorage()
  const [user, setUser] = useState<User | null>(null)
  const [threshold, setThreshold] = useState(14)
  const [holdMultiplier, setHoldMultiplier] = useState(1)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [availableProps, setAvailableProps] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    storage.getUser().then(u => {
      if (!u) return
      setUser(u)
      setThreshold(u.settings?.progressionThresholdDefault ?? 14)
      setHoldMultiplier(u.settings?.holdMultiplierDefault ?? 1)
      setTheme(u.settings?.theme ?? 'system')
      setAvailableProps(u.settings?.availableProps ?? [])
    }).catch(console.error)
  }, [storage])

  function saveSettings(updates: Partial<UserSettings>) {
    if (!user) return

    const newSettings: UserSettings = {
      ...(user.settings ?? {}),
      ...updates,
    }

    const updatedUser: User = { ...user, settings: newSettings }
    setUser(updatedUser)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setIsSaving(true)
      try {
        await storage.saveUser(updatedUser)
      } finally {
        setIsSaving(false)
      }
    }, 500)
  }

  function handleThresholdChange(val: number) {
    setThreshold(val)
    saveSettings({ progressionThresholdDefault: val })
  }

  function handleMultiplierChange(val: number) {
    setHoldMultiplier(val)
    saveSettings({ holdMultiplierDefault: val })
  }

  function handleThemeChange(val: 'light' | 'dark' | 'system') {
    setTheme(val)
    saveSettings({ theme: val })
  }

  function toggleProp(prop: string) {
    const newProps = availableProps.includes(prop)
      ? availableProps.filter(p => p !== prop)
      : [...availableProps, prop]
    setAvailableProps(newProps)
    saveSettings({ availableProps: newProps })
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        {isSaving && <span className="text-xs text-gray-400">Saving...</span>}
      </div>

      <div className="space-y-6">
        {/* Progression threshold */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            Progression threshold
          </label>
          <p className="text-xs text-gray-400 mb-3">
            Number of clean sessions before prompting to advance to the next lesson.
          </p>
          <input
            type="number"
            min="1"
            max="100"
            value={threshold}
            onChange={e => handleThresholdChange(Number(e.target.value))}
            className="w-24 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          />
        </div>

        {/* Hold multiplier */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            Hold multiplier
          </label>
          <p className="text-xs text-gray-400 mb-3">
            Multiplier for suggested hold durations.
          </p>
          <select
            value={holdMultiplier}
            onChange={e => handleMultiplierChange(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            {HOLD_MULTIPLIER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Theme */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <label className="block text-sm font-semibold text-gray-900 mb-3">Theme</label>
          <div className="flex gap-2">
            {(['light', 'dark', 'system'] as const).map(t => (
              <button
                key={t}
                onClick={() => handleThemeChange(t)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${
                  theme === t
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Available props */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <label className="block text-sm font-semibold text-gray-900 mb-1">
            Available props
          </label>
          <p className="text-xs text-gray-400 mb-3">
            Check the props you have available for practice.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PROPS_OPTIONS.map(prop => (
              <label
                key={prop}
                className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={availableProps.includes(prop)}
                  onChange={() => toggleProp(prop)}
                  className="w-4 h-4 rounded accent-green-700"
                />
                <span className="text-sm text-gray-700 capitalize">{prop}</span>
              </label>
            ))}
          </div>
        </div>

        {/* App info */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-300">Yoga Tracker v1.0</p>
        </div>
      </div>
    </div>
  )
}
