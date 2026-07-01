import Dexie, { type EntityTable } from 'dexie'
import type {
  Station,
  SchematicElement,
  InspectionPoint,
  InspectionSession,
  InspectionResult,
  ElementPosition,
} from '../../types'

// ---------------------------------------------------------------------------
// Dexie database definition.
//
// SCHEMA MIGRATION RULE (also in CLAUDE.md):
//   NEVER edit an existing .version() block. To change table structure, add a
//   NEW .version(N).stores(...).upgrade(...) block with the next integer.
//   Only fields that are indexed need to be listed in .stores(); other fields
//   are stored implicitly. Composite/array indexes use [a+b] / *tags syntax.
// ---------------------------------------------------------------------------

export class RailDB extends Dexie {
  stations!: EntityTable<Station, 'id'>
  schematicElements!: EntityTable<SchematicElement, 'id'>
  inspectionPoints!: EntityTable<InspectionPoint, 'id'>
  inspectionSessions!: EntityTable<InspectionSession, 'id'>
  inspectionResults!: EntityTable<InspectionResult, 'id'>
  elementPositions!: EntityTable<ElementPosition, 'id'>

  constructor() {
    super('railapp')

    this.version(1).stores({
      stations: 'id',
      schematicElements:
        'id, stationId, elementType, trackClass, svgElementId, [stationId+elementType], [stationId+trackClass]',
      inspectionPoints: 'id, baseCode',
      inspectionSessions:
        'id, stationId, inspectionPointId, date, status, [stationId+date]',
      inspectionResults:
        'id, sessionId, elementId, [sessionId+elementId], [stationId+inspectionPointId]',
    })

    // v2: user-placed hotspot positions over the plan photo (survives reseeds).
    this.version(2).stores({
      elementPositions: 'id, stationId',
    })
  }
}

/** Singleton DB instance. Import this everywhere instead of constructing Dexie. */
export const db = new RailDB()
