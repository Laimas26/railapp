import type { ElementPosition } from '../types'

/** Shape written to the clipboard by exportPositions / read by importPositions. */
interface PositionsPayload {
  kind: 'railapp-positions'
  v: 1
  stationId: string
  positions: Array<{ id: string; xPct: number; yPct: number }>
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/** Build the JSON string shared via clipboard/prompt. xPct/yPct rounded to 4 decimals. */
export function serializePositions(
  stationId: string,
  positions: ElementPosition[],
): string {
  const obj: PositionsPayload = {
    kind: 'railapp-positions',
    v: 1,
    stationId,
    positions: positions.map((p) => ({
      id: p.id,
      xPct: Number(p.xPct.toFixed(4)),
      yPct: Number(p.yPct.toFixed(4)),
    })),
  }
  return JSON.stringify(obj)
}

/**
 * Result of parsing pasted positions text.
 * - 'bad-format': text isn't valid JSON, or doesn't match the expected payload shape
 *   (wrong/missing `kind`, `positions` not an array).
 * - 'ok': valid payload shape; `positions` holds whichever items passed per-item
 *   validation (may be empty — caller should treat that as "no valid positions").
 *
 * The payload's own `stationId` is intentionally ignored; the caller's `stationId`
 * (the station currently open in the view) is always used instead.
 */
export type ParsePositionsResult =
  | { status: 'bad-format' }
  | { status: 'ok'; positions: ElementPosition[] }

export function parsePositions(
  text: string,
  stationId: string,
): ParsePositionsResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { status: 'bad-format' }
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    (parsed as { kind?: unknown }).kind !== 'railapp-positions' ||
    !Array.isArray((parsed as { positions?: unknown }).positions)
  ) {
    return { status: 'bad-format' }
  }

  const valid: ElementPosition[] = []
  for (const item of (parsed as { positions: unknown[] }).positions) {
    if (typeof item !== 'object' || item === null) continue
    const { id, xPct, yPct } = item as {
      id?: unknown
      xPct?: unknown
      yPct?: unknown
    }
    if (
      typeof id !== 'string' ||
      id.trim().length === 0 ||
      typeof xPct !== 'number' ||
      !Number.isFinite(xPct) ||
      typeof yPct !== 'number' ||
      !Number.isFinite(yPct)
    )
      continue
    valid.push({ id, stationId, xPct: clamp01(xPct), yPct: clamp01(yPct) })
  }

  return { status: 'ok', positions: valid }
}
