import {describe, expect, test} from 'bun:test'
import {load} from './load.js'

const {timeline} = load('content/timeline.js', ['timeline'])
const light = {paper: '#f5f5f5', node: '#fff', ink: '#2d3142', muted: '#4f5d75', soft: '#7a8399', rule: 'rgba(0,0,0,.1)', ruleSolid: '#bfc0c0', accent: '#bf4520', accentTint: 'rgba(191,69,32,.08)', inkRgb: '45,49,66'}
const fonts = {sans: 'sans-serif', mono: 'monospace'}

const src = `timeline
  title Social
  section Early
    2002 : LinkedIn
    2004 : Facebook : Google : Orkut
  section Growth
    2010 : Instagram
         : Pinterest
`
const dots = (svg) => [...svg.matchAll(/<circle cx="([\d.]+)" cy="[\d.]+" r="[46]"/g)].map((m) => parseFloat(m[1]))
const info = (svg) => JSON.parse(/<metadata class="timeline-model">([^<]*)<\/metadata>/.exec(svg)[1].replaceAll('&quot;', '"').replaceAll('&amp;', '&'))

describe('timeline parse', () => {
  test('title, sections, periods and events', () => {
    const model = timeline.parse(src)
    expect(model.title).toBe('Social')
    expect(model.sections.map((s) => s.name)).toEqual(['Early', 'Growth'])
    expect(model.sections[0].periods[1]).toEqual({label: '2004', events: ['Facebook', 'Google', 'Orkut']})
  })

  test('a line that starts with a colon adds to the period above', () => {
    expect(timeline.parse(src).sections[1].periods[0].events).toEqual(['Instagram', 'Pinterest'])
  })

  test('comments, accessibility lines and a direction are ignored', () => {
    const model = timeline.parse('timeline LR\n%% x\naccTitle: t\naccDescr {\n  long\n}\nA : 1')
    expect(model.sections[0].periods).toEqual([{label: 'A', events: ['1']}])
  })

  test('anything else is left to mermaid', () => {
    expect(timeline.parse('flowchart LR\n A --> B')).toBeNull()
    expect(timeline.parse('timeline\n  title only')).toBeNull()
    expect(timeline.parse('timeline\n  : orphan')).toBeNull()
    expect(timeline.render('pie\n "a": 1', light, fonts, 't-0')).toBe('')
  })
})

describe('timeline render', () => {
  const svg = timeline.render(src, light, fonts, 't-1')

  test('a period per label, a baseline link between neighbours', () => {
    expect(svg).toContain('aria-roledescription="timeline"')
    expect(svg.match(/class="node timeline-period"/g)).toHaveLength(3)
    expect(svg).toContain('id="t-1-timeline-p2-0"')
    expect(svg.match(/class="timeline-line relationshipLine"/g)).toHaveLength(2)
    expect(svg).toContain('data-from="p0" data-to="p1"')
  })

  test('years are spaced by value', () => {
    const at = dots(svg)
    expect((at[1] - at[0]) / (at[2] - at[1])).toBeCloseTo(2 / 6, 1)
    expect(svg).toContain('Spacing is proportional to elapsed time.')
  })

  test('words are spaced evenly and need no spacing note', () => {
    const even = timeline.render('timeline\n  Alpha : a\n  Beta : b\n  Gamma : c', light, fonts, 't-2')
    const at = dots(even)
    expect(at[1] - at[0]).toBeCloseTo(at[2] - at[1], 1)
    expect(even).not.toContain('LEGEND')
  })

  test('the busiest period is the one major milestone', () => {
    const periods = svg.match(/<g class="node timeline-period".*?<\/g>/g)
    expect(periods.filter((g) => g.includes('r="6" fill="#bf4520"'))).toHaveLength(1)
    expect(svg).toContain('Busiest period')
    expect(info(svg).nodes.p1).toMatchObject({name: '2004', n: 2, major: true, gap: 2, prev: 'p0', next: 'p2'})
  })

  test('a tie has no milestone', () => {
    const flat = timeline.render('timeline\n  Q1 : a : b\n  Q2 : c : d', light, fonts, 't-3')
    expect(flat).not.toContain('#bf4520')
    expect(info(flat).nodes.p1.gap).toBeNull()
  })

  test('a crowded period shows a few events and counts the rest', () => {
    const many = timeline.render('timeline\n  2020 : a : b : c : d : e : f', light, fonts, 't-4')
    expect(many).toContain('+3 MORE')
    expect(info(many).nodes.p0.events).toHaveLength(6)
  })

  test('labels on one side never meet', () => {
    const wide = timeline.render('timeline\n  2000 : A very long event name\n  2001 : b\n  2002 : Another very long event name', light, fonts, 't-5')
    const at = dots(wide)
    const boxes = [...wide.matchAll(/class="timeline-hit" x="([\d.]+)" y="[\d.]+" width="(\d+)"/g)].map((m) => [parseFloat(m[1]), parseFloat(m[1]) + parseFloat(m[2])])
    expect(boxes[2][0]).toBeGreaterThan(boxes[0][1])
    expect(at[1] - at[0]).toBeCloseTo(at[2] - at[1], 1)
  })
})
