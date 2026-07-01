import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../services/db/schema'
import { completeSession } from '../services/db/queries/sessions'
import { getElementsByStation } from '../services/db/queries/elements'
import {
  getPositions,
  setPosition,
  deletePosition,
} from '../services/db/queries/positions'
import { useActiveSession } from '../hooks/useActiveSession'
import { useHighlightedElements } from '../hooks/useHighlightedElements'
import { useSessionProgress } from '../hooks/useSessionProgress'
import { useUiStore } from '../store/uiStore'
import { Header } from '../components/layout/Header'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Button } from '../components/ui/Button'
import { PhotoSchematic } from '../components/schematic/PhotoSchematic'
import { ElementDetailModal } from '../components/inspection/ElementDetailModal'
import type { ElementPosition, SchematicElement } from '../types'
import styles from './SchematicView.module.css'

export function SchematicView() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const setSelected = useUiStore((s) => s.setSelected)
  const selectedSvgElementId = useUiStore((s) => s.selectedSvgElementId)

  const { session, point, results, loading } = useActiveSession(sessionId)
  const highlighted = useHighlightedElements(session?.stationId, point?.id)
  const progress = useSessionProgress(highlighted, results)

  const stationId = session?.stationId

  const allElements =
    useLiveQuery(
      () => (stationId ? getElementsByStation(db, stationId) : []),
      [stationId],
    ) ?? []

  const positionList =
    useLiveQuery(
      () => (stationId ? getPositions(db, stationId) : []),
      [stationId],
    ) ?? []

  const [descOpen, setDescOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [placingId, setPlacingId] = useState<string | null>(null)

  const positions = useMemo(
    () => new Map(positionList.map((p) => [p.id, p])),
    [positionList],
  )

  const highlightedIds = useMemo(
    () => new Set(highlighted.map((el) => el.id)),
    [highlighted],
  )

  // element id -> 'pass' | 'fail'
  const resultsByElement = useMemo(() => {
    const highlightedSet = new Set(highlighted.map((el) => el.id))
    const map = new Map<string, 'pass' | 'fail'>()
    for (const r of results) {
      if (highlightedSet.has(r.elementId)) map.set(r.elementId, r.result)
    }
    return map
  }, [results, highlighted])

  // All station elements ordered switches-first then track circuits (by number).
  const pickerElements = useMemo(() => {
    const byNumber = (a: SchematicElement, b: SchematicElement) =>
      a.elementNumber.localeCompare(b.elementNumber, undefined, {
        numeric: true,
      })
    const switches = allElements
      .filter((el) => el.elementType === 'switch')
      .sort(byNumber)
    const tracks = allElements
      .filter((el) => el.elementType === 'track-circuit')
      .sort(byNumber)
    return [...switches, ...tracks]
  }, [allElements])

  const placedCount = useMemo(
    () => allElements.filter((el) => positions.has(el.id)).length,
    [allElements, positions],
  )

  const unplacedHighlighted = useMemo(
    () => highlighted.filter((el) => !positions.has(el.id)).length,
    [highlighted, positions],
  )

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2000)
    return () => clearTimeout(t)
  }, [toast])

  const onElementTap = (elementId: string) => {
    if (editMode) {
      setPlacingId(elementId)
      return
    }
    if (!highlightedIds.has(elementId)) {
      setToast('Šis elementas nepriklauso šiai užduočiai')
      return
    }
    setSelected(elementId)
  }

  const onPlaceAt = async (xPct: number, yPct: number) => {
    if (!placingId || !stationId) return
    const pos: ElementPosition = { id: placingId, stationId, xPct, yPct }
    await setPosition(db, pos)
    setToast('Vieta išsaugota')
  }

  const clearPlacement = async () => {
    if (!placingId) return
    await deletePosition(db, placingId)
    setToast('Vieta pašalinta')
  }

  const toggleEditMode = () => {
    setEditMode((v) => !v)
    setPlacingId(null)
  }

  const finish = async () => {
    if (!sessionId) return
    await completeSession(db, sessionId)
    navigate('/')
  }

  if (loading) {
    return (
      <>
        <Header title="Apžiūra" back />
        <div className={styles.empty}>Kraunama…</div>
      </>
    )
  }

  if (!session || !point) {
    return (
      <>
        <Header title="Apžiūra" back />
        <div className={styles.empty}>Sesija nerasta.</div>
      </>
    )
  }

  return (
    <>
      <Header
        title={
          <button
            className={styles.codeBtn}
            onClick={() => setDescOpen((v) => !v)}
          >
            {point.id} {descOpen ? '▴' : '▾'}
          </button>
        }
        back
      />

      <div className={styles.meta}>
        <p className={styles.periodicity}>{point.periodicity}</p>
        {descOpen && <p className={styles.desc}>{point.description}</p>}
        {editMode ? (
          <p className={styles.editInfo}>
            Priskirta {placedCount}/{allElements.length}
          </p>
        ) : highlighted.length === 0 ? (
          <p className={styles.noMatch}>
            Šiai užduočiai tinkamų elementų šioje stotyje nėra.
          </p>
        ) : (
          <ProgressBar done={progress.done} total={progress.total} />
        )}
        {!editMode && unplacedHighlighted > 0 && (
          <p className={styles.noMatch}>
            Kai kurie šios užduoties elementai dar nepažymėti plane (
            {unplacedHighlighted}). Paspauskite „Redaguoti vietas“.
          </p>
        )}
      </div>

      {editMode && (
        <div className={styles.picker}>
          {pickerElements.map((el) => (
            <button
              key={el.id}
              className={`${styles.chip} ${
                el.id === placingId ? styles.chipActive : ''
              } ${positions.has(el.id) ? styles.chipPlaced : ''}`}
              onClick={() => setPlacingId(el.id)}
            >
              {positions.has(el.id) ? '✓ ' : ''}
              {el.elementNumber}
            </button>
          ))}
        </div>
      )}

      <PhotoSchematic
        imageKey={session.stationId}
        elements={allElements}
        positions={positions}
        highlightedIds={highlightedIds}
        resultsByElement={resultsByElement}
        activeId={selectedSvgElementId}
        editMode={editMode}
        placingId={placingId}
        onElementTap={onElementTap}
        onPlaceAt={onPlaceAt}
      />

      <div className={styles.footer}>
        {editMode ? (
          <div className={styles.editActions}>
            {placingId && (
              <Button variant="danger" onClick={clearPlacement}>
                Pašalinti vietą
              </Button>
            )}
            <Button variant="primary" fullWidth onClick={toggleEditMode}>
              Baigti redagavimą
            </Button>
          </div>
        ) : (
          <div className={styles.editActions}>
            <Button variant="secondary" onClick={toggleEditMode}>
              Redaguoti vietas
            </Button>
            <Button variant="primary" fullWidth onClick={finish}>
              Baigti apžiūrą
            </Button>
          </div>
        )}
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}

      <ElementDetailModal
        sessionId={session.id}
        stationId={session.stationId}
        point={point}
        results={results}
      />
    </>
  )
}
