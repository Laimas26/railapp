import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useParams } from 'react-router-dom'
import { db } from '../services/db/schema'
import { getSession } from '../services/db/queries/sessions'
import { getInspectionPoint } from '../services/db/queries/catalog'
import { getResultsForSession } from '../services/db/queries/results'
import { getElementsByStation } from '../services/db/queries/elements'
import { formatDateTime } from '../utils/date'
import { Header } from '../components/layout/Header'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import type {
  InspectionPoint,
  InspectionResult,
  Measurement,
  SchematicElement,
} from '../types'
import styles from './SessionDetailView.module.css'

function measurementText(
  m: Measurement,
  point: InspectionPoint | undefined,
): string {
  const def = point?.measurementDefs.find((d) => d.key === m.key)
  const label = def?.label ?? m.key
  if (m.value === null || m.value === undefined) return `${label}: —`
  if (typeof m.value === 'boolean') return `${label}: ${m.value ? 'taip' : 'ne'}`
  return `${label}: ${m.value} ${def?.unit ?? ''}`.trim()
}

function buildSummary(
  date: string,
  point: InspectionPoint | undefined,
  results: InspectionResult[],
  elementById: Map<string, SchematicElement>,
): string {
  const lines: string[] = []
  lines.push(`Apžiūra: ${point?.id ?? ''} ${point?.description ?? ''}`.trim())
  lines.push(`Data: ${date}`)
  lines.push('')
  for (const r of results) {
    const el = elementById.get(r.elementId)
    const num = el ? `Iešmas Nr. ${el.elementNumber}` : r.elementId
    const verdict = r.result === 'pass' ? 'Tinkama' : 'Netinkama'
    let line = `${num}: ${verdict}`
    if (r.measurements.length > 0) {
      line += ` (${r.measurements.map((m) => measurementText(m, point)).join('; ')})`
    }
    if (r.notes) line += ` — ${r.notes}`
    lines.push(line)
  }
  return lines.join('\n')
}

export function SessionDetailView() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'err'>('idle')

  const data = useLiveQuery(async () => {
    if (!sessionId) return undefined
    const session = await getSession(db, sessionId)
    if (!session) return { session: undefined }
    const point = await getInspectionPoint(db, session.inspectionPointId)
    const results = await getResultsForSession(db, sessionId)
    const elements = await getElementsByStation(db, session.stationId)
    const elementById = new Map(elements.map((e) => [e.id, e]))
    results.sort((a, b) => {
      const na = Number(elementById.get(a.elementId)?.elementNumber ?? 0)
      const nb = Number(elementById.get(b.elementId)?.elementNumber ?? 0)
      return na - nb
    })
    return { session, point, results, elementById }
  }, [sessionId])

  if (!data || !data.session) {
    return (
      <>
        <Header title="Apžiūra" back />
        <div className={styles.empty}>
          {data ? 'Sesija nerasta.' : 'Kraunama…'}
        </div>
      </>
    )
  }

  const { session, point, results = [], elementById = new Map() } = data

  const copy = async () => {
    const text = buildSummary(session.date, point, results, elementById)
    try {
      if (!navigator.clipboard) throw new Error('no clipboard')
      await navigator.clipboard.writeText(text)
      setCopyState('ok')
    } catch {
      setCopyState('err')
    }
    setTimeout(() => setCopyState('idle'), 2500)
  }

  return (
    <>
      <Header
        title={point?.id ?? 'Apžiūra'}
        back
        right={
          <Button variant="ghost" onClick={copy}>
            {copyState === 'ok'
              ? 'Nukopijuota'
              : copyState === 'err'
                ? 'Klaida'
                : 'Kopijuoti'}
          </Button>
        }
      />
      <div className={styles.scroll}>
        <div className={styles.head}>
          <p className={styles.desc}>{point?.description}</p>
          <p className={styles.sub}>
            {session.date} · pradėta {formatDateTime(session.startedAt)}
          </p>
        </div>

        {results.length === 0 && (
          <p className={styles.empty}>Įrašų nėra.</p>
        )}

        {results.map((r) => {
          const el = elementById.get(r.elementId)
          return (
            <div key={r.id} className={styles.card}>
              <div className={styles.top}>
                <span className={styles.num}>
                  Iešmas Nr. {el?.elementNumber ?? '—'}
                  {el?.machine && <span className={styles.machine}> · {el.machine}</span>}
                </span>
                <Badge tone={r.result === 'pass' ? 'pass' : 'fail'}>
                  {r.result === 'pass' ? 'Tinkama' : 'Netinkama'}
                </Badge>
              </div>
              {r.measurements.length > 0 && (
                <ul className={styles.measList}>
                  {r.measurements.map((m) => (
                    <li key={m.key}>{measurementText(m, point)}</li>
                  ))}
                </ul>
              )}
              {r.notes && <p className={styles.notes}>{r.notes}</p>}
            </div>
          )
        })}
      </div>
    </>
  )
}
