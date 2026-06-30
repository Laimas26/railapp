import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Header.module.css'

interface HeaderProps {
  title: ReactNode
  back?: boolean | (() => void)
  right?: ReactNode
}

export function Header({ title, back, right }: HeaderProps) {
  const navigate = useNavigate()

  const onBack = () => {
    if (typeof back === 'function') back()
    else navigate(-1)
  }

  return (
    <header className={styles.header}>
      {back ? (
        <button className={styles.iconBtn} onClick={onBack} aria-label="Atgal">
          ‹
        </button>
      ) : (
        <span className={styles.spacer} />
      )}
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.right}>{right}</div>
    </header>
  )
}
