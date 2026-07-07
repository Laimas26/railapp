import type { RailDB } from './schema'
import type {
  Station,
  SchematicElement,
  InspectionPoint,
  MeasurementDef,
  TrackClass,
  TrackClassFilter,
  DriveType,
  ElementType,
  ElementPosition,
} from '../../types'

// ---------------------------------------------------------------------------
// Seed data — Rimkų g. st. (Rimkai station).
//
// Catalog: official LTG regulation "Signalizacijos sistemų ir įrenginių
// periodinės techninės priežiūros darbai" — sections 4 (Iešmai) and 5 (Bėgių
// grandinės / kelio laisvumas). Source plan: SIII-S008-00-DP-GRS-RIM-BR-01.
//
// TWO element types are inspected on the schematic:
//   - 'switch'        (iešmas)        → section 4 tasks
//   - 'track-circuit' (bėgių grandinė) → section 5 tasks; each has a relay end
//     ("+") and a power-supply end ("●").
//
// CAVEATS (data-only, correctable without code):
//   * trackClass (main vs other) per switch was CONFIRMED 2026-07-07 against the
//     station diagram (main = on the two bold through-lines); drives the §4 a/b split.
//   * 33 switches are the authoritative list from the real station track plan;
//     switch numbers keep their "K" suffix. machine ↔ switch mapping is NOT yet
//     confirmed (machine = null for all).
//   * The track-circuit list is PARTIAL — read from the plan photos; more
//     close-up photos are needed to complete it.
//   * driveType is 'sp6' for every switch pending per-switch confirmation.
//   * SVG geometry reads as a realistic through-station ladder, but switch /
//     track-circuit positions are approximate, not surveyed.
// ---------------------------------------------------------------------------

const STATION_ID = 'rimkai'

const station: Station = {
  id: STATION_ID,
  name: 'Rimkų g. st.',
  schematicFile: 'rimkai',
}

// --- Switches (iešmai) -----------------------------------------------------
// [number, machine | null, trackClass]   driveType is 'sp6' for every switch.
// 33 switches read from the real Rimkų g. st. track plan. Switch numbers keep
// the "K" suffix exactly as drawn (e.g. "6K", "16"). machine ↔ switch mapping
// is NOT yet confirmed, so machine is null for all.
//
// trackClass (main vs other) drives the §4 a/b split (4.1.1a = main tracks).
// CONFIRMED 2026-07-07 by the user against the station diagram: "main" = every
// switch lying on the two BOLD lines through the middle (the two pagrindiniai
// keliai IK/IIK). Everything on the yard ladder, sidings and ramps = "other".
// Read off the placed markers in the app diagram (screenshots for claude/
// for claude.jpg) — see docs/STATUS.md.
const SWITCHES: Array<[string, string | null, TrackClass]> = [
  // MAIN-track switches — on the two bold through-lines (pagrindiniai keliai)
  ['1K', null, 'main'],
  ['2K', null, 'main'],
  ['3K', null, 'main'],
  ['4', null, 'main'],
  ['5K', null, 'main'],
  ['6K', null, 'main'],
  ['7K', null, 'main'],
  ['8K', null, 'main'],
  ['10K', null, 'main'],
  ['11K', null, 'main'],
  ['12K', null, 'main'],
  ['13K', null, 'main'],
  ['14K', null, 'main'],
  ['15K', null, 'main'],
  ['19', null, 'main'],
  ['20K', null, 'main'],
  ['23K', null, 'main'],
  ['27K', null, 'main'],
  ['35', null, 'main'],
  // OTHER-track switches — yard ladder, sidings, ramps (kiti keliai)
  ['9', null, 'other'],
  ['16', null, 'other'],
  ['17', null, 'other'],
  ['18', null, 'other'],
  ['21', null, 'other'],
  ['22', null, 'other'],
  ['24', null, 'other'],
  ['25', null, 'other'],
  ['26', null, 'other'],
  ['29', null, 'other'],
  ['37', null, 'other'],
  ['39', null, 'other'],
  ['43', null, 'other'],
  ['45', null, 'other'],
]

