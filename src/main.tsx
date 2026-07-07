import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { db } from './services/db/schema'
import { seedDatabase, seedDefaultPositions } from './services/db/seed'

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
  // Seed the user's confirmed default marker placements (per version, or when
  // the positions are missing). Runs after the cleanup above so it isn't wiped.
  // Guarded so a seeding failure (e.g. storage quota) can't blank the whole app.
  try {
    await seedDefaultPositions(db)
  } catch (err) {
    console.error('seedDefaultPositions failed', err)
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

bootstrap()
