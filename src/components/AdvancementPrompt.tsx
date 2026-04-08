interface AdvancementPromptProps {
  lessonLabel: string
  cleanCount: number
  threshold: number
  onAdvance: () => void
  onDismiss: () => void
}

export default function AdvancementPrompt({
  lessonLabel,
  cleanCount,
  threshold,
  onAdvance,
  onDismiss,
}: AdvancementPromptProps) {
  return (
    <div className="bg-green-50 rounded-xl border border-green-200 p-5">
      <div className="text-2xl mb-3 text-center">🌿</div>
      <h3 className="font-semibold text-green-900 text-center mb-2">
        Ready to advance?
      </h3>
      <p className="text-sm text-green-700 text-center mb-1">
        You've practiced <span className="font-semibold">{lessonLabel}</span> cleanly {cleanCount} times.
      </p>
      <p className="text-xs text-green-600 text-center mb-5">
        That meets the threshold of {threshold} clean sessions.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onDismiss}
          className="flex-1 py-2.5 rounded-lg border border-green-300 text-green-700 text-sm font-medium hover:bg-green-100"
        >
          Not yet
        </button>
        <button
          onClick={onAdvance}
          className="flex-1 py-2.5 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800"
        >
          Yes, advance
        </button>
      </div>
    </div>
  )
}
