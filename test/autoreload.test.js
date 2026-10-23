import {describe, expect, test} from 'bun:test'
import {load} from './load.js'

// Run content/autoreload.js against a stubbed chrome.runtime and capture the polling interval.
const start = (runtime, {protocol = 'file:', xhr} = {}) => {
  const calls = {cleared: 0, rendered: []}
  let poll = null
  const state = {reload: {ms: 1000, md: false}}
  load('content/autoreload.js', [], {
    state,
    chrome: {runtime},
    location: {protocol, href: protocol + '///doc.md'},
    render: (md) => calls.rendered.push(md),
    setInterval: (fn) => (poll = fn, 1),
    clearInterval: () => calls.cleared++,
    XMLHttpRequest: function () { return xhr || {} },
  })
  return {calls, poll: () => poll(), state}
}

describe('autoreload', () => {
  test('re-renders when the file changes', () => {
    let body = 'a'
    const {calls, poll, state} = start({id: 'ext', sendMessage: (msg, cb) => cb({body})})
    body = 'b'
    poll()
    expect(calls.rendered).toEqual(['b'])
    expect(state.reload.md).toBe(true)
    expect(calls.cleared).toBe(0)
  })

  test('stops polling once the extension context is invalidated', () => {
    let alive = true
    const runtime = {
      get id () { return alive ? 'ext' : undefined },
      sendMessage: (msg, cb) => {
        if (!alive) throw new Error('Extension context invalidated.')
        cb({body: 'a'})
      },
    }
    const {calls, poll} = start(runtime)
    alive = false
    expect(() => poll()).not.toThrow()
    expect(calls.cleared).toBe(1)
  })

  test('stops polling when sendMessage throws', () => {
    const {calls} = start({id: 'ext', sendMessage: () => { throw new Error('Extension context invalidated.') }})
    expect(calls.cleared).toBe(1)
  })

  test('stops polling when the background does not answer', () => {
    const {calls} = start({id: 'ext', lastError: {message: 'Receiving end does not exist.'}, sendMessage: (msg, cb) => cb(undefined)})
    expect(calls.cleared).toBe(1)
  })

  test('a failed fetch over http keeps the document and keeps polling', () => {
    const xhr = {open () {}, send () { this.onreadystatechange() }}
    const reply = (status, responseText) => Object.assign(xhr, {readyState: 4, status, responseText})
    reply(200, 'a')
    const {calls, poll} = start({}, {protocol: 'https:', xhr})
    for (const [status, text] of [[503, 'Service Unavailable'], [0, ''], [404, 'Not Found']]) {
      reply(status, text)
      poll()
    }
    expect(calls.rendered).toEqual([])
    reply(200, 'b')
    poll()
    expect(calls.rendered).toEqual(['b'])
    expect(calls.cleared).toBe(0)
  })
})
