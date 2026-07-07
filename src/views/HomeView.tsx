import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../services/db/schema'
import { getInspectionPoints, getDefaultStation } from '../services/db/queries/catalog'
import { getElementsByStation } from '../services/db/queries/elements'
import {
  createOrResumeSession,
  getInProgressSessions,
} from '../services/db/queries/sessions'
import { localDateKey } from '../utils/date'
import { matchesPoint } from '../utils/match'
import { buildCatalogTree } from '../utils/catalog'
import { Header } from '../components/layout/Header'
import styles from './HomeView.module.css'

export function HomeView() {
  const navigate = useNavigate()
  const today = localDateKey()
  const [starting, setStarting] = useState(false)

  const station = useLiveQuery(() => getDefaultStation(db), [])
  const points = useLiveQuery(() => getInspectionPoints(db), [])
  // Raw result stays `undefined` until the (station-dependent) query resolves,
  // so we can tell "not loaded yet" apart from "genuinely 0 matching elements"
  // and avoid flashing every task as "0 elementų" during initial load.
  const elementsRaw = useLiveQuery(
    () => (station ? getElementsByStation(db, station.id) : Promise.resolve([])),
    [station?.id],
  )
  const elementsLoaded = elementsRaw !== undefined
  const inProgress = useLiveQuery(() => getInProgressSessions(db, today), [today])

  const matchCount = useMemo(() => {
    const m = new Map<string, number>()
    const els = elementsRaw ?? []
    for (const p of points ?? [])
      m.set(p.id, els.filter((el) => matchesPoint(el, p)).length)
    return m
  }, [points, elementsRaw])

  const tree = useMemo(() => buildCatalogTree(points ?? []), [points])

  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(['4', '5']),
  )
  const [openSubs, setOpenSubs] = useState<Set<string>>(() => new Set())

  // On first load, open the first subsection of each section (e.g. 4.1, 5.1) so
  // the common daily tasks are one tap away. Runs once; respects later toggles.
  const didInitSubs = useRef(false)
  useEffect(() => {
    if (didInitSubs.current || tree.length === 0) return
    didInitSubs.current = true
    setOpenSubs(
      new Set(
        tree.map((s) => s.subsections[0]?.code).filter((c): c is string => !!c),
      ),
    )
  }, [tree])

  const toggleSection = (code: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const toggleSub = (code: string) => {
    setOpenSubs((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const pointById = useMemo(
    () => new Map((points ?? []).map((p) => [p.id, p])),
    [points],
  )

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

        {tree.map((section) => {
          const sectionOpen = openSections.has(section.code)
          return (
            <div key={section.code} className={styles.section}>
              <button
                className={styles.sectionHeader}
                onClick={() => toggleSection(section.code)}
                aria-expanded={sectionOpen}
              >
                <span className={styles.chevron}>{sectionOpen ? '▾' : '▸'}</span>
                <span className={styles.sectionLabel}>
                  {section.code}. {section.title}
                </span>
                <span className={styles.countBadge}>{section.taskCount}</span>
              </button>

              {sectionOpen &&
                section.subsections.map((sub) => {
                  const subOpen = openSubs.has(sub.code)
                  return (
                    <div key={sub.code} className={styles.subsection}>
                      <button
                        className={styles.subHeader}
                        onClick={() => toggleSub(sub.code)}
                        aria-expanded={subOpen}
                      >
                        <span className={styles.chevron}>
                          {subOpen ? '▾' : '▸'}
                        </span>
                        <span className={styles.subLabel}>
                          {sub.code} {sub.title}
                        </span>
                      </button>

                      {subOpen && (
                        <div className={styles.group}>
                          {sub.points.map((p) => {
                            const empty =
                              elementsLoaded && matchCount.get(p.id) === 0
                            return (
                              <button
                                key={p.id}
                                className={
                                  empty
                                    ? `${styles.taskRow} ${styles.taskRowEmpty}`
                                    : styles.taskRow
                                }
                                onClick={() => startTask(p.id)}
                                disabled={starting}
                              >
                                <span className={styles.code}>{p.id}</span>
                                <span className={styles.taskText}>
                                  <span className={styles.taskDesc}>
                                    {p.description}
                                  </span>
                                  <span className={styles.periodicity}>
                                    {p.periodicity}
                                    {empty && (
                                      <span className={styles.emptyBadge}>
                                        0 elementų
                                      </span>
                                    )}
                                  </span>
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          )
        })}
      </div>
    </>
  )
}
