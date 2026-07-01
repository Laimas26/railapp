import { useRef } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import rimkaiPlanUrl from '../../assets/schematics/rimkai-plan.jpg'
import type { ElementPosition, SchematicElement } from '../../types'
import styles from './PhotoSchematic.module.css'

/** Static asset map so Vite bundles each plan photo; extend per new station. */
const PLAN_IMAGES: Record<string, string> = {
  rimkai: rimkaiPlanUrl,
}

interface PhotoSchematicProps {
  imageKey: string
  /** all station elements */
  elements: SchematicElement[]
  /** by element id */
  positions: Map<string, ElementPosition>
  /** element ids to highlight (yellow) */
  highlightedIds: Set<string>
  /** element id -> result */
  resultsByElement: Map<string, 'pass' | 'fail'>
  /** element id open in the detail sheet */
  activeId: string | null
  editMode: boolean
  /** in edit mode, the element being placed */
  placingId: string | null
  /** normal mode: a hotspot was tapped */
  onElementTap: (elementId: string) => void
  /** edit mode: the image was tapped at normalized coords */
  onPlaceAt: (xPct: number, yPct: number) => void
}

export function PhotoSchematic({
  imageKey,
  elements,
  positions,
  highlightedIds,
  resultsByElement,
  activeId,
  editMode,
  placingId,
  onElementTap,
  onPlaceAt,
}: PhotoSchematicProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const imageSrc = PLAN_IMAGES[imageKey] ?? ''

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode) return
    // Ignore taps that originate on an existing hotspot (handled by the button).
    if ((e.target as HTMLElement).closest('[data-element-id]')) return
    const rect = overlayRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return
    const x = clamp01((e.clientX - rect.left) / rect.width)
    const y = clamp01((e.clientY - rect.top) / rect.height)
    onPlaceAt(x, y)
  }

  return (
    <div className={styles.viewport}>
      <TransformWrapper
        minScale={0.5}
        maxScale={8}
        initialScale={1}
        doubleClick={{ disabled: false, mode: 'zoomIn' }}
        wheel={{ step: 0.08 }}
        panning={{ velocityDisabled: true }}
      >
        <TransformComponent
          wrapperClass={styles.transformWrapper}
          contentClass={styles.transformContent}
        >
          <div className={styles.plan}>
            <img src={imageSrc} className={styles.img} alt="Stoties planas" />
            <div
              ref={overlayRef}
              className={styles.overlay}
              onClick={handleOverlayClick}
            >
              {elements.map((el) => {
                const pos = positions.get(el.id)
                if (!pos) return null
                const result = resultsByElement.get(el.id)
                const isTrack = el.elementType === 'track-circuit'
                const classes = [
                  styles.hotspot,
                  isTrack ? styles.track : styles.switch,
                ]
                if (highlightedIds.has(el.id)) classes.push(styles.highlighted)
                if (result === 'pass') classes.push(styles.pass)
                else if (result === 'fail') classes.push(styles.fail)
                if (el.id === activeId) classes.push(styles.active)
                if (editMode && el.id === placingId) classes.push(styles.placing)
                return (
                  <button
                    key={el.id}
                    type="button"
                    data-element-id={el.id}
                    className={classes.join(' ')}
                    style={{
                      left: `${pos.xPct * 100}%`,
                      top: `${pos.yPct * 100}%`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onElementTap(el.id)
                    }}
                  >
                    {el.elementNumber}
                  </button>
                )
              })}
            </div>
          </div>
        </TransformComponent>
      </TransformWrapper>

      {editMode && placingId && (
        <div className={styles.hint}>
          Bakstelėkite plane, kad pažymėtumėte elemento vietą
        </div>
      )}
    </div>
  )
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}
