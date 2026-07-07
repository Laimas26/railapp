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
  bulkSetPositions,
} from '../services/db/queries/positions'
import { useActiveSession } from '../hooks/useActiveSession'
import { useHighlightedElements } from '../hooks/useHighlightedElements'
import { useSessionProgress } from '../hooks/useSessionProgress'
import { useUiStore } from '../store/uiStore'
import { serializePositions, parsePositions } from '../utils/positionsTransfer'
import { Header } from '../components/layout/Header'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { DiagramBoard } from '../components/schematic/DiagramBoard'
import { ElementDetailModal } from '../components/inspection/ElementDetailModal'
import type { ElementPosition, SchematicElement } from '../types'
import styles from './SchematicView.module.css'

/** Switches first, then track circuits; within each, numeric-ascending by number. */
function compareElements(a: SchematicElement, b: SchematicElement): number {
  const rank = (el: SchematicElement) => (el.elementType === 'switch' ? 0 : 1)
  if (rank(a) !== rank(b)) return rank(a) - rank(b)
  const na = parseInt(a.elementNumber, 10)
  const nb = parseInt(b.elementNumber, 10)
  const aNaN = Number.isNaN(na)
  const bNaN = Number.isNaN(nb)
  if (aNaN && bNaN) return a.elementNumber.localeCompare(b.elementNumber)
  if (aNaN) return 1
  if (bNaN) return -1
  if (na !== nb) return na - nb
  return a.elementNumber.localeCompare(b.elementNumber)
}

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
      () => (stationId ? getElementsByStation(db, stationId) : Promise.resolve([])),
      [stationId],
    ) ?? []

  const positionsList =
    useLiveQuery(
      () => (stationId ? getPositions(db, stationId) : Promise.resolve([])),
      [stationId],
    ) ?? []

  const [descOpen, setDescOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [placingId, setPlacingId] = useState<string | null>(null)
  const [transfer, setTransfer] = useState<
    null | { mode: 'export' | 'import'; text: string }
  >(null)

  const positionsMap = useMemo(() => {
    const m = new Map<string, ElementPosition>()
    for (const p of positionsList) m.set(p.id, p)
    return m
  }, [positionsList])

  const sortedElements = useMemo(
    () => [...allElements].sort(compareElements),
    [allElements],
  )

  // element id === svgElementId, so these sets key the markers directly.
  const highlightedIds = useMemo(
    () => new Set(highlighted.map((el) => el.id)),
    [highlighted],
  )

  const resultsByElement = useMemo(() => {
    const map = new Map<string, 'pass' | 'fail'>()
    for (const r of results) map.set(r.elementId, r.result)
    return map
  }, [results])

  const placedCount = useMemo(
    () => allElements.filter((el) => positionsMap.has(el.id)).length,
    [allElements, positionsMap],
  )

  const unplacedHighlighted = useMemo(
    () => highlighted.filter((el) => !positionsMap.has(el.id)).length,
    [highlighted, positionsMap],
  )

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2000)
    return () => clearTimeout(t)
  }, [toast])

  const onElementTap = (elementId: string) => {
    if (editMode) {
      // Tapping a placed marker selects it for fine-tuning / removal.
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
    await setPosition(db, { id: placingId, stationId, xPct, yPct })
    setToast('Vieta išsaugota')
  }

  const removePlacement = async () => {
    if (!placingId) return
    await deletePosition(db, placingId)
    setToast('Vieta pašalinta')
  }

  const exportPositions = async () => {
    if (!stationId) return
    if (positionsList.length === 0) {
      setToast('Nėra pažymėtų vietų')
      return
    }
    const text = serializePositions(stationId, positionsList)
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(text)
    } catch {
      /* ignore */
    }
    setTransfer({ mode: 'export', text })
  }

  const importPositions = () => {
    if (!stationId) return
    setTransfer({ mode: 'import', text: '' })
  }

  const doImport = async () => {
    if (!stationId) return
    const result = parsePositions(transfer?.text ?? '', stationId)
    if (result.status === 'bad-format') {
      setToast('Neteisingas formatas')
      return
    }
    if (result.positions.length === 0) {
      setToast('Nerasta vietų')
      return
    }
    try {
      await bulkSetPositions(db, result.positions)
      setToast('Įkelta vietų: ' + result.positions.length)
      setTransfer(null)
    } catch {
      setToast('Klaida įkeliant')
    }
  }

  const copyExport = async () => {
    try {
      if (!navigator.clipboard) throw new Error('no clipboard')
      await navigator.clipboard.writeText(transfer!.text)
      setToast('Nukopijuota')
    } catch {
      setToast('Nepavyko nukopijuoti')
    }
  }

  const toggleEdit = () => {
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

      {editMode ? (
        <>
          <div className={styles.meta}>
            <p className={styles.editInfo}>
              Pasirinkite elementą ir bakstelėkite plane, kad pažymėtumėte jo vietą.
            </p>
            <p className={styles.periodicity}>
              Priskirta {placedCount}/{allElements.length}
            </p>
          </div>
          <div className={styles.picker}>
            {sortedElements.map((el) => {
              const classes = [styles.chip]
              if (positionsMap.has(el.id)) classes.push(styles.chipPlaced)
              if (el.id === placingId) classes.push(styles.chipActive)
              return (
                <button
                  key={el.id}
                  className={classes.join(' ')}
                  onClick={() => setPlacingId(el.id)}
                >
                  {positionsMap.has(el.id) ? '✓ ' : ''}
                  {el.elementNumber}
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <div className={styles.meta}>
          <p className={styles.periodicity}>{point.periodicity}</p>
          {descOpen && <p className={styles.desc}>{point.description}</p>}
          {highlighted.length === 0 ? (
            <p className={styles.noMatch}>
              Šiai užduočiai tinkamų elementų šioje stotyje nėra.
            </p>
          ) : (
            <>
              <ProgressBar done={progress.done} total={progress.total} />
              {unplacedHighlighted > 0 && (
                <p className={styles.noMatch}>
                  Kai kurie šios užduoties elementai dar nepažymėti plane (
                  {unplacedHighlighted}). Paspauskite „Redaguoti vietas“.
                </p>
              )}
            </>
          )}
        </div>
      )}

      <DiagramBoard
        svgKey={session.stationId}
        elements={allElements}
        positions={positionsMap}
        highlightedIds={highlightedIds}
        resultsByElement={resultsByElement}
        activeId={editMode ? null : selectedSvgElementId}
        editMode={editMode}
        placingId={placingId}
        onElementTap={onElementTap}
        onPlaceAt={onPlaceAt}
      />

      <div className={styles.footer}>
        {editMode ? (
          <div className={styles.editActions}>
            {placingId && (
              <Button variant="danger" fullWidth onClick={removePlacement}>
                Pašalinti vietą
              </Button>
            )}
            <Button variant="secondary" fullWidth onClick={exportPositions}>
              Kopijuoti vietas
            </Button>
            <Button variant="secondary" fullWidth onClick={importPositions}>
              Įklijuoti vietas
            </Button>
            <Button variant="secondary" fullWidth onClick={toggleEdit}>
              Baigti redagavimą
            </Button>
          </div>
        ) : (
          <div className={styles.editActions}>
            <Button variant="secondary" fullWidth onClick={toggleEdit}>
              Redaguoti vietas
            </Button>
            <Button variant="primary" fullWidth onClick={finish}>
              Baigti apžiūrą
            </Button>
          </div>
        )}
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}

      <Modal
        open={transfer !== null}
        onClose={() => setTransfer(null)}
        title={transfer?.mode === 'export' ? 'Kopijuoti vietas' : 'Įklijuoti vietas'}
      >
        {transfer?.mode === 'export' ? (
          <>
            <p className={styles.transferHint}>
              Nukopijuokite šį tekstą ir nusiųskite į kitą įrenginį (pvz. el. paštu
              ar žinute).
            </p>
            <textarea
              className={styles.transferArea}
              readOnly
              value={transfer.text}
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button variant="primary" fullWidth onClick={copyExport}>
              Kopijuoti
            </Button>
          </>
        ) : (
          <>
            <p className={styles.transferHint}>
              Įklijuokite iš kito įrenginio nukopijuotą tekstą.
            </p>
            <textarea
              className={styles.transferArea}
              value={transfer?.text ?? ''}
              onChange={(e) =>
                setTransfer((t) => (t ? { ...t, text: e.target.value } : t))
              }
              placeholder="{&quot;kind&quot;:&quot;railapp-positions&quot;,...}"
            />
            <Button variant="primary" fullWidth onClick={doImport}>
              Įkelti
            </Button>
          </>
        )}
      </Modal>

      <ElementDetailModal
        sessionId={session.id}
        stationId={session.stationId}
        point={point}
        results={results}
      />
    </>
  )
}
