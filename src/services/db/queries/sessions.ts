import type { RailDB } from '../schema'
import type { InspectionSession } from '../../../types'

interface CreateSessionInput {
  stationId: string
  inspectionPointId: string
  date: string
}

export async function createOrResumeSession(
  db: RailDB,
  { stationId, inspectionPointId, date }: CreateSessionInput,
): Promise<InspectionSession> {
  // Atomic read-then-write so a double-tap can't create two in-progress
  // sessions for the same station+point+date.
  return db.transaction('rw', db.inspectionSessions, async () => {
    const existing = await db.inspectionSessions
      .where('[stationId+date]')
      .equals([stationId, date])
      .filter(
        (s) => s.inspectionPointId === inspectionPointId && s.status === 'in-progress',
      )
      .first()

    if (existing) return existing

    const session: InspectionSession = {
      id: crypto.randomUUID(),
      stationId,
      inspectionPointId,
      date,
      startedAt: Date.now(),
      completedAt: null,
      status: 'in-progress',
    }
    await db.inspectionSessions.add(session)
    return session
  })
}

export async function getSession(
  db: RailDB,
  id: string,
): Promise<InspectionSession | undefined> {
  return db.inspectionSessions.get(id)
}

export async function completeSession(db: RailDB, id: string): Promise<void> {
  await db.inspectionSessions.update(id, {
    status: 'completed',
    completedAt: Date.now(),
  })
}

export async function listSessions(db: RailDB): Promise<InspectionSession[]> {
  const sessions = await db.inspectionSessions.toArray()
  return sessions.sort((a, b) => b.startedAt - a.startedAt)
}

export async function getInProgressSessions(
  db: RailDB,
  date: string,
): Promise<InspectionSession[]> {
  return db.inspectionSessions
    .where('date')
    .equals(date)
    .filter((s) => s.status === 'in-progress')
    .toArray()
}
