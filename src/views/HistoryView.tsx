import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../services/db/schema'
import { listSessions } from '../services/db/queries/sessions'
import { getInspectionPoints } from '../services/db/queries/catalog'
import { getElementsByStation } from '../services/db/queries/elements'
import { matchesPoint } from '../utils/match'
import { Header } from '../components/layout/Header'
import { Badge } from '../components/ui/Badge'
import styles from './HistoryView.module.css'

export function HistoryView() {
  const data = useLiveQuery(async () => {
    const sessions = await listSessions(db)
    const points = await getInspectionPoints(db)
    const pointById = new Map(points.map((p) => [p.id, p]))

    // Fetch each station's elements once, not once per session.
    const elementsByStation = new Map<string, Awaited<ReturnType<typeof getElementsByStation>>>()
    for (const stationId of new Set(sessions.map((s) => s.stationId))) {
      elementsByStation.set(stationId, await getElementsByStation(db, stationId))
    }

    return Promise.all(
      sessions.map(async (s) => {
        const point = pointById.get(s.inspectionPointId)
        const elements = elementsByStation.get(s.stationId) ?? []
        const total = point
          ? elements.filter((el) => matchesPoint(el, point)).length
          : 0
        const done = await db.inspectionResults
          .where('sessionId')
          .equals(s.id)
          .count()
        return { session: s, point, total, done }
      }),
    )
  }, [])

  return (
    <>
      <Header title="Istorija" back />
      <div className={styles.scroll}>
        {data && data.length === 0 && (
          <p className={styles.empty}>Apžiūrų dar nėra.</p>
        )}
        {data?.map(({ session, point, total, done }) => (
          <Link
            key={session.id}
            to={`/history/${session.id}`}
            className={styles.card}
          >
            <div className={styles.top}>
              <span className={styles.code}>{point?.id ?? '—'}</span>
              <Badge tone={session.status === 'completed' ? 'pass' : 'neutral'}>
                {session.status === 'completed' ? 'Baigta' : 'Vykdoma'}
              </Badge>
            </div>
            <div className={styles.row}>
              <span className={styles.date}>{session.date}</span>
              <span className={styles.count}>
                {done}/{total}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
