import { useMemo, useRef, useState } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import rimkaiSvg from '../../assets/schematics/rimkai.svg?raw'
import type { ElementPosition, SchematicElement } from '../../types'
import styles from './DiagramBoard.module.css'

/** Static asset map so Vite bundles each drawn diagram; extend per new station. */
const DIAGRAMS: Record<string, string> = {
  rimkai: rimkaiSvg,
}

/** Marker sizes are expressed in the diagram's own viewBox units so they stay
 *  proportional to the tracks at any zoom level. */
const SWITCH_R = 11
const TRACK_SIZE = 20
const HIT_R = 20
const LABEL_DY = 22
const FONT_SIZE = 14

/** Fallback used only if a diagram is missing a parseable viewBox. */
const FALLBACK_VIEWBOX = { minX: 0, minY: 0, w: 2000, h: 492 }

function parseViewBox(svg: string) {
  const m = svg.match(/viewBox="([\d.\s]+)"/)
  if (m) {
    const parts = m[1].trim().split(/\s+/).map(Number)
    if (parts.length === 4 && parts.every((n) => !Number.isNaN(n))) {
      return { minX: parts[0], minY: parts[1], w: parts[2], h: parts[3] }
    }
  }
  return FALLBACK_VIEWBOX
}

interface DiagramBoardProps {
  svgKey: string
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
  /** edit mode: the board was tapped at normalized coords */
  onPlaceAt: (xPct: number, yPct: number) => void
}

export function DiagramBoard({
  svgKey,
  elements,
  positions,
  highlightedIds,
  resultsByElement,
  activeId,
  editMode,
  placingId,
  onElementTap,
  onPlaceAt,
}: DiagramBoardProps) {
  const overlayRef = useRef<SVGSVGElement>(null)
  const svgMarkup = DIAGRAMS[svgKey] ?? ''
  // The overlay <svg> shares this viewBox with the background diagram, so both
  // scale identically and markers are sized in the diagram's coordinate units.
  const vb = useMemo(() => parseViewBox(svgMarkup), [svgMarkup])
  // In edit mode, the marker currently being dragged and its live coords.
  const [drag, setDrag] = useState<{
    id: string
    xPct: number
    yPct: number
    moved: boolean
  } | null>(null)

  const coordsFromEvent = (
    e: React.PointerEvent | React.MouseEvent,
  ): { x: number; y: number } | null => {
    const rect = overlayRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return null
    return {
      x: clamp01((e.clientX - rect.left) / rect.width),
      y: clamp01((e.clientY - rect.top) / rect.height),
    }
  }

  const handleOverlayClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!editMode) return
    // Ignore taps that originate on an existing marker (handled by its group).
    if ((e.target as Element).closest('[data-element-id]')) return
    const coords = coordsFromEvent(e)
    if (!coords) return
    onPlaceAt(coords.x, coords.y)
  }

  const handleMarkerPointerDown = (
    e: React.PointerEvent<SVGGElement>,
    elementId: string,
    pos: ElementPosition,
  ) => {
    if (!editMode) return
    // Keep the drag on this marker and away from the pan handler.
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    onElementTap(elementId) // selects this element (sets placingId in parent)
    setDrag({ id: elementId, xPct: pos.xPct, yPct: pos.yPct, moved: false })
  }

  const handleMarkerPointerMove = (
    e: React.PointerEvent<SVGGElement>,
    elementId: string,
  ) => {
    if (!drag || drag.id !== elementId) return
    e.stopPropagation()
    const coords = coordsFromEvent(e)
    if (!coords) return
    setDrag({ id: elementId, xPct: coords.x, yPct: coords.y, moved: true })
  }

  const handleMarkerPointerUp = (
    e: React.PointerEvent<SVGGElement>,
    elementId: string,
  ) => {
    if (!drag || drag.id !== elementId) return
    e.stopPropagation()
    const moved = drag.moved
    const coords = coordsFromEvent(e)
    setDrag(null)
    // Only persist when the marker was actually dragged; a plain tap just selects.
    if (moved && coords) onPlaceAt(coords.x, coords.y)
  }

  return (
    <div className={styles.viewport}>
      <TransformWrapper
        minScale={0.5}
        maxScale={8}
        initialScale={1}
        doubleClick={{ disabled: false, mode: 'zoomIn' }}
        wheel={{ step: 0.08 }}
        panning={{ velocityDisabled: true, disabled: drag !== null }}
      >
        <TransformComponent
          wrapperClass={styles.transformWrapper}
          contentClass={styles.transformContent}
        >
          <div className={styles.plan}>
            <div
              className={styles.svgHost}
              dangerouslySetInnerHTML={{ __html: svgMarkup }}
            />
            <svg
              ref={overlayRef}
              className={styles.overlay}
              viewBox={`0 0 ${vb.w} ${vb.h}`}
              preserveAspectRatio="xMidYMid meet"
              onClick={handleOverlayClick}
            >
              {/* Full-box hit area so empty-plane taps register as "place". */}
              {editMode && (
                <rect
                  className={styles.placeArea}
                  x={0}
                  y={0}
                  width={vb.w}
                  height={vb.h}
                />
              )}
              {elements.map((el) => {
                const pos = positions.get(el.id)
                if (!pos) return null
                const result = resultsByElement.get(el.id)
                // Normal mode: only show markers relevant to the current task
                // (highlighted or already has a result). Edit mode: show every
                // placed element so the user can see and move them.
                if (
                  !editMode &&
                  !highlightedIds.has(el.id) &&
                  result === undefined
                )
                  return null
                const isTrack = el.elementType === 'track-circuit'
                const classes = [styles.marker]
                if (highlightedIds.has(el.id)) classes.push(styles.highlighted)
                if (result === 'pass') classes.push(styles.pass)
                else if (result === 'fail') classes.push(styles.fail)
                if (el.id === activeId) classes.push(styles.active)
                if (editMode && el.id === placingId) classes.push(styles.placing)
                const live = drag && drag.id === el.id ? drag : pos
                const cx = live.xPct * vb.w
                const cy = live.yPct * vb.h
                return (
                  <g
                    key={el.id}
                    data-element-id={el.id}
                    className={classes.join(' ')}
                    onPointerDown={(e) =>
                      handleMarkerPointerDown(e, el.id, pos)
                    }
                    onPointerMove={(e) => handleMarkerPointerMove(e, el.id)}
                    onPointerUp={(e) => handleMarkerPointerUp(e, el.id)}
                    onClick={(e) => {
                      e.stopPropagation()
                      onElementTap(el.id)
                    }}
                  >
                    <circle className={styles.hit} cx={cx} cy={cy} r={HIT_R} />
                    {isTrack ? (
                      <rect
                        className={styles.node}
                        x={cx - TRACK_SIZE / 2}
                        y={cy - TRACK_SIZE / 2}
                        width={TRACK_SIZE}
                        height={TRACK_SIZE}
                        rx={4}
                      />
                    ) : (
                      <circle
                        className={styles.node}
                        cx={cx}
                        cy={cy}
                        r={SWITCH_R}
                      />
                    )}
                    <text
                      className={styles.label}
                      x={cx}
                      y={cy + LABEL_DY}
                      textAnchor="middle"
                      fontSize={FONT_SIZE}
                    >
                      {el.elementNumber}
                    </text>
                  </g>
                )
              })}
            </svg>
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
