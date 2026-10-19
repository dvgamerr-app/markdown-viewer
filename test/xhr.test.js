import {describe, expect, test} from 'bun:test'
import {load} from './load.js'

// Run background/xhr.js with a stubbed fetch and capture the URL it requests.
const request = async (url) => {
  const calls = []
  const md = {}
  load('background/xhr.js', [], {
    md,
    fetch: async (u, opts) => (calls.push({url: u, opts}), {text: async () => 'body'}),
  })
  const res = await new Promise((resolve) => {
    md.xhr().get(url, (err, body) => resolve({err, body}))
  })
  return {calls, res}
}

describe('background xhr', () => {
  test('file urls drop the cache-bust query and decode the drive colon', async () => {
    const {calls, res} = await request('file:///e%3A/.ourkk/docs/agent-harness.md?x=1#top')
    expect(calls[0].url).toBe('file:///e:/.ourkk/docs/agent-harness.md')
    expect(calls[0].opts).toEqual({cache: 'no-store'})
    expect(res).toEqual({err: null, body: 'body'})
  })

  test('http urls keep the cache-bust query', async () => {
    const {calls} = await request('http://localhost/doc.md')
    expect(calls[0].url).toMatch(/^http:\/\/localhost\/doc\.md\?preventCache=\d+$/)
  })
})
