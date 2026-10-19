import {describe, expect, test} from 'bun:test'
import {load} from './load.js'

const {anchors, frontmatter, _escape} = load('content/index.js', ['anchors', 'frontmatter', '_escape'])

describe('anchors', () => {
  test('adds a link anchor to every header with an id', () => {
    const html = anchors('<h2 id="setup">Setup</h2><p>text</p><h3 id="usage">Usage</h3>')
    expect(html).toContain('<h2 id="setup"><a class="anchor" name="setup" href="#setup">')
    expect(html).toContain('<h3 id="usage"><a class="anchor" name="usage" href="#usage">')
    expect(html.match(/octicon-link/g)).toHaveLength(2)
  })

  test('leaves headers without an id untouched', () => {
    expect(anchors('<h2>Plain</h2>')).toBe('<h2>Plain</h2>')
  })
})

describe('frontmatter', () => {
  test('strips yaml frontmatter and uses its title', () => {
    const document = {title: '', readyState: 'loading', querySelector: () => null}
    const {frontmatter: strip} = load('content/index.js', ['frontmatter'], {document})
    expect(strip('---\ntitle: Hello\n---\n# Body').trim()).toBe('# Body')
    expect(document.title).toBe('Hello')
  })

  test('strips toml frontmatter', () => {
    expect(frontmatter('+++\ntitle = "Hello"\n+++\n# Body').trim()).toBe('# Body')
  })

  test('returns markdown without frontmatter unchanged', () => {
    expect(frontmatter('# Title\n\ntext')).toBe('# Title\n\ntext')
  })
})

describe('_escape', () => {
  test('escapes html special characters', () => {
    expect(_escape('<a href="x">&</a>')).toBe('&lt;a href="x"&gt;&amp;&lt;/a&gt;')
  })
})
