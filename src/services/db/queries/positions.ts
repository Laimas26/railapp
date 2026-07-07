import type { RailDB } from '../schema'
import type { ElementPosition } from '../../../types'

export async function getPositions(
  db: RailDB,
  stationId: string,
): Promise<ElementPosition[]> {
  return db.elementPositions.where('stationId').equals(stationId).toArray()
}

export async function setPosition(
  db: RailDB,
  pos: ElementPosition,
): Promise<void> {
  await db.elementPositions.put(pos)
}

export async function deletePosition(db: RailDB, id: string): Promise<void> {
  await db.elementPositions.delete(id)
}

export async function bulkSetPositions(
  db: RailDB,
  positions: ElementPosition[],
): Promise<void> {
  await db.elementPositions.bulkPut(positions)
}
