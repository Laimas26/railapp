import { Outlet } from 'react-router-dom'
import styles from './Layout.module.css'

export function Layout() {
  return (
    <div className={styles.app}>
      <Outlet />
    </div>
  )
}
