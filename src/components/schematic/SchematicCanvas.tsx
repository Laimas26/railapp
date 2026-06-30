import { useEffect, useRef } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import rimkaiSvg from '../../assets/schematics/rimkai.svg?raw'
import styles from './SchematicCanvas.module.css'

/** Static asset map so Vite bundles each schematic; extend per new station. */
const SCHEMATICS: Record<string, string> = {
  rimkai: rimkaiSvg,
}

interface SchematicCanvasProps {
  svgAssetKey: string
  highlightedIds: Set<string>
  resultsByElement: Map<string, 'pass' | 'fail'>
  activeId: string | null
  onElementTap: (svgElementId: string) => void
}

const STATE_CLASSES = ['el-highlighted', 'el-inspected', 'el-failed', 'el-active']

export function SchematicCanvas({
  svgAssetKey,
  highlightedIds,
  resultsByElement,
  activeId,
  onElementTap,
}: SchematicCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onTapRef = useRef(onElementTap)
  onTapRef.current = onElementTap

  const svgMarkup = SCHEMATICS[svgAssetKey] ?? ''

  // Inject the SVG once per asset key.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.innerHTML = svgMarkup
  }, [svgMarkup])

  // Delegated tap handling.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: Event) => {
      const target = e.target as Element | null
      const group = target?.closest('[data-element-id]') as HTMLElement | null
      const id = group?.dataset.elementId
      if (id) onTapRef.current(id)
    }
    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [svgMarkup])

  // Toggle state classes whenever the highlight/result/active state changes.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const groups = el.querySelectorAll<HTMLElement>('[data-element-id]')
    groups.forEach((g) => {
      const id = g.dataset.elementId
      g.classList.remove(...STATE_CLASSES)
      if (!id) return
      if (highlightedIds.has(id)) g.classList.add('el-highlighted')
      const result = resultsByElement.get(id)
      if (result === 'pass') g.classList.add('el-inspected')
      else if (result === 'fail') g.classList.add('el-failed')
      if (id === activeId) g.classList.add('el-active')
    })
  }, [svgMarkup, highlightedIds, resultsByElement, activeId])

  return (
    <div className={styles.viewport}>
      <TransformWrapper
        minScale={0.5}
        maxScale={6}
        initialScale={1}
        doubleClick={{ disabled: false, mode: 'zoomIn' }}
        wheel={{ step: 0.08 }}
      >
        <TransformComponent
          wrapperClass={styles.transformWrapper}
          contentClass={styles.transformContent}
        >
          <div ref={containerRef} className={styles.svgHost} />
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}