const switchElements: SchematicElement[] = SWITCHES.map(([num, machine, trackClass]) => ({
  id: `sw-${num}`,
  stationId: STATION_ID,
  elementNumber: num,
  elementType: 'switch',
  trackClass,
  svgElementId: `sw-${num}`,
  label: `Iešmas Nr. ${num}`,
  machine: machine ?? undefined,
  driveType: 'sp6' as DriveType,
  tags: [],
}))

// --- Track circuits (bėgių grandinės) --------------------------------------
// [name, relayEnd, feedEnd]   (relay = "+", feed = "●").
// This circuit list is PARTIAL — read from the available plan photos. More
// close-up photos are needed to complete the station's track-circuit map.
// relay/feed end markers are generic (+ / ●) until per-circuit ends confirmed.
const TRACK_CIRCUITS: Array<[string, string, string]> = [
  ['ČPP', '+', '●'],
  ['ČGP', '+', '●'],
  ['1AK', '+', '●'],
  ['8-12', '+', '●'],
  ['14-20', '+', '●'],
  ['11-15', '+', '●'],
  ['9-45', '+', '●'],
  ['1-3', '+', '●'],
  ['23-25A', '+', '●'],
  ['23-25B', '+', '●'],
  ['27-29B', '+', '●'],
  ['27-29C', '+', '●'],
  ['35-39A', '+', '●'],
  ['35-39B', '+', '●'],
  ['24-26', '+', '●'],
  ['20-24R', '+', '●'],
  ['1GP', '+', '●'],
  ['2GP', '+', '●'],
]

const trackCircuitElements: SchematicElement[] = TRACK_CIRCUITS.map(
  ([name, relayEnd, feedEnd]) => ({
    id: `tc-${name}`,
    stationId: STATION_ID,
    elementNumber: name,
    elementType: 'track-circuit',
    // §5 tasks (5.1.1 stoties, 5.1.4) apply to all station track circuits.
    trackClass: 'main',
    svgElementId: `tc-${name}`,
    label: `Bėgių grandinė ${name}`,
    relayEnd,
    feedEnd,
    tags: [],
  }),
)

const elements: SchematicElement[] = [...switchElements, ...trackCircuitElements]

// --- Inspection catalog ----------------------------------------------------

const A = (key: string, label: string, unit: string): MeasurementDef => ({
  key,
  label,
  unit,
  dataType: 'number',
  min: null,
  max: null,
  required: true,
})

interface SeedPoint {
  id: string
  baseCode: string
  variant: string | null
  description: string
  elementTypes: ElementType[]
  trackClassFilter: TrackClassFilter
  driveTypeFilter?: DriveType | 'all'
  periodicity: string
  measurements?: MeasurementDef[]
}

const SW: ElementType[] = ['switch']
const TC: ElementType[] = ['track-circuit']

// Shared §4.1 parent descriptions
const D_411 =
  'Elektros pavarų, galutinės padėties tikrintuvų ir jų garnitūrų išorinės būklės ' +
  'tikrinimas; iešmų smailės prigludimo prie reminio bėgio tikrinimas laužtuvėliu'
const D_412 =
  'Iešmų išorinės būklės ir smailių prigludimo prie reminio bėgio įdėjus 4 mm ir ' +
  '2 mm storio tarpmačius; smailių prigludimo prie reminio bėgio tikrinimas ties ' +
  'galutinės padėties tikrintuvu įdėjus 6 mm ir 2 mm storio tarpmačius'
const D_416 =
  'Nuolatinės įtampos elektros variklių srovės matavimas normaliu ir sankabos ' +
  'trinties / buksavimo režimais bei kolektorių tikrinimas'
const D_418 = 'Elektros variklio įtampos matavimas'
const D_461 =
  'Iešmo ir iešmo kontrolinio užrakto tikrinimas, įdėjus tarp iešmo smailės ir ' +
  'reminio bėgio 4 mm storio tarpmatį; užrakinto iešmo prigludimo prie reminio ' +
  'bėgio tikrinimas; užrakto ir garnitūros išorinės būklės tikrinimas'

