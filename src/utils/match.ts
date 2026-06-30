import type { InspectionPoint, SchematicElement } from '../types'

/** Whether a schematic element matches an inspection point's selection rule. */
export function matchesPoint(el: SchematicElement, point: InspectionPoint): boolean {
  if (!point.elementTypes.includes(el.elementType)) return false
  if (point.trackClassFilter !== 'all' && el.trackClass !== point.trackClassFilter)
    return false
  return point.requiredTags.every((tag) => el.tags.includes(tag))
}
