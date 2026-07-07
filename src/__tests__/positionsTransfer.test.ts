import { describe, it, expect } from 'vitest'
import { serializePositions, parsePositions } from '../utils/positionsTransfer'
import type { ElementPosition } from '../types'

// ---------------------------------------------------------------------------
// serializePositions
// ---------------------------------------------------------------------------

describe('serializePositions', () => {
  it('produces the expected envelope shape', () => {
    const positions: ElementPosition[] = [
      { id: 'sw-1', stationId: 'rimkai', xPct: 0.5, yPct: 0.25 },
    ]
    const text = serializePositions('rimkai', positions)
    const parsed = JSON.parse(text)
    expect(parsed).toEqual({
      kind: 'railapp-positions',
      v: 1,
      stationId: 'rimkai',
      positions: [{ id: 'sw-1', xPct: 0.5, yPct: 0.25 }],
    })
  })

  it('rounds xPct/yPct to 4 decimals', () => {
    const positions: ElementPosition[] = [
      { id: 'sw-2', stationId: 'rimkai', xPct: 1 / 3, yPct: 2 / 3 },
    ]
    const text = serializePositions('rimkai', positions)
    const parsed = JSON.parse(text)
    expect(parsed.positions[0].xPct).toBeCloseTo(0.3333, 4)
    expect(parsed.positions[0].yPct).toBeCloseTo(0.6667, 4)
    // exactly 4 decimal places, no float noise
    expect(parsed.positions[0].xPct).toBe(0.3333)
    expect(parsed.positions[0].yPct).toBe(0.6667)
  })

  it('serializes an empty positions list', () => {
    const text = serializePositions('rimkai', [])
    const parsed = JSON.parse(text)
    expect(parsed.positions).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// serialize -> parse round trip
// ---------------------------------------------------------------------------

describe('serializePositions -> parsePositions round trip', () => {
  it('round-trips valid positions for the same station', () => {
    const positions: ElementPosition[] = [
      { id: 'sw-1', stationId: 'rimkai', xPct: 0.1234, yPct: 0.5678 },
      { id: 'sw-2', stationId: 'rimkai', xPct: 0, yPct: 1 },
    ]
    const text = serializePositions('rimkai', positions)
    const result = parsePositions(text, 'rimkai')
    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.positions).toEqual(positions)
    }
  })

  it('ignores the stationId embedded in the payload, using the passed-in one instead', () => {
    const positions: ElementPosition[] = [
      { id: 'sw-1', stationId: 'rimkai', xPct: 0.5, yPct: 0.5 },
    ]
    const text = serializePositions('rimkai', positions)
    const result = parsePositions(text, 'other-station')
    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.positions).toEqual([
        { id: 'sw-1', stationId: 'other-station', xPct: 0.5, yPct: 0.5 },
      ])
    }
  })
})

// ---------------------------------------------------------------------------
// parsePositions – clamping
// ---------------------------------------------------------------------------

describe('parsePositions – clamping', () => {
  it('clamps xPct/yPct above 1 down to 1', () => {
    const text = JSON.stringify({
      kind: 'railapp-positions',
      v: 1,
      stationId: 'rimkai',
      positions: [{ id: 'sw-1', xPct: 1.5, yPct: 2 }],
    })
    const result = parsePositions(text, 'rimkai')
    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.positions).toEqual([
        { id: 'sw-1', stationId: 'rimkai', xPct: 1, yPct: 1 },
      ])
    }
  })

  it('clamps negative xPct/yPct up to 0', () => {
    const text = JSON.stringify({
      kind: 'railapp-positions',
      v: 1,
      stationId: 'rimkai',
      positions: [{ id: 'sw-1', xPct: -0.5, yPct: -100 }],
    })
    const result = parsePositions(text, 'rimkai')
    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.positions).toEqual([
        { id: 'sw-1', stationId: 'rimkai', xPct: 0, yPct: 0 },
      ])
    }
  })

  it('leaves in-range values untouched', () => {
    const text = JSON.stringify({
      kind: 'railapp-positions',
      v: 1,
      stationId: 'rimkai',
      positions: [{ id: 'sw-1', xPct: 0.42, yPct: 0.99 }],
    })
    const result = parsePositions(text, 'rimkai')
    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.positions).toEqual([
        { id: 'sw-1', stationId: 'rimkai', xPct: 0.42, yPct: 0.99 },
      ])
    }
  })
})

// ---------------------------------------------------------------------------
// parsePositions – per-item skipping
// ---------------------------------------------------------------------------

