import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../services/db/schema'
import { getSession } from '../services/db/queries/sessions'
import { getInspectionPoint } from '../services/db/queries/catalog'
import { getResultsForSession } from '../services/db/queries/results'
import type { InspectionPoint, InspectionResult, InspectionSession } from '../types'

interface ActiveSession {
  session: InspectionSession | undefined
  point: InspectionPoint | undefined
  results: InspectionResult[]
  /** true until the first DB read resolves — distinguishes loading from "not found" */
  loading: boolean
}

/** Live session + its inspection point + results for the session. */
export function useActiveSession(sessionId: string | undefined): ActiveSession {
  const data = useLiveQuery(async () => {
    if (!sessionId) return { session: undefined, point: undefined, results: [] }
    const session = await getSession(db, sessionId)
    if (!session) return { session: undefined, point: undefined, results: [] }
    const point = await getInspectionPoint(db, session.inspectionPointId)
    const results = await getResultsForSession(db, sessionId)
    return { session, point, results }
  }, [sessionId])

  if (data === undefined) {
    return { session: undefined, point: undefined, results: [], loading: true }
  }
  return { ...data, loading: false }
}
