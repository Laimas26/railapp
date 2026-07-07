import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { db } from './services/db/schema'
import { seedDatabase } from './services/db/seed'

async function bootstrap() {
  await seedDatabase(db)
  // One-time cleanup: wipe the old pre-seeded clump of marker positions so
  // every existing install starts from a clean, empty diagram.
  if (typeof localStorage !== 'undefined') {
    if (localStorage.getItem('railapp.posReset') !== '2') {
      await db.elementPositions.clear()
      localStorage.setItem('railapp.posReset', '2')
    }
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

bootstrap()
