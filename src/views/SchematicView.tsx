import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../services/db/schema'
import { completeSession } from '../services/db/queries/sessions'
import { useActiveSession } from '../hooks/useActiveSession'
import { useHighlightedElements } from '../hooks/useHighlightedElements'
import { useSessionProgress } from '../hooks/useSessionProgress'
import { useUiStore } from '../store/uiStore'
import { Header } from '../components/layout/Header'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Button } from '../components/ui/Button'
import { SchematicCanvas } from '../components/schematic/SchematicCanvas'
import { ElementDetailModal } from '../components/inspection/ElementDetailModal'
import styles from './SchematicView.module.css'

export function SchematicView() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const setSelected = useUiStore((s) => s.setSelected)
  const selectedSvgElementId = useUiStore((s) => s.selectedSvgElementId)

  const { session, point, results, loading } = useActiveSession(sessionId)
  const highlighted = useHighlightedElements(session?.stationId, point?.id)
  const progress = useSessionProgress(highlighted, results)

  const [descOpen, setDescOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const highlightedSvgIds = useMemo(
    () => new Set(highlighted.map((el) => el.svgElementId)),
    [highlighted],
  )

  // svgElementId -> 'pass' | 'fail'
  const resultsByElement = useMemo(() => {
    const byId = new Map(highlighted.map((el) => [el.id, el.svgElementId]))
    const map = new Map<string, 'pass' | 'fail'>()
    for (const r of results) {
      const svgId = byId.get(r.elementId)
      if (svgId) map.set(svgId, r.result)
    }
    return map
  }, [results, highlighted])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2000)
    return () => clearTimeout(t)
  }, [toast])

  const onElementTap = (svgElementId: string) => {
    if (!highlightedSvgIds.has(svgElementId)) {
      setToast('Šis elementas nepriklauso šiai užduočiai')
      return
    }
    setSelected(svgElementId)
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

      <div className={styles.meta}>
        {descOpen && <p className={styles.desc}>{point.description}</p>}
        <ProgressBar done={progress.done} total={progress.total} />
      </div>

      <SchematicCanvas
        svgAssetKey={session.stationId}
        highlightedIds={highlightedSvgIds}
        resultsByElement={resultsByElement}
        activeId={selectedSvgElementId}
        onElementTap={onElementTap}
      />

      <div className={styles.footer}>
        <Button variant="primary" fullWidth onClick={finish}>
          Baigti apžiūrą
        </Button>
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}

      <ElementDetailModal
        sessionId={session.id}
        stationId={session.stationId}
        point={point}
        results={results}
      />
    </>
  )
}
