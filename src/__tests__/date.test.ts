import { describe, it, expect } from 'vitest'
import { localDateKey, formatDateTime } from '../utils/date'

// ---------------------------------------------------------------------------
// localDateKey
// ---------------------------------------------------------------------------

describe('localDateKey', () => {
  it('returns a string matching YYYY-MM-DD format', () => {
    const result = localDateKey()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('defaults to today when called with no argument', () => {
    const now = new Date()
    // Build the expected string the same way the implementation does
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    expect(localDateKey()).toBe(expected)
  })

  it('zero-pads single-digit month (January → 01)', () => {
    // new Date(year, monthIndex, day) uses LOCAL time
    const result = localDateKey(new Date(2024, 0, 15))
    expect(result).toBe('2024-01-15')
  })

  it('zero-pads single-digit day (5th → 05)', () => {
    const result = localDateKey(new Date(2024, 5, 5)) // June 5
    expect(result).toBe('2024-06-05')
  })

  it('formats December 31 correctly', () => {
    const result = localDateKey(new Date(2024, 11, 31))
    expect(result).toBe('2024-12-31')
  })

  it('formats February 1 with zero-padded month and day', () => {
    const result = localDateKey(new Date(2024, 1, 1))
    expect(result).toBe('2024-02-01')
  })

  it('uses LOCAL calendar day — new Date(y,m,d) constructor is local so result is always the right day', () => {
    // new Date(2025, 0, 15) is midnight LOCAL time on January 15 2025.
    // UTC-equivalent timestamp will differ from local by the tz offset, but
    // getDate() / getMonth() / getFullYear() return local values, so the
    // formatted key must still be "2025-01-15" regardless of the host timezone.
    const local = new Date(2025, 0, 15)
    expect(localDateKey(local)).toBe('2025-01-15')
  })

  it('does NOT use UTC — getUTCDate() would differ from getDate() in non-UTC zones, but function uses local', () => {
    // Construct a date at local midnight; the UTC representation may be
    // the previous or next calendar day depending on the offset.
    const local = new Date(2024, 5, 1) // June 1 local midnight
    const result = localDateKey(local)
    // The local day must be '01', month '06' — even if UTC date differs.
    expect(result).toMatch(/^2024-06-01$/)
  })

  it('handles year 2000 (epoch boundary sanity)', () => {
    const result = localDateKey(new Date(2000, 0, 1))
    expect(result).toBe('2000-01-01')
  })

  it('handles future dates', () => {
    const result = localDateKey(new Date(2099, 11, 31))
    expect(result).toBe('2099-12-31')
  })
})

// ---------------------------------------------------------------------------
// formatDateTime
// ---------------------------------------------------------------------------

describe('formatDateTime', () => {
  it('returns a non-empty string', () => {
    const result = formatDateTime(Date.now())
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('includes the 4-digit year from the timestamp', () => {
    // January 15 2024 noon UTC — the year 2024 must appear in the output
    const ts = new Date(2024, 0, 15, 12, 0, 0).getTime()
    const result = formatDateTime(ts)
    expect(result).toContain('2024')
  })

  it('includes the two-digit minute component', () => {
    // Use a time where minutes are a distinctive value (42)
    const ts = new Date(2024, 5, 10, 14, 42, 0).getTime()
    const result = formatDateTime(ts)
    expect(result).toContain('42')
  })

  it('does not throw for timestamp 0 (Unix epoch)', () => {
    expect(() => formatDateTime(0)).not.toThrow()
  })

  it('does not throw for a large future timestamp', () => {
    const future = new Date(2099, 11, 31, 23, 59).getTime()
    expect(() => formatDateTime(future)).not.toThrow()
  })

  it('produces a different string for two different timestamps', () => {
    const ts1 = new Date(2024, 0, 1, 8, 0).getTime()
    const ts2 = new Date(2024, 0, 2, 8, 0).getTime()
    expect(formatDateTime(ts1)).not.toBe(formatDateTime(ts2))
  })
})
