// Shared domain types for the LTG railway inspection app.
// Data model designed in the architecture plan; storage lives in services/db.

/** A physical railway station. MVP ships exactly one (Rimkai). */
export interface Station {
  /** slug-style primary key, e.g. "rimkai" */
  id: string
  /** display name, e.g. "Rimkų g. st." */
  name: string
  /** key into the schematic asset map (see SchematicCanvas), e.g. "rimkai" */
  schematicFile: string
}

// 'switch' = iešmas (turnout, §4 tasks); 'track-circuit' = bėgių grandinė
// (track section, §5 tasks). 'signal'/'track' reserved for future sections.
export type ElementType = 'switch' | 'track-circuit' | 'signal' | 'track'

/** main = pagrindiniai / nestabdomojo pravažiavimo keliai; other = kiti keliai. */
export type TrackClass = 'main' | 'other'

/** Point-machine drive type — drives §4.2/§4.3/§4.4/§4.7 task filtering. */
export type DriveType = 'ecostar' | 'spg' | 's700' | 'unistar' | 'sp6' | 'other'

/** A clickable element drawn on the schematic — primarily switches (iešmai). */
export interface SchematicElement {
  /** application primary key, e.g. "sw-1" */
  id: string
  stationId: string
  /** the number shown on the diagram, e.g. "1", "11" */
  elementNumber: string
  elementType: ElementType
  /** drives the 4.1.2a (main) vs 4.1.2b (other) split */
  trackClass: TrackClass
  /** value of the data-element-id attribute on the SVG group */
  svgElementId: string
  /** short Lithuanian label for the detail panel, e.g. "Iešmas Nr. 6" or "Bėgių grandinė 8-12" */
  label: string
  /** switches: point-machine designation, e.g. "M2" */
  machine?: string
  /** switches: drive type (for §4.2/§4.3/§4.4/§4.7 filtering); defaults handled in seed */
  driveType?: DriveType
  /** track circuits: end labels — relay end ("+") and power-supply end ("●") */
  relayEnd?: string
  feedEnd?: string
  /** arbitrary tags for future filter rules */
  tags: string[]
}

export type MeasurementDataType = 'number' | 'boolean'

/** Definition of a single measurement field required by an inspection point. */
export interface MeasurementDef {
  /** field key, stable, e.g. "srove" */
  key: string
  /** Lithuanian label, e.g. "Variklio darbinė srovė" */
  label: string
  /** unit shown next to the input, e.g. "A", "V", "Ω", "" */
  unit: string
  dataType: MeasurementDataType
  /** lower tolerance bound for display/warn (not a hard error in MVP) */
  min: number | null
  max: number | null
  required: boolean
}

/** "all" means the point applies regardless of track class. */
export type TrackClassFilter = TrackClass | 'all'

/** A catalog inspection point, e.g. "4.1.2a". */
export interface InspectionPoint {
  /** display code & primary key, e.g. "4.1.2a" */
  id: string
  /** groups variants in the picker, e.g. "4.1.2" */
  baseCode: string
  /** "a" | "b" | null */
  variant: string | null
  /** full Lithuanian description */
  description: string
  /** which element types this task covers, e.g. ["switch"] or ["track-circuit"] */
  elementTypes: ElementType[]
  trackClassFilter: TrackClassFilter
  /** restrict to switches of this drive type; 'all' or omitted = no drive filter */
  driveTypeFilter?: DriveType | 'all'
  /** all tags an element must carry to match; empty = no tag filter */
  requiredTags: string[]
  /** human-readable periodicity from the regulation, e.g. "Kartą per dvi savaites" */
  periodicity: string
  requiresMeasurements: boolean
  measurementDefs: MeasurementDef[]
}

export type SessionStatus = 'in-progress' | 'completed'

/** One run of "the user is doing task X at station Y on date Z". */
export interface InspectionSession {
  /** crypto.randomUUID() */
  id: string
  stationId: string
  inspectionPointId: string
  /** ISO date "YYYY-MM-DD" */
  date: string
  startedAt: number
  completedAt: number | null
  status: SessionStatus
}

/**
 * On-device placement of a schematic element's hotspot over the plan photo.
 * USER data: persists across catalog reseeds (seed.ts never clears this table).
 */
export interface ElementPosition {
  /** = SchematicElement.id (and svgElementId), primary key */
  id: string
  stationId: string
  /** 0..1 of image width */
  xPct: number
  /** 0..1 of image height */
  yPct: number
}

export type ResultValue = 'pass' | 'fail'

export interface Measurement {
  key: string
  value: number | boolean | null
}

/** One element inspected within a session. */
export interface InspectionResult {
  /** crypto.randomUUID() */
  id: string
  sessionId: string
  elementId: string
  /** denormalized for history queries */
  inspectionPointId: string
  stationId: string
  inspectedAt: number
  result: ResultValue
  notes: string
  measurements: Measurement[]
}
