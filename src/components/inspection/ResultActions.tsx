import type { ResultValue } from '../../types'
import styles from './ResultActions.module.css'

interface ResultActionsProps {
  value: ResultValue | null
  onChange: (value: ResultValue) => void
}

/** Big PASS / FAIL selector. */
export function ResultActions({ value, onChange }: ResultActionsProps) {
  return (
    <div className={styles.row}>
      <button
        type="button"
        className={`${styles.btn} ${styles.pass} ${value === 'pass' ? styles.active : ''}`}
        onClick={() => onChange('pass')}
      >
        Tinkama
      </button>
      <button
        type="button"
        className={`${styles.btn} ${styles.fail} ${value === 'fail' ? styles.active : ''}`}
        onClick={() => onChange('fail')}
      >
        Netinkama
      </button>
    </div>
  )
}
