import { createHashRouter } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { HomeView } from './views/HomeView'
import { SchematicView } from './views/SchematicView'
import { HistoryView } from './views/HistoryView'
import { SessionDetailView } from './views/SessionDetailView'

export const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomeView /> },
      { path: '/session/:sessionId', element: <SchematicView /> },
      { path: '/history', element: <HistoryView /> },
      { path: '/history/:sessionId', element: <SessionDetailView /> },
    ],
  },
])
