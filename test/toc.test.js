import {describe, expect, test} from 'bun:test'
import {load} from './load.js'

const {toc} = load('content/index.js', ['toc'])

const links = (html) => [...html.matchAll(/<a href="#([^"]+)"[^>]*style="margin-left: calc\((\d+)rem - 0\.125rem\);">([^<]*)<\/a>/g)]
  .map(([, slug, depth, text]) => ({slug, depth: Number(depth), text}))

describe('toc.render (nimbus "on this page")', () => {
  test('renders nothing without headers', () => {
    expect(toc.render('<p>no headers</p>')).toBe('')
  })

  test('drops a single h1 page title and indents by depth', () => {
    const html = toc.render(
      '<h1 id="title">Title</h1>' +
      '<h2 id="overview">Overview</h2>' +
      '<h3 id="details">Details</h3>' +
      '<h2 id="faq">FAQ</h2>'
    )
    expect(html).toContain('<div class="_toc-title">On this page</div>')
    expect(html).toContain('<nav aria-label="Table of contents" class="_toc-nav">')
    expect(links(html)).toEqual([
      {slug: 'overview', depth: 0, text: 'Overview'},
      {slug: 'details', depth: 1, text: 'Details'},
      {slug: 'faq', depth: 0, text: 'FAQ'},
    ])
  })

  test('keeps h1 when there are several', () => {
    const html = toc.render('<h1 id="a">A</h1><h1 id="b">B</h1>')
    expect(links(html).map(({slug, depth}) => [slug, depth])).toEqual([['a', 0], ['b', 0]])
  })

  test('draws an S-curve at every indent change', () => {
    const html = toc.render('<h2 id="a">A</h2><h3 id="b">B</h3><h3 id="c">C</h3><h2 id="d">D</h2>')
    const curves = [...html.matchAll(/class="_toc-curve"[^>]*style="margin-left: calc\((\d+)rem - 0\.0625rem\); width: (\d+)rem;"><path d="([^"]+)"/g)]
      .map(([, from, width, d]) => ({from: Number(from), width: Number(width), d}))
    expect(curves).toEqual([
      {from: 0, width: 1, d: 'M 0 0 C 0 0.5, 1 0.5, 1 1'},
      {from: 0, width: 1, d: 'M 1 0 C 1 0.5, 0 0.5, 0 1'},
    ])
  })

  test('strips links inside header text', () => {
    const html = toc.render('<h2 id="x"><a href="#x">Linked</a> title</h2>')
    expect(links(html)[0].text).toBe('Linked title')
  })
})
