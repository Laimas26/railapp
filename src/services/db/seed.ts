import type { RailDB } from './schema'
import type {
  Station,
  SchematicElement,
  InspectionPoint,
} from '../../types'

// ---------------------------------------------------------------------------
// Seed data — Rimkų g. st. (Rimkai station).
//
// Source: official plan SIII-S008-00-DP-GRS-RIM-BR-01 (LTG Infra, 2024-09),
// "Dvibėgis planas". Switch numbers and point-machine designations (M1..M33)
// were read from the plan photos.
//
// NOTE: the trackClass (main vs other) below is a BEST-GUESS pending the
// user's confirmation, and the SVG geometry is SIMPLIFIED (not the true
// track layout). Both are data-only and can be corrected without code
// changes. The accurate traced schematic drops into
// src/assets/schematics/rimkai.svg and the switch list is edited here.
// ---------------------------------------------------------------------------

const STATION_ID = 'rimkai'

const station: Station = {
  id: STATION_ID,
  name: 'Rimkų g. st.',
  schematicFile: 'rimkai',
}

/** [switchNumber, machine, trackClass] — 14 powered switches (iešmai). */
const SWITCHES: Array<[string, string, 'main' | 'other']> = [
  ['1', 'M1', 'main'],
  ['3', 'M3', 'main'],
  ['5', 'M5', 'main'],
  ['7', 'M7', 'main'],
  ['9', 'M9', 'other'],
  ['11', 'M11', 'other'],
  ['13', 'M13', 'other'],
  ['21', 'M21', 'other'],
  ['23', 'M23', 'other'],
  ['25', 'M25', 'main'],
  ['27', 'M27', 'main'],
  ['29', 'M29', 'other'],
  ['31', 'M31', 'other'],
  ['33', 'M33', 'other'],
]

const elements: SchematicElement[] = SWITCHES.map(([num, machine, trackClass]) => ({
  id: `sw-${num}`,
  stationId: STATION_ID,
  elementNumber: num,
  elementType: 'switch',
  trackClass,
  svgElementId: `sw-${num}`,
  label: `Iešmas Nr. ${num}`,
  machine,
  tags: [],
}))

const inspectionPoints: InspectionPoint[] = [
  {
    id: '4.1.2a',
    baseCode: '4.1.2',
    variant: 'a',
    description:
      'Iešmų išorinės būklės ir smailių prigludimo prie reminio bėgio įdėjus ' +
      '4 mm ir 2 mm storio tarpmačius; smailių prigludimo prie reminio bėgio ' +
      'tikrinimas ties galutinės padėties tikrintuvu įdėjus 6 mm ir 2 mm ' +
      'tarpmačius. Pagrindiniuose ir nestabdomojo traukinių pravažiavimo keliuose.',
    elementTypes: ['switch'],
    trackClassFilter: 'main',
    requiredTags: [],
    requiresMeasurements: false,
    measurementDefs: [],
  },
  {
    id: '4.1.2b',
    baseCode: '4.1.2',
    variant: 'b',
    description:
      'Iešmų išorinės būklės ir smailių prigludimo prie reminio bėgio įdėjus ' +
      '4 mm ir 2 mm storio tarpmačius; smailių prigludimo prie reminio bėgio ' +
      'tikrinimas ties galutinės padėties tikrintuvu įdėjus 6 mm ir 2 mm ' +
      'tarpmačius. Kituose keliuose.',
    elementTypes: ['switch'],
    trackClassFilter: 'other',
    requiredTags: [],
    requiresMeasurements: false,
    measurementDefs: [],
  },
  {
    id: '5.2.1',
    baseCode: '5.2.1',
    variant: null,
    description:
      'Iešmo pavaros elektros variklio darbinės srovės matavimas perjungiant ' +
      'iešmą iš vienos padėties į kitą.',
    elementTypes: ['switch'],
    trackClassFilter: 'all',
    requiredTags: [],
    requiresMeasurements: true,
    measurementDefs: [
      {
        key: 'srove',
        label: 'Variklio darbinė srovė',
        unit: 'A',
        dataType: 'number',
        min: 1.5,
        max: 3.5,
        required: true,
      },
    ],
  },
  {
    id: '6.1.1',
    baseCode: '6.1.1',
    variant: null,
    description:
      'Bėgių grandinės maitinimo galo įtampos matavimas ties iešmu.',
    elementTypes: ['switch'],
    trackClassFilter: 'all',
    requiredTags: [],
    requiresMeasurements: true,
    measurementDefs: [
      {
        key: 'itampa',
        label: 'Bėgių grandinės įtampa',
        unit: 'V',
        dataType: 'number',
        min: 0.3,
        max: 0.9,
        required: true,
      },
    ],
  },
]

/**
 * Populate the database on first run (idempotent — only seeds when the
 * stations table is empty). Catalog/station/element data is reference data;
 * user-entered sessions and results are never touched here.
 */
export async function seedDatabase(database: RailDB): Promise<void> {
  const stationCount = await database.stations.count()
  if (stationCount > 0) return

  await database.transaction(
    'rw',
    database.stations,
    database.schematicElements,
    database.inspectionPoints,
    async () => {
      await database.stations.bulkAdd([station])
      await database.schematicElements.bulkAdd(elements)
      await database.inspectionPoints.bulkAdd(inspectionPoints)
    },
  )
}
