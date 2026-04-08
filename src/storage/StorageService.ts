import type { User, UserProgram, Session, PoseNote, SkippedDay, Pose, Program, Source } from '../types'

export interface StorageService {
  // User
  getUser(): Promise<User | null>
  saveUser(user: User): Promise<void>

  // UserPrograms
  getUserPrograms(): Promise<UserProgram[]>
  saveUserProgram(up: UserProgram): Promise<void>
  deleteUserProgram(id: string): Promise<void>

  // Sessions
  getSessions(filters?: { userProgramId?: string; date?: string }): Promise<Session[]>
  saveSession(session: Session): Promise<void>

  // PoseNotes
  getPoseNotes(poseId?: string): Promise<PoseNote[]>
  savePoseNote(note: PoseNote): Promise<void>
  deletePoseNote(id: string): Promise<void>

  // SkippedDays
  getSkippedDays(): Promise<SkippedDay[]>
  saveSkippedDay(day: SkippedDay): Promise<void>
  deleteSkippedDay(id: string): Promise<void>

  // Static reads
  getPoses(): Pose[]
  getPrograms(): Program[]
  getSources(): Source[]
}