describe('parsePositions – skips invalid items but keeps valid ones', () => {
  function payloadWith(positions: unknown[]): string {
    return JSON.stringify({
      kind: 'railapp-positions',
      v: 1,
      stationId: 'rimkai',
      positions,
    })
  }

  it('skips an item with a missing id', () => {
    const text = payloadWith([{ xPct: 0.1, yPct: 0.1 }])
    const result = parsePositions(text, 'rimkai')
    expect(result).toEqual({ status: 'ok', positions: [] })
  })

  it('skips an item with a non-string id', () => {
    const text = payloadWith([{ id: 42, xPct: 0.1, yPct: 0.1 }])
    const result = parsePositions(text, 'rimkai')
    expect(result).toEqual({ status: 'ok', positions: [] })
  })

  it('skips an item with an empty/whitespace-only id', () => {
    const text = payloadWith([
      { id: '', xPct: 0.1, yPct: 0.1 },
      { id: '   ', xPct: 0.2, yPct: 0.2 },
    ])
    const result = parsePositions(text, 'rimkai')
    expect(result).toEqual({ status: 'ok', positions: [] })
  })

  it('skips an item with a missing xPct', () => {
    const text = payloadWith([{ id: 'sw-1', yPct: 0.1 }])
    const result = parsePositions(text, 'rimkai')
    expect(result).toEqual({ status: 'ok', positions: [] })
  })

  it('skips an item with a missing yPct', () => {
    const text = payloadWith([{ id: 'sw-1', xPct: 0.1 }])
    const result = parsePositions(text, 'rimkai')
    expect(result).toEqual({ status: 'ok', positions: [] })
  })

  it('skips an item whose xPct is not a number (non-finite/wrong type)', () => {
    // JSON has no NaN/Infinity literals, so a non-numeric xPct is how an
    // "invalid number" reaches parsePositions in practice; it also exercises
    // the same guard branch (typeof !== 'number' / !Number.isFinite).
    const text = payloadWith([{ id: 'sw-1', xPct: 'not-a-number', yPct: 0.1 }])
    const result = parsePositions(text, 'rimkai')
    expect(result).toEqual({ status: 'ok', positions: [] })
  })

  it('skips a null item', () => {
    const text = payloadWith([null])
    const result = parsePositions(text, 'rimkai')
    expect(result).toEqual({ status: 'ok', positions: [] })
  })

  it('skips a non-object (string) item', () => {
    const text = payloadWith(['not-an-object'])
    const result = parsePositions(text, 'rimkai')
    expect(result).toEqual({ status: 'ok', positions: [] })
  })

  it('keeps valid items while skipping invalid ones in the same array', () => {
    const text = payloadWith([
      { id: 'sw-1', xPct: 0.2, yPct: 0.3 },
      { id: 'sw-2' }, // missing xPct/yPct
      { xPct: 0.4, yPct: 0.5 }, // missing id
      { id: 'sw-3', xPct: 0.6, yPct: 0.7 },
    ])
    const result = parsePositions(text, 'rimkai')
    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.positions).toEqual([
        { id: 'sw-1', stationId: 'rimkai', xPct: 0.2, yPct: 0.3 },
        { id: 'sw-3', stationId: 'rimkai', xPct: 0.6, yPct: 0.7 },
      ])
    }
  })

  it('returns ok with an empty array when all items are invalid (caller shows "no valid positions")', () => {
    const text = payloadWith([{ id: 'sw-1' }, { xPct: 0.1, yPct: 0.1 }])
    const result = parsePositions(text, 'rimkai')
    expect(result).toEqual({ status: 'ok', positions: [] })
  })

  it('returns ok with an empty array when positions array itself is empty', () => {
    const text = payloadWith([])
    const result = parsePositions(text, 'rimkai')
    expect(result).toEqual({ status: 'ok', positions: [] })
  })
})

// ---------------------------------------------------------------------------
// parsePositions – bad format
// ---------------------------------------------------------------------------

describe('parsePositions – bad format', () => {
  it('rejects non-JSON text', () => {
    const result = parsePositions('not json at all {{{', 'rimkai')
    expect(result).toEqual({ status: 'bad-format' })
  })

  it('rejects an empty string', () => {
    const result = parsePositions('', 'rimkai')
    expect(result).toEqual({ status: 'bad-format' })
  })

  it('rejects the literal "null"', () => {
    const result = parsePositions('null', 'rimkai')
    expect(result).toEqual({ status: 'bad-format' })
  })

  it('rejects a JSON value that is not an object (e.g. a number)', () => {
    const result = parsePositions('42', 'rimkai')
    expect(result).toEqual({ status: 'bad-format' })
  })

  it('rejects a JSON value that is not an object (e.g. an array)', () => {
    const result = parsePositions('[]', 'rimkai')
    expect(result).toEqual({ status: 'bad-format' })
  })

  it('rejects when kind is missing', () => {
    const text = JSON.stringify({ v: 1, stationId: 'rimkai', positions: [] })
    const result = parsePositions(text, 'rimkai')
    expect(result).toEqual({ status: 'bad-format' })
  })

  it('rejects when kind is wrong', () => {
    const text = JSON.stringify({
      kind: 'something-else',
      v: 1,
      stationId: 'rimkai',
      positions: [],
    })
    const result = parsePositions(text, 'rimkai')
    expect(result).toEqual({ status: 'bad-format' })
  })

  it('rejects when positions is not an array', () => {
    const text = JSON.stringify({
      kind: 'railapp-positions',
      v: 1,
      stationId: 'rimkai',
      positions: { id: 'sw-1', xPct: 0.1, yPct: 0.1 },
    })
    const result = parsePositions(text, 'rimkai')
    expect(result).toEqual({ status: 'bad-format' })
  })

  it('rejects when positions is missing entirely', () => {
    const text = JSON.stringify({ kind: 'railapp-positions', v: 1, stationId: 'rimkai' })
    const result = parsePositions(text, 'rimkai')
    expect(result).toEqual({ status: 'bad-format' })
  })
})
