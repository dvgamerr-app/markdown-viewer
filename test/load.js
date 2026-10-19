// Evaluate a content script with stubbed browser globals and return the names it declares.
// Content scripts are plain `var` declarations sharing one scope, so they are run as a function body.
import {readFileSync} from 'node:fs'
import {join} from 'node:path'

const root = join(import.meta.dir, '..')

export const stubs = (overrides = {}) => ({
  document: {
    readyState: 'loading',
    title: '',
    querySelector: () => null,
    getElementById: () => null,
    documentElement: {classList: {toggle () {}}},
    addEventListener () {},
  },
  window: {addEventListener () {}, innerHeight: 800},
  chrome: {runtime: {id: 'test', onMessage: {addListener () {}}, getURL: (path) => path, sendMessage () {}}},
  args: {theme: 'github', raw: false, themes: {width: 'auto'}, content: {}, compiler: 'markdown-it', custom: {}, icon: 'default'},
  m: Object.assign(() => ({}), {trust: (html) => html, mount () {}, redraw () {}}),
  setInterval: () => 0,
  clearInterval () {},
  setTimeout: () => 0,
  ...overrides,
})

export const load = (file, names, overrides) => {
  const globals = stubs(overrides)
  const source = readFileSync(join(root, file), 'utf8')
  const body = `${source}\n;return {${names.join(', ')}}`
  return new Function(...Object.keys(globals), body)(...Object.values(globals))
}
