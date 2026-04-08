import { useState } from 'react'
import Timer from './Timer'
import PoseImage from './PoseImage'
import type { LessonPose, Pose, PoseNote, PoseOutcome } from '../types'

interface PoseCardProps {
  lessonPose: LessonPose
  pose: Pose
  poseNote?: PoseNote
  lastHold?: number
  referenceLabel?: string
  referenceUrl?: string | null
  imageUrl?: string | null
  onOutcome: (outcome: PoseOutcome) => void
}

const SKIP_REASONS: { value: PoseOutcome['skipReason']; label: string }[] = [
  { value: 'missing-props', label: 'Missing props' },
  { value: 'rest', label: 'Rest' },
  { value: 'illness', label: 'Illness' },
  { value: 'travel', label: 'Travel' },
  { value: 'other', label: 'Other' },
]

export default function PoseCard({ lessonPose, pose, poseNote, lastHold, referenceLabel, referenceUrl, imageUrl, onOutcome }: PoseCardProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState<number | null>(null)
  const [showSkipSheet, setShowSkipSheet] = useState(false)

  function handleTimerStop(elapsed: number) {
    setElapsedSeconds(elapsed)
  }

  function handlePass() {
    onOutcome({
      poseId: pose.id,
      status: 'pass',
      holdSeconds: elapsedSeconds ?? undefined,
    })
  }

  function handleWorking() {
    onOutcome({
      poseId: pose.id,
      status: 'working',
      holdSeconds: elapsedSeconds ?? undefined,
    })
  }

  function handleSkip(reason: PoseOutcome['skipReason']) {
    setShowSkipSheet(false)
    onOutcome({
      poseId: pose.id,
      status: 'skipped',
      skipReason: reason,
    })
  }

  const displayName = lessonPose.displayName || pose.nameRomanised

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
      {/* Pose image */}
      <PoseImage
        imageUrl={imageUrl ?? null}
        altText={displayName}
        linkUrl={referenceUrl}
      />

      <div className="p-5">
      {/* Pose header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{displayName}</h2>
        {lessonPose.note && (
          <p className="text-sm text-gray-500 mt-0.5 italic">{lessonPose.note}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          {referenceLabel && (
            <span className="text-xs text-gray-400">{referenceLabel}</span>
          )}
          {lastHold && (
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
              Last time: {lastHold}s
            </span>
          )}
        </div>
      </div>

      {/* Pose note */}
      {poseNote && (
        <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <p className="text-sm text-amber-800 line-clamp-3">{poseNote.content}</p>
        </div>
      )}

      {/* Timer */}
      <Timer
        targetSeconds={lessonPose.holdSeconds}
        onStop={handleTimerStop}
      />

      {/* Outcome buttons */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        <button
          onClick={() => setShowSkipSheet(true)}
          className="py-2.5 rounded-lg bg-gray-50 text-gray-400 text-sm font-medium hover:bg-gray-100 active:bg-gray-200 border border-gray-100"
        >
          Skip
        </button>
        <button
          onClick={handleWorking}
          className="py-2.5 rounded-lg bg-amber-50 text-amber-600 text-sm font-medium hover:bg-amber-100 active:bg-amber-200 border border-amber-100"
        >
          Incomplete
        </button>
        <button
          onClick={handlePass}
          className="py-2.5 rounded-lg bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 active:bg-green-200 border border-green-100"
        >
          Successful
        </button>
      </div>

      </div>{/* end p-5 */}

      {/* Skip reason bottom sheet */}
      {showSkipSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setShowSkipSheet(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full bg-white rounded-t-2xl p-6 safe-area-inset-bottom"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-semibold text-gray-900 mb-4 text-center">Skip reason</h3>
            <div className="space-y-2">
              {SKIP_REASONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleSkip(value)}
                  className="w-full py-3 px-4 text-left rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSkipSheet(false)}
              className="w-full mt-3 py-3 text-gray-400 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
