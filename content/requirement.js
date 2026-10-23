// Mermaid requirement diagrams drawn to the diagram-design box grammar: a card per requirement or element with a mono
// type tag over its name and a hairline over its fields, laid out top down in ranks, relations as orthogonal elbows with
// a tracked mono label beside them. High risk takes the accent. Syntax that is not understood falls back to mermaid
// itself, see render()
var requirement = (() => {
  var KINDS = {
    requirement: 'REQUIREMENT',
    functionalrequirement: 'FUNCTIONAL REQUIREMENT',
    interfacerequirement: 'INTERFACE REQUIREMENT',
    performancerequirement: 'PERFORMANCE REQUIREMENT',
    physicalrequirement: 'PHYSICAL REQUIREMENT',
    designconstraint: 'DESIGN CONSTRAINT',
    element: 'ELEMENT'
  }
  var RELATIONS = ['contains', 'copies', 'derives', 'satisfies', 'verifies', 'refines', 'traces']
  // a copy, derivation, refinement or trace is a looser tie than containment, satisfaction or verification
  var DASHED = ['copies', 'derives', 'refines', 'traces']

  var unquote = (s) => s.trim().replace(/^"(.*)"$/, '$1').trim()

  var parse = (src) => {
    var lines = draw.lines(src)
    if (!lines) return null
    var model = {nodes: [], links: []}
    var head = false
    var block = null
    var skip = false
    var NAME = '("[^"]+"|[^\\s{}]+)'
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].replace(/%%.*$/, '').trim()
      if (!line) continue
      if (!head) {
        if (!/^requirementDiagram$/.test(line)) return null
        head = true
        continue
      }
      if (skip) {
        skip = !line.includes('}')
        continue
      }
      var found
      if (block) {
        if (line === '}') {
          block = null
          continue
        }
        if (!(found = /^(\w+)\s*:\s*(.*)$/.exec(line))) return null
        var key = found[1].toLowerCase()
        var value = unquote(found[2])
        var fields = block.kind === 'element' ? ['type', 'docref'] : ['id', 'text', 'risk', 'verifymethod']
        if (!fields.includes(key)) return null
        block[key === 'verifymethod' ? 'verify' : key] = value
        continue
      }
      // markdown strings are mermaid's to draw
      if (line.includes('`')) return null
      if (/^direction\s+TB$/i.test(line)) continue
      if (/^acc(Title|Descr)\b/.test(line)) {
        skip = /\{\s*$/.test(line) && !line.includes('}')
        continue
      }
      if ((found = new RegExp(`^(\\w+)\\s+${NAME}\\s*\\{\\s*$`).exec(line)) && KINDS[found[1].toLowerCase()]) {
        var kind = found[1].toLowerCase()
        var name = unquote(found[2])
        if (model.nodes.some((n) => n.name === name)) return null
        block = {name, kind: kind === 'element' ? 'element' : 'requirement', tag: KINDS[kind]}
        model.nodes.push(block)
        continue
      }
      // a - satisfies -> b, or the same written backwards: b <- satisfies - a
      if ((found = new RegExp(`^${NAME}\\s*-\\s*(\\w+)\\s*->\\s*${NAME}$`).exec(line))) {
        model.links.push({from: unquote(found[1]), type: found[2].toLowerCase(), to: unquote(found[3])})
      }
      else if ((found = new RegExp(`^${NAME}\\s*<-\\s*(\\w+)\\s*-\\s*${NAME}$`).exec(line))) {
        model.links.push({from: unquote(found[3]), type: found[2].toLowerCase(), to: unquote(found[1])})
      }
      // direction, style, classDef, class and anything else: mermaid draws it
      else return null
      if (!RELATIONS.includes(model.links[model.links.length - 1].type)) return null
    }
    if (!head || block) return null
    // a relation may name a box that was never declared, mermaid draws it as a bare element
    model.links.forEach((l) => [l.from, l.to].forEach((name) => {
      if (!model.nodes.some((n) => n.name === name)) model.nodes.push({name, kind: 'element', tag: 'ELEMENT'})
    }))
    return model.nodes.length ? model : null
  }

  var {esc, num, grid, measure, wrap} = draw

  // a polyline with rounded corners
  var round = (points, radius) => {
    var pts = points.filter((pt, i) => !i || pt[0] !== points[i - 1][0] || pt[1] !== points[i - 1][1])
    pts = pts.filter((pt, i) => i === 0 || i === pts.length - 1 ||
      !((pt[0] === pts[i - 1][0] && pt[0] === pts[i + 1][0]) || (pt[1] === pts[i - 1][1] && pt[1] === pts[i + 1][1])))
    var d = `M${num(pts[0][0])},${num(pts[0][1])}`
    for (var i = 1; i < pts.length - 1; i++) {
      var prev = pts[i - 1]
      var cur = pts[i]
      var next = pts[i + 1]
      var l1 = Math.hypot(cur[0] - prev[0], cur[1] - prev[1])
      var l2 = Math.hypot(next[0] - cur[0], next[1] - cur[1])
      var r = Math.min(radius, l1 / 2, l2 / 2)
      d += `L${num(cur[0] + (prev[0] - cur[0]) * r / l1)},${num(cur[1] + (prev[1] - cur[1]) * r / l1)}` +
        `Q${num(cur[0])},${num(cur[1])} ${num(cur[0] + (next[0] - cur[0]) * r / l2)},${num(cur[1] + (next[1] - cur[1]) * r / l2)}`
    }
    return d + `L${num(pts[pts.length - 1][0])},${num(pts[pts.length - 1][1])}`
  }

  // the card metrics, on the 4px grid
  var WIDTHS = [160, 180, 200, 240, 320]
  var PAD = 12
  var LABEL = 56
  var HEAD = 48
  var LINE = 16
  var ROWPAD = 10
  var MARGIN = 32
  var GAP_X = 48
  var GAP_Y = 96
  var LANE = 12

  // requirement source -> svg markup, or '' when mermaid should draw it. t: the style tokens of mermaid.js
  var render = (src, t, fonts, id) => {
    var model = parse(src)
    if (!model) return ''
    var sans = fonts.sans
    var mono = fonts.mono
    // the light accent is a bright orange for marks, text on paper needs the darker one
    var accentText = t.accentText
    var high = model.nodes.filter((n) => /^high$/i.test(n.risk || ''))
    // the accent goes to at most two cards, more high risks than that share an ink chip
    var hot = high.length && high.length <= 2

    // cards: rows of label and value, wrapped to the narrowest allowed width that holds them
    var byName = new Map()
    model.nodes.forEach((n) => {
      byName.set(n.name, n)
      var rows = n.kind === 'element'
        ? [['TYPE', n.type, 'text'], ['DOCREF', n.docref, 'ref']]
        : [['ID', n.id, 'id'], ['TEXT', n.text, 'text'], ['RISK', n.risk, 'risk'], ['VERIFY', n.verify && n.verify[0].toUpperCase() + n.verify.slice(1), 'text']]
      n.rows = rows.filter((r) => r[1]).map(([label, value, role]) => ({label, value, role}))
      var valueW = (r) => (r.role === 'risk' ? measure(r.value.toUpperCase(), 8, mono, 500, 1) + 12
        : r.role === 'text' ? measure(r.value, 11, sans) : measure(r.value, 10, mono))
      var need = Math.max(
        PAD + measure(n.tag, 8, mono, 500, 1.44) + PAD,
        PAD + measure(n.name, 13, sans, 600) + PAD,
        ...n.rows.map((r) => PAD + LABEL + valueW(r) + PAD))
      n.w = WIDTHS.find((w) => w >= need) || WIDTHS[WIDTHS.length - 1]
      var room = n.w - PAD - LABEL - PAD
      n.rows.forEach((r) => {
        r.lines = r.role === 'risk' ? [r.value.toUpperCase()]
          : wrap(r.value, room, r.role === 'text' ? 11 : 10, r.role === 'text' ? sans : mono, 400, 3)
      })
      n.nameShown = wrap(n.name, n.w - 2 * PAD, 13, sans, 600, 1)[0]
      var count = n.rows.reduce((sum, r) => sum + r.lines.length, 0)
      n.h = grid(count ? HEAD + ROWPAD + count * LINE + ROWPAD - 4 : HEAD)
      n.out = []
      n.in = []
    })

    // relations: a cycle is broken by turning its closing edge around for the layout only
    var links = model.links.filter((l) => l.from !== l.to).map((l, i) => ({
      key: 'L-' + i, type: l.type, from: byName.get(l.from), to: byName.get(l.to), flip: false
    }))
    var state = new Map()
    var visit = (n) => {
      state.set(n, 1)
      links.forEach((l) => {
        if (l.from !== n) return
        if (state.get(l.to) === 1) l.flip = true
        else if (!state.get(l.to)) visit(l.to)
      })
      state.set(n, 2)
    }
    model.nodes.forEach((n) => state.get(n) || visit(n))
    links.forEach((l) => {
      l.top = l.flip ? l.to : l.from
      l.bottom = l.flip ? l.from : l.to
      l.from.out.push(l.key)
      l.to.in.push(l.key)
    })

    // ranks: the longest path from a source
    model.nodes.forEach((n) => (n.rank = 0))
    for (var pass = 0, moved = true; moved && pass <= model.nodes.length; pass++) {
      moved = false
      links.forEach((l) => {
        if (l.bottom.rank <= l.top.rank) {
          l.bottom.rank = l.top.rank + 1
          moved = true
        }
      })
    }
    var depth = Math.max(...model.nodes.map((n) => n.rank)) + 1
    var ranks = Array.from({length: depth}, () => [])
    model.nodes.forEach((n) => ranks[n.rank].push(n))

    // a relation that skips ranks gets a dummy per rank it crosses, so it runs down a lane of its own
    var chains = links.map((l) => {
      var chain = [l.top]
      for (var r = l.top.rank + 1; r < l.bottom.rank; r++) {
        var dummy = {dummy: true, rank: r, w: 0, link: l}
        ranks[r].push(dummy)
        chain.push(dummy)
      }
      chain.push(l.bottom)
      l.chain = chain
      return chain
    })
    var up = new Map()
    var down = new Map()
    ranks.flat().forEach((v) => {
      up.set(v, [])
      down.set(v, [])
    })
    chains.forEach((chain) => chain.forEach((v, i) => {
      if (i) up.get(v).push(chain[i - 1])
      if (i < chain.length - 1) down.get(v).push(chain[i + 1])
    }))

    // order within a rank: barycenter sweeps, down then up
    var order = () => ranks.forEach((rank) => rank.forEach((v, i) => (v.order = i)))
    order()
    var sweep = (rank, near) => {
      var key = new Map(rank.map((v) => {
        var list = near.get(v)
        return [v, list.length ? list.reduce((s, o) => s + o.order, 0) / list.length : v.order]
      }))
      rank.sort((a, b) => key.get(a) - key.get(b) || a.order - b.order)
      rank.forEach((v, i) => (v.order = i))
    }
    for (var s = 0; s < 6; s++) {
      for (var r = 1; r < depth; r++) sweep(ranks[r], up)
      for (r = depth - 2; r >= 0; r--) sweep(ranks[r], down)
    }

    // x: pack each rank, then pull it toward the centres of its neighbours, keeping the gaps
    var sep = (a, b) => (a.dummy && b.dummy ? 16 : a.dummy || b.dummy ? 28 : GAP_X)
    var centre = (v) => v.x + v.w / 2
    var place = (rank, want) => {
      rank.forEach((v, i) => {
        var min = i ? rank[i - 1].x + rank[i - 1].w + sep(rank[i - 1], v) : -Infinity
        v.x = Math.max(want(v) - v.w / 2, min)
      })
      // the forward pass only pushes right, shift the rank back so it sits on its targets on average
      var shift = rank.reduce((sum, v) => sum + (want(v) - centre(v)), 0) / rank.length
      rank.forEach((v) => (v.x += shift))
    }
    ranks.forEach((rank) => place(rank, (v) => {
      var i = rank.indexOf(v)
      return i ? centre(rank[i - 1]) + rank[i - 1].w / 2 + sep(rank[i - 1], v) + v.w / 2 : v.w / 2
    }))
    var pull = (near) => (v) => {
      var list = near(v)
      return list.length ? list.reduce((sum, o) => sum + centre(o), 0) / list.length : centre(v)
    }
    for (s = 0; s < 8; s++) {
      for (r = 1; r < depth; r++) place(ranks[r], pull((v) => up.get(v)))
      for (r = depth - 2; r >= 0; r--) place(ranks[r], pull((v) => down.get(v)))
      // a rank of one box keeps its neighbours in both directions in view
      for (r = 0; r < depth; r++) place(ranks[r], pull((v) => up.get(v).concat(down.get(v))))
    }
    var left = Math.min(...ranks.flat().map((v) => v.x))
    ranks.flat().forEach((v) => (v.x = MARGIN + Math.round((v.x - left) / 4) * 4))

    // the channel between two ranks holds one horizontal lane per relation that changes column there
    var segs = []
    chains.forEach((chain, c) => chain.slice(1).forEach((v, i) => segs.push({link: links[c], u: chain[i], v, gap: chain[i].rank})))
    // fan the ends out along a box edge, ordered by where the other end lies
    var fan = (box, list, side) => {
      list.sort((a, b) => centre(side === 'out' ? a.v : a.u) - centre(side === 'out' ? b.v : b.u))
      list.forEach((sg, k) => (sg[side] = box.x + Math.round(box.w * (k + 1) / (list.length + 1) / 4) * 4))
    }
    model.nodes.forEach((n) => {
      fan(n, segs.filter((sg) => sg.u === n), 'out')
      fan(n, segs.filter((sg) => sg.v === n), 'in')
    })
    segs.forEach((sg) => {
      if (sg.u.dummy) sg.out = sg.u.x
      if (sg.v.dummy) sg.in = sg.v.x
    })
    // a short jog between two ends that face each other is noise: run the line straight when both edges have room
    var free = (box, side, x, self) => segs.every((o) => o === self || (side === 'out' ? o.u : o.v) !== box || Math.abs(o[side] - x) >= 12)
    var span = (v) => (v.dummy ? [v.x, v.x] : [v.x + 12, v.x + v.w - 12])
    segs.forEach((sg) => {
      if (sg.out === sg.in) return
      var a = span(sg.u)
      var b = span(sg.v)
      var lo = Math.max(a[0], b[0])
      var hi = Math.min(a[1], b[1])
      if (lo > hi) return
      // the point of the overlap nearest to where the line already leaves
      var x = Math.round(Math.min(Math.max((sg.out + sg.in) / 2, lo), hi) / 4) * 4
      if (x < lo || x > hi) x = sg.u.dummy ? sg.u.x : sg.v.dummy ? sg.v.x : x
      if ((sg.u.dummy || free(sg.u, 'out', x, sg)) && (sg.v.dummy || free(sg.v, 'in', x, sg))) sg.out = sg.in = x
    })
    var gaps = Array.from({length: Math.max(0, depth - 1)}, (_, g) => {
      var bends = segs.filter((sg) => sg.gap === g && sg.out !== sg.in)
      // lanes: left-going bends high to low, right-going low to high, so the bends of one fan do not cross
      bends.sort((a, b) => (a.in - a.out) - (b.in - b.out) || a.out - b.out)
      return {bends, h: Math.max(GAP_Y, 64 + bends.length * LANE)}
    })
    var y = MARGIN
    ranks.forEach((rank, r) => {
      var h = Math.max(...rank.map((v) => v.h || 0))
      rank.forEach((v) => {
        v.y = y
        v.rankH = h
      })
      y += h
      if (gaps[r]) {
        gaps[r].top = y
        var start = y + 16
        gaps[r].bends.forEach((sg, k) => (sg.lane = start + k * LANE))
        y += gaps[r].h
      }
    })
    var right =Math.max(...ranks.flat().map((v) => v.x + v.w))

    // routes: down out of a box, along a lane, down into the next box; a dummy is a straight pass through its rank
    links.forEach((l) => {
      var pts = []
      segs.filter((sg) => sg.link === l).forEach((sg) => {
        var y0 = sg.u.dummy ? sg.u.y : sg.u.y + sg.u.h
        if (sg.u.dummy) pts.push([sg.out, sg.u.y + sg.u.rankH])
        else pts.push([sg.out, y0])
        if (sg.lane !== undefined) pts.push([sg.out, sg.lane], [sg.in, sg.lane])
        pts.push([sg.in, sg.v.y])
      })
      l.pts = pts
      l.d = round(pts, 8)
    })

    // labels: tracked mono caps on a paper mask beside a vertical run, clear of boxes, lanes and other labels
    var boxes = model.nodes.map((n) => ({x: n.x - 4, y: n.y - 4, w: n.w + 8, h: n.h + 8}))
    var placed = []
    var hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
    var runs = []
    links.forEach((l) => l.pts.slice(1).forEach((p, i) => {
      var a = l.pts[i]
      runs.push({l, x0: Math.min(a[0], p[0]), x1: Math.max(a[0], p[0]), y0: Math.min(a[1], p[1]), y1: Math.max(a[1], p[1])})
    }))
    var crosses = (rect, l) => runs.some((run) => run.l !== l && hit(rect, {x: run.x0 - 2, y: run.y0 - 2, w: run.x1 - run.x0 + 4, h: run.y1 - run.y0 + 4}))
    links.forEach((l) => {
      var text = l.type.toUpperCase()
      var w = measure(text, 8, mono, 500, 1)
      var h = 12
      var verticals = []
      l.pts.slice(1).forEach((p, i) => {
        var a = l.pts[i]
        if (a[0] === p[0] && Math.abs(p[1] - a[1]) >= h + 8) verticals.push({x: a[0], y0: Math.min(a[1], p[1]), y1: Math.max(a[1], p[1])})
      })
      // the run into the target first, it says what reaches the box
      verticals.reverse()
      var options = []
      verticals.forEach((v) => [1, -1].forEach((dir) => {
        var mid = (v.y0 + v.y1) / 2
        ;[0, -1, 1].forEach((k) => {
          var cy = Math.min(Math.max(mid + k * (h + 4), v.y0 + h / 2 + 2), v.y1 - h / 2 - 2)
          options.push({x: dir > 0 ? v.x + 8 : v.x - 8 - w, y: cy - h / 2, w, h, anchor: dir > 0 ? 'start' : 'end', tx: dir > 0 ? v.x + 8 : v.x - 8, cy})
        })
      }))
      var pick = options.find((o) => !boxes.some((b) => hit(o, b)) && !placed.some((p) => hit(o, p)) && !crosses(o, l)) ||
        options.find((o) => !boxes.some((b) => hit(o, b)) && !placed.some((p) => hit(o, p))) || options[0]
      if (pick) {
        placed.push({x: pick.x - 2, y: pick.y, w: pick.w + 4, h: pick.h})
        l.label = Object.assign({text}, pick)
      }
    })
    placed.forEach((p) => (right = Math.max(right, p.x + p.w)))
    var minX = Math.min(MARGIN, ...placed.map((p) => p.x))
    var offset = minX < MARGIN ? grid(MARGIN - minX) : 0
    var width = grid(right + offset + MARGIN)
    var height = grid(Math.max(...model.nodes.map((n) => n.y + n.h)) + MARGIN)

    // draw: lines first so they sit behind the cards, then the label masks, then the cards
    var out = [
      `<svg xmlns="http://www.w3.org/2000/svg" id="${id}" width="100%" style="max-width: ${width}px;" viewBox="0 0 ${width} ${height}" ` +
      `role="graphics-document document" aria-roledescription="requirement" font-family="${esc(sans)}">`
    ]
    var summary = `Requirement diagram: ${model.nodes.filter((n) => n.kind === 'requirement').length} requirements, ` +
      `${model.nodes.filter((n) => n.kind === 'element').length} elements, ${links.length} relations` +
      (high.length ? `, high risk: ${high.map((n) => n.name).join(', ')}` : '')
    out.push(`<title>Requirement diagram</title><desc>${esc(summary)}</desc>`,
      `<defs><marker id="${id}-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto-start-reverse">` +
      `<path d="M0,0L10,5L0,10z" fill="${t.muted}"/></marker>` +
      `<marker id="${id}-contains" viewBox="0 0 14 14" refX="1" refY="7" markerWidth="14" markerHeight="14" markerUnits="userSpaceOnUse" orient="auto">` +
      `<circle cx="7" cy="7" r="6" fill="${t.paper}" stroke="${t.muted}"/><path d="M7,3V11M3,7H11" stroke="${t.muted}"/></marker></defs>`,
      `<g transform="translate(${offset},0)">`)
    links.forEach((l) => {
      var contains = l.type === 'contains'
      // the line is drawn top down; the end that is the source gets the circle-plus, the target the arrow
      var ends = contains
        ? (l.flip ? `marker-end="url(#${id}-contains)"` : `marker-start="url(#${id}-contains)"`)
        : (l.flip ? `marker-start="url(#${id}-arrow)"` : `marker-end="url(#${id}-arrow)"`)
      out.push(`<path class="req-link relationshipLine" id="${id}-${l.key}" data-from="${esc(l.from.name)}" data-to="${esc(l.to.name)}" d="${l.d}" fill="none" ` +
        `stroke="${t.muted}" stroke-width="1"${DASHED.includes(l.type) ? ' stroke-dasharray="5 4"' : ''} ${ends}/>`)
    })
    links.forEach((l) => {
      if (!l.label) return
      var lb = l.label
      out.push(`<g class="edgeLabel"><rect x="${num(lb.x - 2)}" y="${num(lb.y)}" width="${num(lb.w + 4)}" height="${lb.h}" fill="${t.paper}"/>` +
        `<text data-id="${l.key}" x="${num(lb.tx)}" y="${num(lb.cy)}" text-anchor="${lb.anchor}" dominant-baseline="central" font-family="${mono}" font-size="8" font-weight="500" letter-spacing="1" fill="${t.muted}">${esc(lb.text)}</text></g>`)
    })
    // a wide invisible stroke on top of every line, so a line is easy to point at
    links.forEach((l) => out.push(`<path class="req-hit-line" data-link="${l.key}" d="${l.d}" fill="none" stroke="transparent" stroke-width="12"/>`))

    model.nodes.forEach((n) => {
      var element = n.kind === 'element'
      var fill = element ? `rgba(${t.inkRgb},0.03)` : t.node
      var stroke = element ? `rgba(${t.inkRgb},0.30)` : t.ink
      var g = [`<g class="node req-box" id="${id}-req-${esc(n.name)}-0" transform="translate(${num(n.x)},${num(n.y)})">`,
        `<rect class="req-bg" width="${n.w}" height="${n.h}" rx="6" fill="${t.paper}"/>`,
        `<rect class="req-fill" width="${n.w}" height="${n.h}" rx="6" fill="${fill}"/>`,
        '<g class="req-body">',
        `<text x="${PAD}" y="19" font-family="${mono}" font-size="8" font-weight="500" letter-spacing="1.44" fill="${t.soft}">${esc(n.tag)}</text>`,
        `<text x="${PAD}" y="36" font-family="${sans}" font-size="13" font-weight="600" fill="${t.ink}">${esc(n.nameShown)}</text>`]
      if (n.rows.length) g.push(`<path d="M0,${HEAD}H${n.w}" stroke="${element ? `rgba(${t.inkRgb},0.18)` : t.ruleSolid}"/>`)
      var yy = HEAD + ROWPAD
      n.rows.forEach((row) => {
        g.push(`<text x="${PAD}" y="${yy + 11}" font-family="${mono}" font-size="8" letter-spacing="1" fill="${t.soft}">${row.label}</text>`)
        if (row.role === 'risk') {
          var level = row.lines[0]
          var accent = level === 'HIGH' && hot
          var cw = num(measure(level, 8, mono, 500, 1) + 12)
          g.push(`<rect x="${PAD + LABEL}" y="${yy + 1}" width="${cw}" height="14" rx="2" fill="${accent ? t.accentTint : level === 'HIGH' ? `rgba(${t.inkRgb},0.06)` : 'none'}" ` +
            `stroke="${accent ? t.accent : level === 'HIGH' ? t.ink : t.ruleSolid}"/>`,
          `<text x="${num(PAD + LABEL + cw / 2)}" y="${yy + 8}" text-anchor="middle" dominant-baseline="central" font-family="${mono}" font-size="8" font-weight="500" letter-spacing="1" ` +
            `fill="${accent ? accentText : level === 'HIGH' ? t.ink : t.muted}">${esc(level)}</text>`)
        }
        else {
          row.lines.forEach((line, k) => g.push(row.role === 'text'
            ? `<text x="${PAD + LABEL}" y="${yy + 11 + k * LINE}" font-family="${sans}" font-size="11" fill="${t.ink}">${esc(line)}</text>`
            : `<text x="${PAD + LABEL}" y="${yy + 11 + k * LINE}" font-family="${mono}" font-size="10" fill="${row.role === 'ref' ? t.link || t.muted : t.ink}">${esc(line)}</text>`))
        }
        yy += row.lines.length * LINE
      })
      g.push('</g>', `<rect class="req-border" width="${n.w}" height="${n.h}" rx="6" fill="none" stroke="${stroke}" stroke-width="1"/>`, '</g>')
      out.push(g.join(''))
    })
    out.push('</g>')

    // what the popup of the viewer shows: the fields of every box and the relations through it
    var info = {nodes: {}, links: {}}
    model.nodes.forEach((n) => {
      info.nodes[n.name] = {
        kind: n.kind, tag: n.tag, name: n.name, id: n.id || '', text: n.text || '', risk: n.risk || '', verify: n.verify || '',
        type: n.type || '', docref: n.docref || '', out: n.out, in: n.in
      }
    })
    links.forEach((l) => (info.links[l.key] = {from: l.from.name, to: l.to.name, type: l.type}))
    out.push(`<metadata class="requirement-model">${esc(JSON.stringify(info))}</metadata>`, '</svg>')
    return out.join('')
  }

  return {parse, render}
})()
