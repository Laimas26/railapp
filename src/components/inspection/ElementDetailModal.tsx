import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../services/db/schema'
import { getElementBySvgId } from '../../services/db/queries/elements'
import { upsertResult } from '../../services/db/queries/results'
import { useUiStore } from '../../store/uiStore'
import type {
  InspectionPoint,
  InspectionResult,
  Measurement,
  ResultValue,
} from '../../types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ResultActions } from './ResultActions'
import { MeasurementForm } from './MeasurementForm'
import styles from './ElementDetailModal.module.css'

interface ElementDetailModalProps {
  sessionId: string
  stationId: string
  point: InspectionPoint | undefined
  results: InspectionResult[]
}

export function ElementDetailModal({
  sessionId,
  stationId,
  point,
  results,
}: ElementDetailModalProps) {
  const selectedSvgElementId = useUiStore((s) => s.selectedSvgElementId)
  const clearSelection = useUiStore((s) => s.clearSelection)

  const element = useLiveQuery(
    () =>
      selectedSvgElementId
        ? getElementBySvgId(db, stationId, selectedSvgElementId)
        : undefined,
    [selectedSvgElementId, stationId],
  )

  const existing = useMemo(
    () => results.find((r) => r.elementId === element?.id),
    [results, element?.id],
  )

  const [result, setResult] = useState<ResultValue | null>(null)
  const [notes, setNotes] = useState('')
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [saving, setSaving] = useState(false)

  // Reset / pre-fill the form whenever the opened element changes.
  useEffect(() => {
    if (!selectedSvgElementId) return
    setResult(existing?.result ?? null)
    setNotes(existing?.notes ?? '')
    setMeasurements(existing?.measurements ?? [])
  }, [selectedSvgElementId, element?.id, existing])

  const open = Boolean(selectedSvgElementId)

  const save = async () => {
    if (!element || !point || !result) return
    setSaving(true)
    try {
      await upsertResult(db, {
        sessionId,
        elementId: element.id,
        inspectionPointId: point.id,
        stationId,
        result,
        notes: notes.trim(),
        measurements: point.requiresMeasurements ? measurements : [],
      })
      clearSelection()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={clearSelection}
      title={
        element ? (
          <span>
            Iešmas Nr. {element.elementNumber}
            {element.machine && (
              <span className={styles.machine}> · {element.machine}</span>
            )}
          </span>
        ) : (
          'Elementas'
        )
      }
    >
      {element && (
        <div className={styles.content}>
          <p className={styles.label}>{element.label}</p>
          {point && <p className={styles.desc}>{point.description}</p>}

          <ResultActions value={result} onChange={setResult} />

          {point?.requiresMeasurements && point.measurementDefs.length > 0 && (
            <MeasurementForm
              defs={point.measurementDefs}
              initial={existing?.measurements ?? []}
              onChange={setMeasurements}
            />
          )}

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="notes">
              Pastabos
            </label>
            <textarea
              id="notes"
              className={styles.textarea}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Neprivaloma"
            />
          </div>

          <Button
            variant="primary"
            fullWidth
            disabled={!result || saving}
            onClick={save}
          >
            Išsaugoti
          </Button>
        </div>
      )}
    </Modal>
  )
}
