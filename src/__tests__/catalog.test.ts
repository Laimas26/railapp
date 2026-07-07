import { describe, it, expect } from 'vitest'
import { buildCatalogTree } from '../utils/catalog'
import type { InspectionPoint } from '../types'

function makePoint(id: string, baseCode: string): InspectionPoint {
  return {
    id,
    baseCode,
    variant: null,
    description: `Task ${id}`,
    elementTypes: ['switch'],
    trackClassFilter: 'all',
    requiredTags: [],
    periodicity: 'Kartą per savaitę',
    requiresMeasurements: false,
    measurementDefs: [],
  }
}

describe('buildCatalogTree – grouping', () => {
  it('groups points into sections and subsections by code', () => {
    const points = [
      makePoint('4.1.1a', '4.1.1'),
      makePoint('4.2.1', '4.2.1'),
      makePoint('5.1.1', '5.1.1'),
    ]
    const tree = buildCatalogTree(points)

    expect(tree.map((s) => s.code)).toEqual(['4', '5'])
    expect(tree[0].subsections.map((s) => s.code)).toEqual(['4.1', '4.2'])
    expect(tree[1].subsections.map((s) => s.code)).toEqual(['5.1'])
  })

  it('applies section and subsection titles from the maps', () => {
    const tree = buildCatalogTree([makePoint('4.1.1a', '4.1.1')])
    expect(tree[0].title).toBe('Iešmai')
    expect(tree[0].subsections[0].title).toBe('Bendrieji darbai')
  })

  it('falls back to the code itself for unknown titles', () => {
    const tree = buildCatalogTree([makePoint('9.3.1', '9.3.1')])
    expect(tree[0].title).toBe('9')
    expect(tree[0].subsections[0].title).toBe('9.3')
  })
})

describe('buildCatalogTree – sorting', () => {
  it('sorts sections numerically ascending', () => {
    const tree = buildCatalogTree([
      makePoint('5.1.1', '5.1.1'),
      makePoint('4.1.1', '4.1.1'),
    ])
    expect(tree.map((s) => s.code)).toEqual(['4', '5'])
  })

  it('sorts subsections numerically (4.10 after 4.2)', () => {
    const tree = buildCatalogTree([
      makePoint('4.10.1', '4.10.1'),
      makePoint('4.2.1', '4.2.1'),
      makePoint('4.1.1', '4.1.1'),
    ])
    expect(tree[0].subsections.map((s) => s.code)).toEqual(['4.1', '4.2', '4.10'])
  })

  it('sorts points within a subsection numerically incl. variants', () => {
    const tree = buildCatalogTree([
      makePoint('4.1.10', '4.1.10'),
      makePoint('4.1.2a', '4.1.2'),
      makePoint('4.1.1b', '4.1.1'),
      makePoint('4.1.1a', '4.1.1'),
    ])
    expect(tree[0].subsections[0].points.map((p) => p.id)).toEqual([
      '4.1.1a',
      '4.1.1b',
      '4.1.2a',
      '4.1.10',
    ])
  })
})

describe('buildCatalogTree – taskCount', () => {
  it('counts all points in a section across subsections', () => {
    const tree = buildCatalogTree([
      makePoint('4.1.1a', '4.1.1'),
      makePoint('4.1.1b', '4.1.1'),
      makePoint('4.2.1', '4.2.1'),
      makePoint('5.1.1', '5.1.1'),
    ])
    expect(tree[0].code).toBe('4')
    expect(tree[0].taskCount).toBe(3)
    expect(tree[1].code).toBe('5')
    expect(tree[1].taskCount).toBe(1)
  })
})

describe('buildCatalogTree – robustness', () => {
  it('handles a single-part baseCode (subsection code == section code)', () => {
    const tree = buildCatalogTree([makePoint('4', '4')])
    expect(tree[0].code).toBe('4')
    expect(tree[0].subsections[0].code).toBe('4')
    expect(tree[0].subsections[0].points.map((p) => p.id)).toEqual(['4'])
    expect(tree[0].taskCount).toBe(1)
  })

  it('returns an empty array for no points', () => {
    expect(buildCatalogTree([])).toEqual([])
  })
})
