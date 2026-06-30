import { useMemo } from 'react'
import type { InspectionResult, SchematicElement } from '../types'

interface Progress {
  total: number
  done: number
}

/** How many of the highlighted elements have a result in this session. */
export function useSessionProgress(
  highlightedElements: SchematicElement[],
  results: InspectionResult[],
): Progress {
  return useMemo(() => {
    const inspected = new Set(results.map((r) => r.elementId))
    const done = highlightedElements.filter((el) => inspected.has(el.id)).length
    return { total: highlightedElements.length, done }
  }, [highlightedElements, results])
}