const SEED_POINTS: SeedPoint[] = [
  // ===== §4.1 Centralizuoti iešmai. Bendrieji darbai =====
  { id: '4.1.1a', baseCode: '4.1.1', variant: 'a', description: `${D_411}. Pagrindiniuose ir nestabdomojo traukinių pravažiavimo keliuose.`, elementTypes: SW, trackClassFilter: 'main', periodicity: 'Kartą per savaitę' },
  { id: '4.1.1b', baseCode: '4.1.1', variant: 'b', description: `${D_411}. Kituose keliuose.`, elementTypes: SW, trackClassFilter: 'other', periodicity: 'Kartą per dvi savaites' },
  { id: '4.1.1d', baseCode: '4.1.1', variant: 'd', description: `${D_411}. Unistar tipo pavarų.`, elementTypes: SW, trackClassFilter: 'all', driveTypeFilter: 'unistar', periodicity: 'Kartą per dvi savaites' },

  { id: '4.1.2a', baseCode: '4.1.2', variant: 'a', description: `${D_412}. Pagrindiniuose ir nestabdomojo traukinių pravažiavimo keliuose.`, elementTypes: SW, trackClassFilter: 'main', periodicity: 'Kartą per dvi savaites' },
  { id: '4.1.2b', baseCode: '4.1.2', variant: 'b', description: `${D_412}. Kituose keliuose.`, elementTypes: SW, trackClassFilter: 'other', periodicity: 'Kartą per keturias savaites' },

  { id: '4.1.3', baseCode: '4.1.3', variant: null, description: 'Išorinis elektros pavarų, galutinės padėties tikrintuvų ir jų garnitūrų valymas.', elementTypes: SW, trackClassFilter: 'all', periodicity: 'Du kartus per metus' },
  { id: '4.1.5', baseCode: '4.1.5', variant: null, description: 'Keldėžių ir UPM movų vidinės būklės, reverso relių ir kitų įtaisų tikrinimas.', elementTypes: SW, trackClassFilter: 'all', periodicity: 'Du kartus per metus' },

  { id: '4.1.6a', baseCode: '4.1.6', variant: 'a', description: `${D_416}. Pagrindiniuose ir nestabdomojo traukinių pravažiavimo keliuose.`, elementTypes: SW, trackClassFilter: 'main', periodicity: 'Keturis kartus per metus', measurements: [A('srove', 'Variklio darbinė srovė', 'A')] },
  { id: '4.1.6b', baseCode: '4.1.6', variant: 'b', description: `${D_416}. Kituose keliuose.`, elementTypes: SW, trackClassFilter: 'other', periodicity: 'Du kartus per metus', measurements: [A('srove', 'Variklio darbinė srovė', 'A')] },

  { id: '4.1.7', baseCode: '4.1.7', variant: null, description: 'Trifazės elektros įtampos variklio srovės matavimas sankabos trinties / buksavimo režimu.', elementTypes: SW, trackClassFilter: 'all', periodicity: 'Kartą per metus', measurements: [A('srove', 'Variklio srovė', 'A')] },

  { id: '4.1.8a', baseCode: '4.1.8', variant: 'a', description: `${D_418}. Pagrindiniuose ir nestabdomojo traukinių pravažiavimo keliuose.`, elementTypes: SW, trackClassFilter: 'main', periodicity: 'Kartą per metus', measurements: [A('itampa', 'Variklio įtampa', 'V')] },
  { id: '4.1.8b', baseCode: '4.1.8', variant: 'b', description: `${D_418}. Kituose keliuose.`, elementTypes: SW, trackClassFilter: 'other', periodicity: 'Kartą per du metus', measurements: [A('itampa', 'Variklio įtampa', 'V')] },

  { id: '4.1.9', baseCode: '4.1.9', variant: null, description: 'Sniego nuo iešmų pneumatinio valymo įrenginių schemos veikimo tikrinimas.', elementTypes: SW, trackClassFilter: 'all', periodicity: 'Kartą per metus' },
  { id: '4.1.10', baseCode: '4.1.10', variant: null, description: 'Vietinio valdymo kontakto būklės ir veikimo tikrinimas.', elementTypes: SW, trackClassFilter: 'all', periodicity: 'Kartą per metus' },

  // ===== §4.2 Ecostar =====
  { id: '4.2.2', baseCode: '4.2.2', variant: null, description: 'Pavaros hidraulinės sistemos slėgio matavimas.', elementTypes: SW, trackClassFilter: 'all', driveTypeFilter: 'ecostar', periodicity: 'Du kartus per metus', measurements: [A('slegis', 'Hidraulinės sistemos slėgis', 'bar')] },
  { id: '4.2.3', baseCode: '4.2.3', variant: null, description: 'Pavaros rankinio pervedimo mechanizmo tikrinimas.', elementTypes: SW, trackClassFilter: 'all', driveTypeFilter: 'ecostar', periodicity: 'Kartą per metus' },
  { id: '4.2.4', baseCode: '4.2.4', variant: null, description: 'Pagalbinės iešmo pervedimo sistemos HIDROLINK tvirtinimo mazgų išorinės būklės tikrinimas.', elementTypes: SW, trackClassFilter: 'all', driveTypeFilter: 'ecostar', periodicity: 'Du kartus per metus' },
  { id: '4.2.5', baseCode: '4.2.5', variant: null, description: 'Pagalbinės iešmo pervedimo sistemos HIDROLINK hidraulinių cilindrų, vožtuvų bloko ir hidraulinio bakelio išorinės būklės, slėgio priklausomumo nuo aplinkos sąlygų tikrinimas.', elementTypes: SW, trackClassFilter: 'all', driveTypeFilter: 'ecostar', periodicity: 'Du kartus per metus' },

  // ===== §4.3 SPG / SPGB =====
  { id: '4.3.1a', baseCode: '4.3.1', variant: 'a', description: 'Pavarų jutiklių maitinimo ir išėjimo įtampų (iešmo kabelio movų gnybtuose) matavimas. Vidurinėje padėtyje.', elementTypes: SW, trackClassFilter: 'all', driveTypeFilter: 'spg', periodicity: 'Du kartus per metus', measurements: [A('itampa_mait', 'Maitinimo įtampa', 'V'), A('itampa_isej', 'Išėjimo įtampa', 'V')] },
  { id: '4.3.1b', baseCode: '4.3.1', variant: 'b', description: 'Pavarų jutiklių maitinimo ir išėjimo įtampų (iešmo kabelio movų gnybtuose) matavimas. Kitose padėtyse.', elementTypes: SW, trackClassFilter: 'all', driveTypeFilter: 'spg', periodicity: 'Kartą per keturias savaites', measurements: [A('itampa_mait', 'Maitinimo įtampa', 'V'), A('itampa_isej', 'Išėjimo įtampa', 'V')] },

  // ===== §4.4 S700 =====
  { id: '4.4.1', baseCode: '4.4.1', variant: null, description: 'Pavarų kontaktinių ritinėlių ir kontaktų būklės tikrinimas.', elementTypes: SW, trackClassFilter: 'all', driveTypeFilter: 's700', periodicity: 'Kartą per metus' },
  { id: '4.4.3', baseCode: '4.4.3', variant: null, description: 'Pavarų įžeminimo tvirtinimo elementų tikrinimas.', elementTypes: SW, trackClassFilter: 'all', driveTypeFilter: 's700', periodicity: 'Kartą per metus' },

  // ===== §4.5 Verstukai =====
  { id: '4.5.1', baseCode: '4.5.1', variant: null, description: 'Verstuko išorinės būklės ir tarpo tarp verstuko kaladėlės atraminio paviršiaus ir bėgio galvutės tikrinimas.', elementTypes: SW, trackClassFilter: 'all', periodicity: 'Kartą per keturias savaites' },

  // ===== §4.6 Iešmai su kontroliniais užraktais =====
  { id: '4.6.1a', baseCode: '4.6.1', variant: 'a', description: `${D_461}. Pagrindiniuose ir nestabdomojo traukinių pravažiavimo keliuose.`, elementTypes: SW, trackClassFilter: 'main', periodicity: 'Kartą per dvi savaites' },
  { id: '4.6.1b', baseCode: '4.6.1', variant: 'b', description: `${D_461}. Kituose keliuose.`, elementTypes: SW, trackClassFilter: 'other', periodicity: 'Kartą per keturias savaites' },
  { id: '4.6.2', baseCode: '4.6.2', variant: null, description: 'Kontrolinio užrakto išardymas, valymas, plovimas, susidėvėjusių dalių keitimas, tepimas.', elementTypes: SW, trackClassFilter: 'all', periodicity: 'Kartą per metus' },

  // ===== §4.7 Unistar =====
  { id: '4.7.1', baseCode: '4.7.1', variant: null, description: 'Elektros pavaros įtampos ir srovės matavimas.', elementTypes: SW, trackClassFilter: 'all', driveTypeFilter: 'unistar', periodicity: 'Kartą per metus', measurements: [A('itampa', 'Pavaros įtampa', 'V'), A('srove', 'Pavaros srovė', 'A')] },

  // ===== §5.1 Bėgių grandinės =====
  { id: '5.1.1a', baseCode: '5.1.1', variant: 'a', description: 'Bėgių grandinių ir jų kelio elementų būklės tikrinimas. Stoties.', elementTypes: TC, trackClassFilter: 'all', periodicity: 'Kartą per keturias savaites' },
  { id: '5.1.4', baseCode: '5.1.4', variant: null, description: 'Stoties ir skirstomojo kalnelio bėgių grandinių šunto jautrio (užimtumo) tikrinimas.', elementTypes: TC, trackClassFilter: 'all', periodicity: 'Kartą per dvi savaites' },
]

