import type { RailDB } from '../schema'
import type { InspectionResult, Measurement, ResultValue } from '../../../types'

interface UpsertResultInput {
  sessionId: string
  elementId: string
  inspectionPointId: string
  stationId: string
  result: ResultValue
  notes: string
  measurements: Measurement[]
}

export async function upsertResult(
  db: RailDB,
  {
    sessionId,
    elementId,
    inspectionPointId,
    stationId,
    result,
    notes,
    measurements,
  }: UpsertResultInput,
): Promise<InspectionResult> {
  const existing = await db.inspectionResults
    .where('[sessionId+elementId]')
    .equals([sessionId, elementId])
    .first()

  const record: InspectionResult = {
    id: existing?.id ?? crypto.randomUUID(),
    sessionId,
    elementId,
    inspectionPointId,
    stationId,
    inspectedAt: Date.now(),
    result,
    notes,
    measurements,
  }

  await db.inspectionResults.put(record)
  return record
}

export async function getResultsForSession(
  db: RailDB,
  sessionId: string,
): Promise<InspectionResult[]> {
  return db.inspectionResults.where('sessionId').equals(sessionId).toArray()
}
