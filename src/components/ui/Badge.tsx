import type { ReactNode } from 'react'
import styles from './Badge.module.css'

type Tone = 'pass' | 'fail' | 'neutral'

interface BadgeProps {
  tone?: Tone
  children: ReactNode
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>
}