const inspectionPoints: InspectionPoint[] = SEED_POINTS.map((p) => ({
  id: p.id,
  baseCode: p.baseCode,
  variant: p.variant,
  description: p.description,
  elementTypes: p.elementTypes,
  trackClassFilter: p.trackClassFilter,
  driveTypeFilter: p.driveTypeFilter,
  requiredTags: [],
  periodicity: p.periodicity,
  requiresMeasurements: (p.measurements?.length ?? 0) > 0,
  measurementDefs: p.measurements ?? [],
}))

// Bump this whenever station/element/catalog reference data changes so existing
// installs refresh it. Sessions & results are user data and are never cleared.
const SEED_VERSION = 4
const SEED_VERSION_KEY = 'railapp.seedVersion'

/**
 * Populate (or refresh) reference data: station, schematic elements, inspection
 * catalog. Re-seeds when the stations table is empty OR when SEED_VERSION has
 * been bumped since the last seed. Only the three reference tables are touched;
 * inspectionSessions / inspectionResults (user data) are left intact.
 */
export async function seedDatabase(database: RailDB): Promise<void> {
  const stationCount = await database.stations.count()
  const storedVersion = Number(
    (typeof localStorage !== 'undefined' && localStorage.getItem(SEED_VERSION_KEY)) || 0,
  )

  if (stationCount > 0 && storedVersion === SEED_VERSION) return

  await database.transaction(
    'rw',
    database.stations,
    database.schematicElements,
    database.inspectionPoints,
    async () => {
      await database.stations.clear()
      await database.schematicElements.clear()
      await database.inspectionPoints.clear()
      await database.stations.bulkAdd([station])
      await database.schematicElements.bulkAdd(elements)
      await database.inspectionPoints.bulkAdd(inspectionPoints)
    },
  )

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION))
  }
}

