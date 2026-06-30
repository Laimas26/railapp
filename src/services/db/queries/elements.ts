import type { RailDB } from '../schema'
import type { SchematicElement } from '../../../types'

export async function getElementsByStation(
  db: RailDB,
  stationId: string,
): Promise<SchematicElement[]> {
  return db.schematicElements.where('stationId').equals(stationId).toArray()
}

export async function getElementBySvgId(
  db: RailDB,
  stationId: string,
  svgElementId: string,
): Promise<SchematicElement | undefined> {
  return db.schematicElements
    .where('svgElementId')
    .equals(svgElementId)
    .filter((el) => el.stationId === stationId)
    .first()
}
