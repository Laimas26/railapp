import { describe, it, expect } from 'vitest'
import { matchesPoint } from '../utils/match'
import type { SchematicElement, InspectionPoint } from '../types'

// ---------------------------------------------------------------------------
// Factories — build minimal valid objects with sensible defaults
// ---------------------------------------------------------------------------

function makeElement(overrides: Partial<SchematicElement> = {}): SchematicElement {
  return {
    id: 'sw-1',
    stationId: 'rimkai',
    elementNumber: '1',
    elementType: 'switch',
    trackClass: 'main',
    svgElementId: 'g-sw-1',
    label: 'Switch 1',
    tags: [],
    ...overrides,
  }
}

function makePoint(overrides: Partial<InspectionPoint> = {}): InspectionPoint {
  return {
    id: '4.1.2a',
    baseCode: '4.1.2',
    variant: 'a',
    description: 'Iešmo apžiūra',
    elementTypes: ['switch'],
    trackClassFilter: 'all',
    requiredTags: [],
    requiresMeasurements: false,
    measurementDefs: [],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// trackClassFilter
// ---------------------------------------------------------------------------

describe('matchesPoint – trackClassFilter', () => {
  it("filter 'all' matches a main-track element", () => {
    const el = makeElement({ trackClass: 'main' })
    const pt = makePoint({ trackClassFilter: 'all' })
    expect(matchesPoint(el, pt)).toBe(true)
  })

  it("filter 'all' matches an other-track element", () => {
    const el = makeElement({ trackClass: 'other' })
    const pt = makePoint({ trackClassFilter: 'all' })
    expect(matchesPoint(el, pt)).toBe(true)
  })

  it("filter 'main' matches a main-track element", () => {
    const el = makeElement({ trackClass: 'main' })
    const pt = makePoint({ trackClassFilter: 'main' })
    expect(matchesPoint(el, pt)).toBe(true)
  })

  it("filter 'main' rejects an other-track element", () => {
    const el = makeElement({ trackClass: 'other' })
    const pt = makePoint({ trackClassFilter: 'main' })
    expect(matchesPoint(el, pt)).toBe(false)
  })

  it("filter 'other' matches an other-track element", () => {
    const el = makeElement({ trackClass: 'other' })
    const pt = makePoint({ trackClassFilter: 'other' })
    expect(matchesPoint(el, pt)).toBe(true)
  })

  it("filter 'other' rejects a main-track element", () => {
    const el = makeElement({ trackClass: 'main' })
    const pt = makePoint({ trackClassFilter: 'other' })
    expect(matchesPoint(el, pt)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// elementType filtering
// ---------------------------------------------------------------------------

describe('matchesPoint – elementType', () => {
  it('matches when element type is in point.elementTypes', () => {
    const el = makeElement({ elementType: 'switch' })
    const pt = makePoint({ elementTypes: ['switch'] })
    expect(matchesPoint(el, pt)).toBe(true)
  })

  it('rejects when element type is not in point.elementTypes', () => {
    const el = makeElement({ elementType: 'signal' })
    const pt = makePoint({ elementTypes: ['switch'] })
    expect(matchesPoint(el, pt)).toBe(false)
  })

  it('matches when element type is one of several listed types', () => {
    const el = makeElement({ elementType: 'track' })
    const pt = makePoint({ elementTypes: ['switch', 'signal', 'track'] })
    expect(matchesPoint(el, pt)).toBe(true)
  })

  it('rejects when element type is absent from a multi-type list', () => {
    const el = makeElement({ elementType: 'track' })
    const pt = makePoint({ elementTypes: ['switch', 'signal'] })
    expect(matchesPoint(el, pt)).toBe(false)
  })

  it('always rejects when elementTypes is empty (edge case)', () => {
    const el = makeElement({ elementType: 'switch' })
    const pt = makePoint({ elementTypes: [] })
    expect(matchesPoint(el, pt)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// requiredTags
// ---------------------------------------------------------------------------

describe('matchesPoint – requiredTags', () => {
  it('empty requiredTags matches an element with no tags', () => {
    const el = makeElement({ tags: [] })
    const pt = makePoint({ requiredTags: [] })
    expect(matchesPoint(el, pt)).toBe(true)
  })

  it('empty requiredTags matches an element that has tags', () => {
    const el = makeElement({ tags: ['motorised'] })
    const pt = makePoint({ requiredTags: [] })
    expect(matchesPoint(el, pt)).toBe(true)
  })

  it('all required tags present → matches', () => {
    const el = makeElement({ tags: ['motorised', 'heated'] })
    const pt = makePoint({ requiredTags: ['motorised', 'heated'] })
    expect(matchesPoint(el, pt)).toBe(true)
  })

  it('element has all required tags plus extras (superset) → still matches', () => {
    const el = makeElement({ tags: ['motorised', 'heated', 'remote'] })
    const pt = makePoint({ requiredTags: ['motorised', 'heated'] })
    expect(matchesPoint(el, pt)).toBe(true)
  })

  it('element missing one required tag → rejects', () => {
    const el = makeElement({ tags: ['motorised'] })
    const pt = makePoint({ requiredTags: ['motorised', 'heated'] })
    expect(matchesPoint(el, pt)).toBe(false)
  })

  it('element has no tags but point requires tags → rejects', () => {
    const el = makeElement({ tags: [] })
    const pt = makePoint({ requiredTags: ['motorised'] })
    expect(matchesPoint(el, pt)).toBe(false)
  })

  it('completely different tags → rejects', () => {
    const el = makeElement({ tags: ['heated'] })
    const pt = makePoint({ requiredTags: ['motorised'] })
    expect(matchesPoint(el, pt)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Combined / interaction tests
// ---------------------------------------------------------------------------

describe('matchesPoint – combined rules', () => {
  it('correct type + correct class + all tags → true', () => {
    const el = makeElement({ elementType: 'switch', trackClass: 'main', tags: ['motorised'] })
    const pt = makePoint({
      elementTypes: ['switch'],
      trackClassFilter: 'main',
      requiredTags: ['motorised'],
    })
    expect(matchesPoint(el, pt)).toBe(true)
  })

  it('correct type + wrong class blocks match even when tags are ok', () => {
    const el = makeElement({ elementType: 'switch', trackClass: 'other', tags: ['motorised'] })
    const pt = makePoint({
      elementTypes: ['switch'],
      trackClassFilter: 'main',
      requiredTags: ['motorised'],
    })
    expect(matchesPoint(el, pt)).toBe(false)
  })

  it('wrong type blocks match even when class and tags are ok', () => {
    const el = makeElement({ elementType: 'signal', trackClass: 'main', tags: [] })
    const pt = makePoint({
      elementTypes: ['switch'],
      trackClassFilter: 'main',
      requiredTags: [],
    })
    expect(matchesPoint(el, pt)).toBe(false)
  })

  it('correct type + correct class + missing tag blocks match', () => {
    const el = makeElement({ elementType: 'switch', trackClass: 'main', tags: [] })
    const pt = makePoint({
      elementTypes: ['switch'],
      trackClassFilter: 'main',
      requiredTags: ['motorised'],
    })
    expect(matchesPoint(el, pt)).toBe(false)
  })
})