// --- Default marker positions ----------------------------------------------
// The user's confirmed on-diagram placement of all 33 switches (xPct/yPct are
// 0..1 fractions of the diagram viewBox). Baked in so every device — and any
// reinstall after iOS evicts IndexedDB — shows the markers without re-placing
// them. Track circuits (tc-*) are not placed yet. Captured 2026-07-07 by
// exporting the laptop's positions ("Kopijuoti vietas").
//
// Bump POS_SEED_VERSION to push an updated default placement to all installs.
// NOTE: reseeding bulkPut-s these ids (a keyed upsert — replaces the row for
// each id; ids NOT in this list are left untouched, never deleted). So a version
// bump overwrites any manual tweak the user made to a default switch on a device
// (intended: the baked set is canonical). If ElementPosition ever gains extra
// per-row fields, revisit — bulkPut would overwrite them for these ids.
const DEFAULT_POSITIONS: Array<[string, number, number]> = [
  ['sw-1K', 0.8176, 0.5448], ['sw-2K', 0.0167, 0.5443], ['sw-3K', 0.7925, 0.5405],
  ['sw-4', 0.0429, 0.4475], ['sw-5K', 0.7475, 0.4643], ['sw-6K', 0.1349, 0.5507],
  ['sw-7K', 0.7658, 0.5527], ['sw-8K', 0.1568, 0.4592], ['sw-9', 0.8167, 0.7796],
  ['sw-10K', 0.2009, 0.4562], ['sw-11K', 0.6716, 0.5527], ['sw-12K', 0.2526, 0.463],
  ['sw-13K', 0.609, 0.4674], ['sw-14K', 0.2849, 0.5507], ['sw-15K', 0.6132, 0.5527],
  ['sw-16', 0.2344, 0.3678], ['sw-17', 0.5682, 0.6381], ['sw-18', 0.2712, 0.2763],
  ['sw-19', 0.8075, 0.4582], ['sw-20K', 0.3167, 0.5507], ['sw-21', 0.6633, 0.6381],
  ['sw-22', 0.3083, 0.1582], ['sw-23K', 0.6591, 0.4552], ['sw-24', 0.3728, 0.6381],
  ['sw-25', 0.6157, 0.2649], ['sw-26', 0.3984, 0.726], ['sw-27K', 0.5824, 0.4613],
  ['sw-29', 0.5641, 0.3668], ['sw-35', 0.8737, 0.4625], ['sw-37', 0.883, 0.4113],
  ['sw-39', 0.8904, 0.3698], ['sw-43', 0.8454, 0.8454], ['sw-45', 0.8808, 0.8424],
]

