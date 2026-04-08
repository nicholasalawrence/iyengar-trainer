import Dexie, { type Table } from 'dexie'
import type { User, UserProgram, Session, PoseNote, SkippedDay, Pose, Program, Source } from '../types'
import type { StorageService } from './StorageService'
import posesData from '../data/poses.json'
import programsData from '../data/programs.json'
import sourcesData from '../data/sources.json'

class YogaTrackerDB extends Dexie {
  userProfile!: Table<User, string>
  userPrograms!: Table<UserProgram, string>
  sessions!: Table<Session, string>
  poseNotes!: Table<PoseNote, string>
  skippedDays!: Table<SkippedDay, string>

  constructor() {
    super('YogaTrackerDB')
    this.version(1).stores({
      userProfile: 'id',
      userPrograms: 'id, userId, programId, status',
      sessions: 'id, userId, userProgramId, date, lessonId',
      poseNotes: 'id, userId, poseId',
      skippedDays: 'id, userId, date',
    })
  }
}

export class DexieStorageService implements StorageService {
  private db: YogaTrackerDB

  constructor() {
    this.db = new YogaTrackerDB()
  }

  // User
  async getUser(): Promise<User | null> {
    const users = await this.db.userProfile.toArray()
    return users[0] ?? null
  }

  async saveUser(user: User): Promise<void> {
    await this.db.userProfile.put(user)
  }

  // UserPrograms
  async getUserPrograms(): Promise<UserProgram[]> {
    return this.db.userPrograms.toArray()
  }

  async saveUserProgram(up: UserProgram): Promise<void> {
    await this.db.userPrograms.put(up)
  }

  async deleteUserProgram(id: string): Promise<void> {
    await this.db.userPrograms.delete(id)
  }

  // Sessions
  async getSessions(filters?: { userProgramId?: string; date?: string }): Promise<Session[]> {
    let sessions = await this.db.sessions.toArray()
    if (filters?.userProgramId) {
      sessions = sessions.filter(s => s.userProgramId === filters.userProgramId)
    }
    if (filters?.date) {
      sessions = sessions.filter(s => s.date === filters.date)
    }
    return sessions
  }

  async saveSession(session: Session): Promise<void> {
    await this.db.sessions.put(session)
  }

  // PoseNotes
  async getPoseNotes(poseId?: string): Promise<PoseNote[]> {
    if (poseId) {
      return this.db.poseNotes.where('poseId').equals(poseId).toArray()
    }
    return this.db.poseNotes.toArray()
  }

  async savePoseNote(note: PoseNote): Promise<void> {
    await this.db.poseNotes.put(note)
  }

  async deletePoseNote(id: string): Promise<void> {
    await this.db.poseNotes.delete(id)
  }

  // SkippedDays
  async getSkippedDays(): Promise<SkippedDay[]> {
    return this.db.skippedDays.toArray()
  }

  async saveSkippedDay(day: SkippedDay): Promise<void> {
    await this.db.skippedDays.put(day)
  }

  async deleteSkippedDay(id: string): Promise<void> {
    await this.db.skippedDays.delete(id)
  }

  // Static reads
  getPoses(): Pose[] {
    return posesData as Pose[]
  }

  getPrograms(): Program[] {
    return programsData as Program[]
  }

  getSources(): Source[] {
    return sourcesData as Source[]
  }
}
