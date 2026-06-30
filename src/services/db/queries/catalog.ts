import type { RailDB } from '../schema'
import type { InspectionPoint, Station } from '../../../types'

export async function getInspectionPoints(db: RailDB): Promise<InspectionPoint[]> {
  return db.inspectionPoints.toArray()
}

export async function getInspectionPoint(
  db: RailDB,
  id: string,
): Promise<InspectionPoint | undefined> {
  return db.inspectionPoints.get(id)
}

export async function getDefaultStation(db: RailDB): Promise<Station | undefined> {
  return db.stations.toCollection().first()
}

export async function getStation(db: RailDB, id: string): Promise<Station | undefined> {
  return db.stations.get(id)
}
