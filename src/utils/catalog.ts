import type { InspectionPoint } from '../types'

/** Top-level section titles keyed by the leading code part (before first "."). */
export const SECTION_TITLES: Record<string, string> = {
  '4': 'Iešmai',
  '5': 'Bėgių grandinės',
}

/** Subsection titles keyed by the first two dot-parts (e.g. "4.1"). */
export const SUBSECTION_TITLES: Record<string, string> = {
  '4.1': 'Bendrieji darbai',
  '4.2': 'Ecostar',
  '4.3': 'SPG / SPGB',
  '4.4': 'S700',
  '4.5': 'Verstukai',
  '4.6': 'Iešmai su kontroliniais užraktais',
  '4.7': 'Unistar',
  '5.1': 'Bėgių grandinės',
}

export interface CatalogSubsection {
  code: string
  title: string
  points: InspectionPoint[]
}

export interface CatalogSection {
  code: string
  title: string
  taskCount: number
  subsections: CatalogSubsection[]
}

function sectionCode(baseCode: string): string {
  return baseCode.split('.')[0]
}

function subsectionCode(baseCode: string): string {
  const parts = baseCode.split('.')
  return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : parts[0]
}

function byCodeNumeric(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true })
}

/** Group inspection points into a two-level section → subsection → points tree. */
export function buildCatalogTree(points: InspectionPoint[]): CatalogSection[] {
  const sections = new Map<
    string,
    { code: string; subs: Map<string, CatalogSubsection> }
  >()

  for (const p of points) {
    const secCode = sectionCode(p.baseCode)
    const subCode = subsectionCode(p.baseCode)

    let section = sections.get(secCode)
    if (!section) {
      section = { code: secCode, subs: new Map() }
      sections.set(secCode, section)
    }

    let sub = section.subs.get(subCode)
    if (!sub) {
      sub = {
        code: subCode,
        title: SUBSECTION_TITLES[subCode] ?? subCode,
        points: [],
      }
      section.subs.set(subCode, sub)
    }
    sub.points.push(p)
  }

  return Array.from(sections.values())
    .sort((a, b) => byCodeNumeric(a.code, b.code))
    .map((section) => {
      const subsections = Array.from(section.subs.values())
        .sort((a, b) => byCodeNumeric(a.code, b.code))
        .map((sub) => ({
          ...sub,
          points: [...sub.points].sort((a, b) => byCodeNumeric(a.id, b.id)),
        }))
      const taskCount = subsections.reduce((n, s) => n + s.points.length, 0)
      return {
        code: section.code,
        title: SECTION_TITLES[section.code] ?? section.code,
        taskCount,
        subsections,
      }
    })
}
