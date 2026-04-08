// Core entities

export interface Pose {
  id: string                    // slug e.g. "trikonasana"
  nameRomanised: string
  nameSanskrit?: string
  nameEnglish?: string
  aliases?: string[]
  category?: 'standing' | 'seated' | 'supine' | 'inversion' | 'backbend' | 'twist' | 'balance' | 'pranayama' | 'relaxation'
  references?: PoseReference[]
}

export interface PoseReference {
  sourceId: string
  page?: number
  url?: string
  urlTemplate?: string
  searchQuery?: string
  verified?: boolean
}

export interface Source {
  id: string
  name: string
  type: 'book' | 'website' | 'video'
  author?: string
  publishYear?: number
  baseUrl?: string
  urlPattern?: string
  imageUrlPattern?: string
  publisherId?: string
  tier: 'free' | 'verified' | 'premium'
  notes?: string
}

export interface LessonPose {
  poseId: string
  displayName?: string
  note?: string
  canonicalPage?: number
  props?: string[]
  skipIfMissingProps?: boolean
  sets?: number
  holdSeconds?: number
  isDynamic?: boolean
}

export interface Lesson {
  id: number | string
  label?: string
  poses: LessonPose[]
  instructorNotes?: string[]
  estimatedMinutes?: number
  focus?: string
}

export interface Program {
  id: string
  name: string
  subtitle?: string
  description?: string
  practiceType: 'asana' | 'pranayama' | 'integrated' | 'meditation' | 'custom'
  canonicalSourceId: string
  publisherId?: string
  tags?: string[]
  purpose?: ('general' | 'pre-lift' | 'pre-meditation' | 'remedial' | 'custom')[]
  tier: 'free' | 'verified' | 'premium'
  schemeOfPractice?: string
  cautions?: string[]
  lessons: Lesson[]
  importSource?: string
  version?: string
  createdAt: string
  updatedAt: string
}

export interface LessonProgress {
  lessonId: string | number
  cleanSessionCount: number
  totalSessionCount: number
  firstAttemptedAt?: string
  lastPassedAt?: string
  promoted: boolean
  promotedAt?: string
}

export interface UserProgram {
  id: string
  userId: string
  programId: string
  practiceType: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  currentLessonId: string | number
  startedAt: string
  lastSessionAt?: string
  lessonProgress: LessonProgress[]
  progressionThreshold: number
  holdMultiplier?: number
  gapCountingMode?: 'strict' | 'any' | 'by-type'
  preferredSources?: string[]
}

export interface PoseOutcome {
  poseId: string
  status: 'pass' | 'working' | 'skipped' | 'not-logged'
  skipReason?: 'missing-props' | 'rest' | 'illness' | 'travel' | 'other'
  holdSeconds?: number
  note?: string
}

export interface Session {
  id: string
  userId: string
  userProgramId: string
  lessonId: string | number
  date: string
  breathQuality?: 'easy' | 'labored' | 'not-logged'
  overallNote?: string
  durationMinutes?: number
  poseOutcomes: PoseOutcome[]
  completedAt: string
}

export interface PoseNote {
  id: string
  userId: string
  poseId: string
  content: string
  createdAt: string
  updatedAt: string
  sourceSessionId?: string
  isPinned?: boolean
  tags?: string[]
}

export interface UserSettings {
  progressionThresholdDefault?: number
  holdMultiplierDefault?: number
  gapCountingMode?: 'strict' | 'any' | 'by-type'
  availableProps?: string[]
  pranayamaReminder?: boolean
  defaultSessionDuration?: number
  theme?: 'light' | 'dark' | 'system'
}

export interface User {
  id: string
  displayName?: string
  subscriptionTier: 'free' | 'pro'
  preferredSources?: string[]
  enabledSources?: string[]
  settings?: UserSettings
  createdAt: string
}

export interface SkippedDay {
  id: string
  userId: string
  date: string
  reason: 'rest' | 'illness' | 'injury' | 'menstruation' | 'travel' | 'other'
  note?: string
  appliesToAll: boolean
  programIds?: string[]
}
