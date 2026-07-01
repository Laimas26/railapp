import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../services/db/schema'
import { getInspectionPoints, getDefaultStation } from '../services/db/queries/catalog'
import {
  createOrResumeSession,
  getInProgressSessions,
} from '../services/db/queries/sessions'
import { localDateKey } from '../utils/date'
import { Header } from '../components/layout/Header'
import type { InspectionPoint } from '../types'
import styles from './HomeView.module.css'

function groupByBaseCode(points: InspectionPoint[]): [string, InspectionPoint[]][] {
  const map = new Map<string, InspectionPoint[]>()
  for (const p of points) {
    const arr = map.get(p.baseCode) ?? []
    arr.push(p)
    map.set(p.baseCode, arr)
  }
  return Array.from(map.entries()).sort((a, b) =>
    a[0].localeCompare(b[0], undefined, { numeric: true }),
  )
}

export function HomeView() {
  const navigate = useNavigate()
  const today = localDateKey()
  const [starting, setStarting] = useState(false)

  const station = useLiveQuery(() => getDefaultStation(db), [])
  const points = useLiveQuery(() => getInspectionPoints(db), [])
  const inProgress = useLiveQuery(() => getInProgressSessions(db, today), [today])

  const groups = points ? groupByBaseCode(points) : []
  const pointById = new Map((points ?? []).map((p) => [p.id, p]))

  const startTask = async (pointId: string) => {
    if (!station || starting) return
    setStarting(true)
    try {
      const session = await createOrResumeSession(db, {
        stationId: station.id,
        inspectionPointId: pointId,
        date: today,
      })
      navigate(`/session/${session.id}`)
    } finally {
      setStarting(false)
    }
  }

  return (
    <>
      <Header
        title={station?.name ?? 'LTG Tikrinimai'}
        right={
          <Link to="/history" className={styles.histLink}>
            Istorija
          </Link>
        }
      />

      <div className={styles.scroll}>
        {inProgress && inProgress.length > 0 && (
          <section className={styles.resume}>
            <h2 className={styles.resumeTitle}>Tęsti pradėtas apžiūras</h2>
            {inProgress.map((s) => {
              const p = pointById.get(s.inspectionPointId)
              return (
                <Link
                  key={s.id}
                  to={`/session/${s.id}`}
                  className={styles.resumeRow}
                >
                  <span className={styles.code}>{p?.id ?? '—'}</span>
                  <span className={styles.resumeDesc}>
                    {p?.description ?? 'Apžiūra'}
                  </span>
                </Link>
              )
            })}
          </section>
        )}

        <h2 className={styles.sectionTitle}>Pasirinkite užduotį</h2>
        {groups.map(([baseCode, variants]) => (
          <div key={baseCode} className={styles.group}>
            {variants.map((p) => (
              <button
                key={p.id}
                className={styles.taskRow}
                onClick={() => startTask(p.id)}
                disabled={starting}
              >
                <span className={styles.code}>{p.id}</span>
                <span className={styles.taskText}>
                  <span className={styles.taskDesc}>{p.description}</span>
                  <span className={styles.periodicity}>{p.periodicity}</span>
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}
