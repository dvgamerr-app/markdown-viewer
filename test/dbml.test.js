import {describe, expect, test} from 'bun:test'
import {load} from './load.js'

const {dbml} = load('content/dbml.js', ['dbml'])
const light = {paper: '#f5f5f5', node: '#fff', ink: '#2d3142', muted: '#4f5d75', soft: '#7a8399', rule: 'rgba(0,0,0,.1)', ruleSolid: '#bfc0c0', inkRgb: '45,49,66'}
const fonts = {sans: 'sans-serif', mono: 'monospace'}

describe('dbml parse', () => {
  const model = dbml.parse(`
    // comment
    Table users as U {
      id int [pk, increment]
      email varchar(255) [unique, not null, note: 'login']
      tags text[]
      indexes {
        (id, email) [unique, name: 'uq_users']
      }
    }
    Table billing.invoices [headercolor: #3498DB] {
      id uuid [pk]
      user_id int [ref: > users.id]
    }
    Enum kind {
      a
      b
    }
    Ref r1: billing.invoices.user_id > U.id [delete: cascade]
    Ref { users.id < billing.invoices.user_id }
  `)

  test('tables, schemas and aliases', () => {
    expect(model.tables.map((t) => `${t.schema}.${t.name}`)).toEqual(['public.users', 'billing.invoices'])
    expect(model.tables[0].alias).toBe('U')
    expect(model.tables[1].color).toBe('#3498DB')
  })

  test('column settings and types', () => {
    const [id, email, tags] = model.tables[0].cols
    expect(id.pk).toBe(true)
    expect(email).toMatchObject({type: 'varchar(255)', unique: true, notNull: true})
    expect(tags.type).toBe('text[]')
  })

  test('indexes', () => {
    expect(model.tables[0].indexes).toEqual([{cols: ['id', 'email'], unique: true, pk: false, name: 'uq_users'}])
  })

  test('refs keep the many side as the child', () => {
    expect(model.refs).toHaveLength(3)
    expect(model.refs[1].child.path).toEqual(['billing', 'invoices'])
    expect(model.refs[1].delete).toBe('cascade')
    expect(model.refs[2].child.path).toEqual(['billing', 'invoices'])
    expect(model.enums[0].values).toEqual(['a', 'b'])
  })
})

describe('dbml render', () => {
  const src = `
    Table a { id int [pk] }
    Table b { id int [pk]
      a_id int [not null, ref: > a.id] }
    Table s.c { id int [pk]
      b_id int [ref: > b.id] }
    Ref: s.c.b_id > b.id [delete: cascade]
  `
  const svg = dbml.render(src, light, fonts, 'x-1')

  test('draws a card per table and one line per pair of columns', () => {
    expect(svg).toContain('aria-roledescription="dbml"')
    expect(svg.match(/class="node dbml-table"/g)).toHaveLength(3)
    expect(svg.match(/class="dbml-link relationshipLine"/g)).toHaveLength(2)
    expect(svg).toContain('class="dbml-group"')
    expect(svg).toContain('ON DELETE CASCADE')
  })

  test('an unknown table is reported', () => {
    expect(() => dbml.render('Table a { id int }\nRef: a.id > nope.id', light, fonts, 'x-2')).toThrow(/unknown table "nope"/)
  })
})

describe('dbml popup data', () => {
  const src = `
    Table users {
      id int [pk, increment]
      name varchar(80) [not null, default: 'anon', note: 'display name']
      Note: 'People who can sign in'
    }
    Table posts {
      id int [pk]
      author_id int
      indexes {
        author_id [unique, name: 'uq_author']
      }
    }
    Ref: posts.author_id > users.id [delete: cascade]
  `
  const svg = dbml.render(src, light, fonts, 'x-3')
  const model = JSON.parse(/<metadata class="dbml-model">([^<]*)<\/metadata>/.exec(svg)[1].replaceAll('&quot;', '"').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&'))

  test('every table is a node the viewer can focus', () => {
    expect(svg).toContain('id="x-3-dbml-public.users-0"')
    expect(svg).toContain('id="x-3-dbml-public.posts-0"')
  })

  test('a link names its two tables', () => {
    expect(svg).toContain('data-from="public.posts" data-to="public.users"')
    expect(svg).toContain('class="edgeLabel"')
  })

  test('the model holds columns, notes and indexes', () => {
    expect(model.nodes['public.users'].note).toBe('People who can sign in')
    expect(model.nodes['public.users'].cols[0]).toMatchObject({name: 'id', inc: true, chips: ['PK']})
    expect(model.nodes['public.users'].cols[1]).toMatchObject({def: 'anon', note: 'display name'})
    expect(model.nodes['public.posts'].indexes).toEqual([{name: 'uq_author', cols: ['author_id'], unique: true}])
    expect(model.links['L-0']).toMatchObject({child: 'public.posts', parent: 'public.users', childCol: 'author_id', parentCol: 'id', label: 'ON DELETE CASCADE'})
  })
})
