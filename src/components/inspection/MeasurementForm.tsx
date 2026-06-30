import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { Measurement, MeasurementDef } from '../../types'
import styles from './MeasurementForm.module.css'

interface MeasurementFormProps {
  defs: MeasurementDef[]
  initial: Measurement[]
  /** Called on every change with the current measurement values. */
  onChange: (measurements: Measurement[]) => void
}

type FormValues = Record<string, string | boolean>

function buildDefaults(defs: MeasurementDef[], initial: Measurement[]): FormValues {
  const byKey = new Map(initial.map((m) => [m.key, m.value]))
  const values: FormValues = {}
  for (const def of defs) {
    const v = byKey.get(def.key)
    if (def.dataType === 'boolean') {
      values[def.key] = v === true
    } else {
      values[def.key] = v === null || v === undefined ? '' : String(v)
    }
  }
  return values
}

function toMeasurements(defs: MeasurementDef[], values: FormValues): Measurement[] {
  return defs.map((def) => {
    if (def.dataType === 'boolean') {
      return { key: def.key, value: Boolean(values[def.key]) }
    }
    const raw = String(values[def.key] ?? '').replace(',', '.').trim()
    const num = raw === '' ? null : Number(raw)
    return {
      key: def.key,
      value: num === null || Number.isNaN(num) ? null : num,
    }
  })
}

function outOfRange(def: MeasurementDef, value: string | boolean): boolean {
  if (def.dataType !== 'number') return false
  const raw = String(value).replace(',', '.').trim()
  if (raw === '') return false
  const num = Number(raw)
  if (Number.isNaN(num)) return false
  if (def.min !== null && num < def.min) return true
  if (def.max !== null && num > def.max) return true
  return false
}

/** Controlled measurement inputs; reports values to the parent via onChange. */
export function MeasurementForm({ defs, initial, onChange }: MeasurementFormProps) {
  const { register, watch } = useForm<FormValues>({
    defaultValues: buildDefaults(defs, initial),
  })

  const values = watch()

  useEffect(() => {
    onChange(toMeasurements(defs, values))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)])

  return (
    <div className={styles.form}>
      {defs.map((def) => {
        if (def.dataType === 'boolean') {
          return (
            <label key={def.key} className={styles.boolRow}>
              <input type="checkbox" {...register(def.key)} />
              <span>{def.label}</span>
            </label>
          )
        }

        const warn = outOfRange(def, values[def.key] ?? '')
        const range =
          def.min !== null || def.max !== null
            ? `Norma: ${def.min ?? '…'}–${def.max ?? '…'} ${def.unit}`.trim()
            : null

        return (
          <div key={def.key} className={styles.field}>
            <label className={styles.label} htmlFor={`m-${def.key}`}>
              {def.label}
              {def.required && <span className={styles.req}> *</span>}
            </label>
            <div className={styles.inputRow}>
              <input
                id={`m-${def.key}`}
                className={styles.input}
                type="text"
                inputMode="decimal"
                placeholder="0.0"
                {...register(def.key)}
              />
              {def.unit && <span className={styles.unit}>{def.unit}</span>}
            </div>
            {range && <span className={styles.hint}>{range}</span>}
            {warn && (
              <span className={styles.warn}>Reikšmė už normos ribų</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