const defaultPositions: ElementPosition[] = DEFAULT_POSITIONS.map(
  ([id, xPct, yPct]) => ({ id, stationId: STATION_ID, xPct, yPct }),
)

const POS_SEED_VERSION = 1
const POS_SEED_VERSION_KEY = 'railapp.posSeedVersion'

/**
 * Seed the user's confirmed default marker positions. Reseeds when the version
 * changed OR when the positions are actually missing for this station — the
 * latter is essential because localStorage and IndexedDB can be evicted
 * independently on iOS: if the version flag survives but IndexedDB was wiped, a
 * version-only guard would skip seeding and leave the diagram permanently empty
 * (the exact case this feature exists to survive). bulkPut is a keyed upsert, so
 * ids not in the default set are left untouched. Call AFTER any elementPositions
 * cleanup in bootstrap so it isn't wiped.
 */
export async function seedDefaultPositions(database: RailDB): Promise<void> {
  const storedVersion = Number(
    (typeof localStorage !== 'undefined' &&
      localStorage.getItem(POS_SEED_VERSION_KEY)) ||
      0,
  )
  const existing = await database.elementPositions
    .where('stationId')
    .equals(STATION_ID)
    .count()
  if (storedVersion === POS_SEED_VERSION && existing > 0) return

  await database.elementPositions.bulkPut(defaultPositions)

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(POS_SEED_VERSION_KEY, String(POS_SEED_VERSION))
  }
}
