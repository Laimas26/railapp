import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../services/db/schema'
import { getElementsByStation } from '../services/db/queries/elements'
import { getInspectionPoint } from '../services/db/queries/catalog'
import { matchesPoint } from '../utils/match'
import type { SchematicElement } from '../types'

/**
 * Live list of schematic elements matching the inspection point's rule:
 * elementType in point.elementTypes AND track-class filter matches AND all
 * required tags are present. Returns [] while loading or with missing inputs.
 */
export function useHighlightedElements(
  stationId: string | undefined,
  inspectionPointId: string | undefined,
): SchematicElement[] {
  const result = useLiveQuery(async () => {
    if (!stationId || !inspectionPointId) return []
    const point = await getInspectionPoint(db, inspectionPointId)
    if (!point) return []
    const elements = await getElementsByStation(db, stationId)

    return elements.filter((el) => matchesPoint(el, point))
  }, [stationId, inspectionPointId])

  return result ?? []
}
