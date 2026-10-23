// Mermaid C4 diagrams drawn to the diagram-design architecture type: hairline boxes with a type tag, dashed boundary
// zones, orthogonal connectors routed around the boxes with masked labels beside them, the system in scope takes the
// accent. Syntax that is not understood falls back to mermaid itself, see render()
var c4 = (() => {
  var KINDS = ['C4Context', 'C4Container', 'C4Component', 'C4Dynamic', 'C4Deployment']

  // macro -> what it draws; the arguments after the alias, in mermaid's order
  var SHAPES = {}
  ;[['Person', 'person', ['label', 'descr']],
    ['System', 'system', ['label', 'descr']], ['SystemDb', 'system', ['label', 'descr'], 'db'], ['SystemQueue', 'system', ['label', 'descr'], 'queue'],
    ['Container', 'container', ['label', 'techn', 'descr']], ['ContainerDb', 'container', ['label', 'techn', 'descr'], 'db'],
    ['ContainerQueue', 'container', ['label', 'techn', 'descr'], 'queue'],
    ['Component', 'component', ['label', 'techn', 'descr']], ['ComponentDb', 'component', ['label', 'techn', 'descr'], 'db'],
    ['ComponentQueue', 'component', ['label', 'techn', 'descr'], 'queue']
  ].forEach(([name, kind, args, store]) => {
    SHAPES[name] = {kind, args, store: store || '', ext: false}
    SHAPES[name + '_Ext'] = {kind, args, store: store || '', ext: true}
  })
  var BOUNDARIES = {
    Boundary: {type: '', args: ['label', 'type']},
    Enterprise_Boundary: {type: 'enterprise', args: ['label']},
    System_Boundary: {type: 'system', args: ['label']},
    Container_Boundary: {type: 'container', args: ['label']},
    Deployment_Node: {type: '', args: ['label', 'type', 'descr'], node: true},
    Node: {type: '', args: ['label', 'type', 'descr'], node: true},
    Node_L: {type: '', args: ['label', 'type', 'descr'], node: true},
    Node_R: {type: '', args: ['label', 'type', 'descr'], node: true}
  }
  var RELS = {
    Rel: '', BiRel: 'bi', Rel_Back: 'back', Rel_Neighbor: '',
    Rel_U: 'up', Rel_Up: 'up', Rel_D: 'down', Rel_Down: 'down', Rel_L: 'left', Rel_Left: 'left', Rel_R: 'right', Rel_Right: 'right'
  }

  // `a, "b, c", $x="y"` -> {list: ['a', 'b, c'], named: {x: 'y'}}
  var args = (s) => {
    var list = []
    var named = {}
    var cur = ''
    var quoted = false
    var push = () => {
      var v = cur.trim()
      cur = ''
      var found = /^\$(\w+)\s*=\s*([\s\S]*)$/.exec(v)
      if (found) named[found[1]] = unquote(found[2].trim())
      else list.push(unquote(v))
    }
    for (var i = 0; i < s.length; i++) {
      var c = s[i]
      if (c === '"') quoted = !quoted
      if (c === ',' && !quoted) push()
      else cur += c
    }
    if (cur.trim() || list.length) push()
    return {list, named}
  }
  var unquote = (v) => (/^"[\s\S]*"$/.test(v) ? v.slice(1, -1) : v).trim()

  var parse = (src) => {
    var lines = src.replace(/%%\{[\s\S]*?\}%%/g, '').split('\n')
    var model = {kind: '', title: '', root: {children: []}, elements: [], rels: [], shapeInRow: 4, boundaryInRow: 2}
    var stack = [model.root]
    var pending = null
    var skip = false
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].replace(/%%.*$/, '').trim()
      if (!line) continue
      if (!model.kind) {
        if (!KINDS.includes(line)) return null
        model.kind = line
        continue
      }
      if (skip) {
        skip = !line.includes('}')
        continue
      }
      var found
      if (/^acc(Title|Descr)\b/.test(line)) {
        skip = /\{\s*$/.test(line)
        continue
      }
      if ((found = /^title\s+(.*)$/i.exec(line))) {
        model.title = found[1].trim()
        continue
      }
      if (line === '{') {
        if (pending) stack.push(pending)
        pending = null
        continue
      }
      // a line may close one boundary or more
      if (/^\}+$/.test(line)) {
        for (var k = 0; k < line.length && stack.length > 1; k++) stack.pop()
        pending = null
        continue
      }
      found = /^(\w+)\s*\(([\s\S]*)\)\s*(\{)?\s*(\})?$/.exec(line)
      if (!found) continue
      pending = null
      var name = found[1]
      var a = args(found[2])
      var parent = stack[stack.length - 1]
      if (SHAPES[name]) {
        var spec = SHAPES[name]
        var el = {alias: a.list[0], kind: spec.kind, store: spec.store, ext: spec.ext, label: '', techn: '', descr: '', type: 'element'}
        spec.args.forEach((key, j) => (el[key] = a.list[j + 1] || a.named[key] || ''))
        if (!el.alias) continue
        model.elements.push(el)
        parent.children.push(el)
      }
      else if (BOUNDARIES[name]) {
        var b = BOUNDARIES[name]
        var box = {alias: a.list[0], label: '', type: 'boundary', kind: b.type, node: !!b.node, descr: '', children: []}
        b.args.forEach((key, j) => {
          var v = a.list[j + 1] || a.named[key] || ''
          if (key === 'type') box.kind = v || box.kind
          else box[key] = v
        })
        parent.children.push(box)
        if (found[3] && !found[4]) stack.push(box)
        else if (!found[3]) pending = box
      }
      else if (name === 'RelIndex') {
        model.rels.push({index: a.list[0], from: a.list[1], to: a.list[2], label: a.list[3] || '', techn: a.list[4] || a.named.techn || '', dir: ''})
      }
      else if (name in RELS) {
        var dir = RELS[name]
        var rel = {from: a.list[0], to: a.list[1], label: a.list[2] || '', techn: a.list[3] || a.named.techn || '', dir: dir === 'back' || dir === 'bi' ? '' : dir, bi: dir === 'bi'}
        if (dir === 'back') rel = Object.assign(rel, {from: rel.to, to: rel.from})
        model.rels.push(rel)
      }
      else if (name === 'UpdateRelStyle') {
        model.rels.filter((r) => r.from === a.list[0] && r.to === a.list[1] || r.bi && r.from === a.list[1] && r.to === a.list[0]).forEach((r) => {
          if (a.named.lineColor) r.lineColor = a.named.lineColor
          if (a.named.textColor) r.textColor = a.named.textColor
        })
      }
      else if (name === 'UpdateLayoutConfig') {
        var rows = parseInt(a.named.c4ShapeInRow, 10)
        var boxes = parseInt(a.named.c4BoundaryInRow, 10)
        if (rows > 0) model.shapeInRow = rows
        if (boxes > 0) model.boundaryInRow = boxes
      }
    }
    return model.kind && model.elements.length ? model : null
  }

  var esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]))
  var num = (v) => Math.round(v * 10) / 10
  var grid = (v) => Math.ceil(v / 4) * 4

  var ctx = (() => {
    try {
      return document.createElement('canvas').getContext('2d')
    }
    catch (err) {
      return null
    }
  })()
  var measure = (s, size, family, weight, spacing) =>
    (ctx ? (ctx.font = `${weight || 400} ${size}px ${family}`, ctx.measureText(s).width) : s.length * size * 0.6) + s.length * (spacing || 0)

  // words onto lines no wider than max, the last line ends in an ellipsis when the text is cut
  var wrap = (text, max, size, family, weight, limit) => {
    var lines = []
    var line = ''
    String(text).split(/\s+/).filter(Boolean).forEach((word) => {
      var next = line ? line + ' ' + word : word
      if (!line || measure(next, size, family, weight) <= max) line = next
      else {
        lines.push(line)
        line = word
      }
    })
    if (line) lines.push(line)
    if (lines.length > limit) {
      lines.length = limit
      var last = lines[limit - 1]
      while (last.length > 1 && measure(last + '…', size, family, weight) > max) last = last.slice(0, -1)
      lines[limit - 1] = last + '…'
    }
    return lines
  }

  // a polyline with rounded corners
  var round = (points, radius) => {
    var pts = points.filter((pt, i) => !i || pt[0] !== points[i - 1][0] || pt[1] !== points[i - 1][1])
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

  // the box metrics, in svg units, all on the 4px grid
  var MARGIN = 32
  var W = 200
  var GX = 128
  var GY = 104
  var PAD = 24
  var HEAD = 56
  var CLEAR = 12
  var STUB = 20

  var intersects = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

  // orthogonal routing on the sparse grid of interesting coordinates: box edges pushed out by the clearance, the
  // middle of every gap and a lane either side of it. Dijkstra over (point, heading) with a price on every bend,
  // on running along a line already drawn and on crossing one
  var router = (boxes, bounds) => {
    var used = []
    var blocked = (x1, y1, x2, y2) => boxes.some((b) => {
      var c = b.clear === undefined ? CLEAR : b.clear
      var r = {x: b.x - c, y: b.y - c, w: b.w + 2 * c, h: b.h + 2 * c}
      if (y1 === y2) return y1 > r.y && y1 < r.y + r.h && Math.max(x1, x2) > r.x && Math.min(x1, x2) < r.x + r.w
      return x1 > r.x && x1 < r.x + r.w && Math.max(y1, y2) > r.y && Math.min(y1, y2) < r.y + r.h
    })
    var axis = (edges, extra) => {
      var vals = new Set(extra)
      var sorted = [...new Set(edges)].sort((a, b) => a - b)
      sorted.forEach((v) => vals.add(v))
      for (var i = 1; i < sorted.length; i++) {
        var gap = sorted[i] - sorted[i - 1]
        if (gap < 8) continue
        var mid = (sorted[i] + sorted[i - 1]) / 2
        vals.add(mid)
        if (gap >= 40) [-16, 16].forEach((d) => vals.add(mid + d))
      }
      return [...vals].sort((a, b) => a - b)
    }
    // what a step costs beyond its length: overlapping or crossing a line routed before
    var penalty = (x1, y1, x2, y2) => {
      var p = 0
      used.forEach((s) => {
        if (y1 === y2 && s[1] === s[3]) {
          if (Math.abs(s[1] - y1) < 6) p += Math.max(0, Math.min(Math.max(x1, x2), Math.max(s[0], s[2])) - Math.max(Math.min(x1, x2), Math.min(s[0], s[2]))) * 6
        }
        else if (x1 === x2 && s[0] === s[2]) {
          if (Math.abs(s[0] - x1) < 6) p += Math.max(0, Math.min(Math.max(y1, y2), Math.max(s[1], s[3])) - Math.max(Math.min(y1, y2), Math.min(s[1], s[3]))) * 6
        }
        else if (y1 === y2) {
          if (s[0] > Math.min(x1, x2) && s[0] < Math.max(x1, x2) && y1 > Math.min(s[1], s[3]) && y1 < Math.max(s[1], s[3])) p += 24
        }
        else if (s[1] > Math.min(y1, y2) && s[1] < Math.max(y1, y2) && x1 > Math.min(s[0], s[2]) && x1 < Math.max(s[0], s[2])) p += 24
      })
      return p
    }
    var DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]]
    // from and to: {x, y, dir} where dir is the heading leaving the source stub / arriving at the target port
    var route = (from, to) => {
      var xs = axis(boxes.flatMap((b) => [b.x - (b.clear === undefined ? CLEAR : b.clear), b.x + b.w + (b.clear === undefined ? CLEAR : b.clear)]), [from.x, to.x, bounds.x, bounds.x + bounds.w])
      var ys = axis(boxes.flatMap((b) => [b.y - (b.clear === undefined ? CLEAR : b.clear), b.y + b.h + (b.clear === undefined ? CLEAR : b.clear)]), [from.y, to.y, bounds.y, bounds.y + bounds.h])
      var xi = new Map(xs.map((v, i) => [v, i]))
      var yi = new Map(ys.map((v, i) => [v, i]))
      var key = (i, j, d) => (j * xs.length + i) * 4 + d
      var dist = new Map()
      var prev = new Map()
      var heap = []
      var push = (c, k) => {
        heap.push([c, k])
        for (var n = heap.length - 1; n > 0;) {
          var p = (n - 1) >> 1
          if (heap[p][0] <= heap[n][0]) break
          var tmp = heap[p]
          heap[p] = heap[n]
          heap[n] = tmp
          n = p
        }
      }
      var pop = () => {
        var top = heap[0]
        var last = heap.pop()
        if (heap.length) {
          heap[0] = last
          for (var n = 0; ;) {
            var l = 2 * n + 1
            var r = l + 1
            var m = n
            if (l < heap.length && heap[l][0] < heap[m][0]) m = l
            if (r < heap.length && heap[r][0] < heap[m][0]) m = r
            if (m === n) break
            var tmp = heap[m]
            heap[m] = heap[n]
            heap[n] = tmp
            n = m
          }
        }
        return top
      }
      var si = xi.get(from.x)
      var sj = yi.get(from.y)
      var ti = xi.get(to.x)
      var tj = yi.get(to.y)
      var start = key(si, sj, from.dir)
      dist.set(start, 0)
      push(0, start)
      var best = null
      while (heap.length) {
        var [c, k] = pop()
        if (c > dist.get(k)) continue
        var d = k % 4
        var cell = (k - d) / 4
        var i = cell % xs.length
        var j = (cell - i) / xs.length
        if (i === ti && j === tj) {
          var finish = c + (d === to.dir ? 0 : (d + 2) % 4 === to.dir ? 1e6 : 40)
          if (!best || finish < best.c) best = {c: finish, k}
          continue
        }
        if (best && c > best.c) break
        DIRS.forEach(([dx, dy], nd) => {
          if ((nd + 2) % 4 === d) return
          var ni = i + dx
          var nj = j + dy
          if (ni < 0 || nj < 0 || ni >= xs.length || nj >= ys.length) return
          var x1 = xs[i]
          var y1 = ys[j]
          var x2 = xs[ni]
          var y2 = ys[nj]
          if (blocked(x1, y1, x2, y2)) return
          var nc = c + Math.abs(x2 - x1) + Math.abs(y2 - y1) + (nd === d ? 0 : 40) + penalty(x1, y1, x2, y2)
          var nk = key(ni, nj, nd)
          if (!dist.has(nk) || nc < dist.get(nk)) {
            dist.set(nk, nc)
            prev.set(nk, k)
            push(nc, nk)
          }
        })
      }
      if (!best) return null
      var pts = []
      for (var at = best.k; at !== undefined; at = prev.get(at)) {
        var cl = (at - at % 4) / 4
        var ci = cl % xs.length
        pts.unshift([xs[ci], ys[(cl - ci) / xs.length]])
      }
      return pts
    }
    var claim = (pts) => {
      for (var i = 1; i < pts.length; i++) used.push([pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]])
    }
    return {route, claim, used}
  }

  // c4 source -> svg markup, or '' when mermaid should draw it. t: the style tokens of mermaid.js
  var render = (src, t, fonts, id) => {
    var model = parse(src)
    if (!model) return ''
    var sans = fonts.sans
    var mono = fonts.mono
    var dark = t.paper === '#020202'
    var accentText = dark ? t.accent : '#bf4520'
    var byAlias = new Map(model.elements.map((e) => [e.alias, e]))
    var rels = model.rels.filter((r) => byAlias.has(r.from) && byAlias.has(r.to) && r.from !== r.to)

    // the focal: the system in scope of a context diagram, else the busiest element when it alone is the busiest
    var degree = new Map(model.elements.map((e) => [e, 0]))
    rels.forEach((r) => {
      degree.set(byAlias.get(r.from), degree.get(byAlias.get(r.from)) + 1)
      degree.set(byAlias.get(r.to), degree.get(byAlias.get(r.to)) + 1)
    })
    var inner = model.elements.filter((e) => !e.ext && !e.store && e.kind !== 'person')
    var focal = model.kind === 'C4Context' ? inner.find((e) => e.kind === 'system') : null
    if (!focal && inner.length) {
      var top = Math.max(...inner.map((e) => degree.get(e)))
      var busiest = inner.filter((e) => degree.get(e) === top)
      if (top > 0 && busiest.length === 1) focal = busiest[0]
    }

    // what each box says: a type tag, the name, the technology, the description
    model.elements.forEach((e) => {
      var word = e.store === 'db' ? 'DATABASE' : e.store === 'queue' ? 'QUEUE' : e.kind.toUpperCase()
      e.tag = (e.ext ? 'EXTERNAL ' : '') + word
      e.names = wrap(e.label || e.alias, W - 32, 12, sans, 600, 2)
      e.techs = e.techn ? wrap(e.techn, W - 32, 9, mono, 400, 1) : []
      e.descrs = e.descr ? wrap(e.descr, W - 32, 11, sans, 400, 3) : []
      e.top = e.store === 'db' ? 12 : 0
      e.need = e.top + 34 + e.names.length * 15 + (e.techs.length ? 14 : 0) + (e.descrs.length ? 4 + e.descrs.length * 14 : 0) + 12
    })
    var H = Math.max(80, grid(Math.max(...model.elements.map((e) => e.need))))

    // layout: elements in rows of shapeInRow, child boundaries below them in rows of boundaryInRow
    var place = (box) => {
      var shapes = box.children.filter((c) => c.type === 'element')
      var subs = box.children.filter((c) => c.type === 'boundary')
      subs.forEach(place)
      var cols = Math.min(shapes.length, model.shapeInRow)
      var w = cols ? cols * W + (cols - 1) * GX : 0
      var y = 0
      shapes.forEach((s, i) => {
        s.dx = (i % model.shapeInRow) * (W + GX)
        s.dy = Math.floor(i / model.shapeInRow) * (H + GY)
      })
      if (shapes.length) y = Math.ceil(shapes.length / model.shapeInRow) * (H + GY) - GY
      for (var i = 0; i < subs.length; i += model.boundaryInRow) {
        var row = subs.slice(i, i + model.boundaryInRow)
        if (y) y += GY
        var x = 0
        row.forEach((b) => {
          b.dx = x
          b.dy = y
          x += b.w + GX
        })
        w = Math.max(w, x - GX)
        y += Math.max(...row.map((b) => b.h))
      }
      box.cw = w
      box.ch = y
      if (box !== model.root) {
        box.caption = (box.label || box.alias).toUpperCase()
        box.tagText = box.kind ? `[${box.kind.toUpperCase()}]` : ''
        var capW = measure(box.caption, 8, mono, 500, 1.12) + (box.tagText ? 8 + measure(box.tagText, 8, mono, 400, 0.64) : 0)
        box.w = grid(Math.max(w, capW) + 2 * PAD)
        box.h = grid(y + HEAD + PAD)
      }
    }
    place(model.root)
    var y0 = MARGIN + (model.title ? 40 : 0)
    var abs = (box, x, y) => {
      box.children.forEach((c) => {
        var inset = box === model.root ? [0, 0] : [PAD, HEAD]
        c.x = x + inset[0] + c.dx
        c.y = y + inset[1] + c.dy
        if (c.type === 'element') {
          c.w = W
          c.h = H
        }
        else abs(c, c.x, c.y)
      })
    }
    abs(model.root, MARGIN, y0)
    var boundaries = []
    var collect = (box, depth) => box.children.forEach((c) => {
      if (c.type !== 'boundary') return
      c.depth = depth
      boundaries.push(c)
      collect(c, depth + 1)
    })
    collect(model.root, 0)
    var right = MARGIN + model.root.cw
    var bottom = y0 + model.root.ch

    // ports: the side each line leaves and enters by, from the direction hint or where the other box sits
    var boxes = model.elements
    var cx = (e) => e.x + e.w / 2
    var cy = (e) => e.y + e.h / 2
    var sides = new Map()
    var lines = rels.map((r, i) => {
      var a = byAlias.get(r.from)
      var b = byAlias.get(r.to)
      var dx = cx(b) - cx(a)
      var dy = cy(b) - cy(a)
      var s
      var e
      // a direction hint is kept only when the grid put the boxes that way round, a hint against it loops around
      if (r.dir === 'down' && dy > 0 || r.dir === 'up' && dy < 0) [s, e] = r.dir === 'down' ? ['bottom', 'top'] : ['top', 'bottom']
      else if (r.dir === 'right' && dx > 0 || r.dir === 'left' && dx < 0) [s, e] = r.dir === 'right' ? ['right', 'left'] : ['left', 'right']
      else if (Math.abs(dx) < W) [s, e] = dy > 0 ? ['bottom', 'top'] : ['top', 'bottom']
      else if (Math.abs(dy) < H) [s, e] = dx > 0 ? ['right', 'left'] : ['left', 'right']
      // off-axis: leave by the side facing the other column, arrive from above or below
      else [s, e] = [dx > 0 ? 'right' : 'left', dy > 0 ? 'top' : 'bottom']
      var line = {r, i, a, b, s, e}
      ;[[a, s, b], [b, e, a]].forEach(([n, side, other]) => {
        var k = n.alias + '|' + side
        if (!sides.has(k)) sides.set(k, [])
        sides.get(k).push({line, other, end: n === a ? 'from' : 'to'})
      })
      return line
    })
    // fan the ports of one side out at L * k / (N + 1), ordered by where the other end lies
    sides.forEach((list, k) => {
      var [alias, side] = k.split('|')
      var n = byAlias.get(alias)
      var flat = side === 'top' || side === 'bottom'
      list.sort((p, q) => (flat ? cx(p.other) - cx(q.other) : cy(p.other) - cy(q.other)))
      list.forEach((p, j) => {
        var len = flat ? n.w : n.h
        var at = Math.round(len * (j + 1) / (list.length + 1))
        var pt = flat
          ? [n.x + at, side === 'top' ? n.y : n.y + n.h]
          : [side === 'left' ? n.x : n.x + n.w, n.y + at]
        p.line[p.end] = pt
      })
    })
    var OUT = {right: [1, 0, 0], bottom: [0, 1, 1], left: [-1, 0, 2], top: [0, -1, 3]}
    var bounds = {x: MARGIN - 24, y: y0 - 24, w: right - MARGIN + 48, h: bottom - y0 + 48}
    // a boundary caption is kept clear of lines like a box
    var captions = boundaries.map((b) => ({clear: 6, x: b.x + 4, y: b.y + 8, w: measure(b.caption, 8, mono, 500, 1.12) + (b.tagText ? 8 + measure(b.tagText, 8, mono, 400, 0.64) : 0) + 16, h: 12}))
    var net = router(boxes.concat(captions), bounds)
    // running along a boundary edge reads as part of the frame: it costs like running along another line
    boundaries.forEach((b) => net.claim([[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h], [b.x, b.y]]))    // shortest first, so the long lines bend around the short ones
    lines.slice().sort((p, q) => Math.hypot(p.from[0] - p.to[0], p.from[1] - p.to[1]) - Math.hypot(q.from[0] - q.to[0], q.from[1] - q.to[1])).forEach((l) => {
      var so = OUT[l.s]
      var eo = OUT[l.e]
      var s0 = [l.from[0] + so[0] * STUB, l.from[1] + so[1] * STUB]
      var e0 = [l.to[0] + eo[0] * STUB, l.to[1] + eo[1] * STUB]
      var mid = net.route({x: s0[0], y: s0[1], dir: so[2]}, {x: e0[0], y: e0[1], dir: (eo[2] + 2) % 4})
      l.pts = [l.from].concat(mid || [s0, [s0[0], e0[1]], e0], [l.to])
      // drop the points that sit on a straight run
      l.pts = l.pts.filter((p, i, all) => {
        if (!i || i === all.length - 1) return true
        var a = all[i - 1]
        var b = all[i + 1]
        return !(a[0] === p[0] && p[0] === b[0] || a[1] === p[1] && p[1] === b[1])
      })
      net.claim(l.pts)
    })

    // labels: a masked block beside the longest free stretch of its line, never on a box, a caption or another label
    var taken = []
    boundaries.forEach((b) => taken.push({x: b.x, y: b.y, w: b.w, h: HEAD - 8}))
    var free = (r) => !boxes.some((b) => intersects(r, {x: b.x - 4, y: b.y - 4, w: b.w + 8, h: b.h + 8})) &&
      !taken.some((o) => intersects(r, o)) &&
      !net.used.some((s) => intersects(r, {x: Math.min(s[0], s[2]) - 2, y: Math.min(s[1], s[3]) - 2, w: Math.abs(s[2] - s[0]) + 4, h: Math.abs(s[3] - s[1]) + 4}))
    lines.forEach((l) => {
      var r = l.r
      if (!r.label && !r.techn && !r.index) return
      var chip = r.index ? 20 : 0
      var w1 = r.label ? measure(r.label, 9, mono, 400, 0.54) : 0
      var w2 = r.techn ? measure(`[${r.techn}]`, 8, mono, 400) : 0
      var w = Math.ceil(chip + Math.max(w1, w2)) + 8
      var h = r.label && r.techn ? 28 : 16
      var segs = []
      for (var i = 1; i < l.pts.length; i++) segs.push([l.pts[i - 1], l.pts[i]])
      segs.sort((p, q) => Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]) - Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]))
      var spot = null
      segs.some(([p, q]) => {
        var flat = p[1] === q[1]
        var len = Math.abs(flat ? q[0] - p[0] : q[1] - p[1])
        var tries = flat
          ? [[(p[0] + q[0]) / 2 - w / 2, p[1] - 8 - h], [(p[0] + q[0]) / 2 - w / 2, p[1] + 8]]
          : [[p[0] + 8, (p[1] + q[1]) / 2 - h / 2], [p[0] - 8 - w, (p[1] + q[1]) / 2 - h / 2]]
        if (len < (flat ? w : h) + 16) return false
        // slide along the segment when the middle is busy
        var steps = [0, -0.25, 0.25, -0.4, 0.4]
        return steps.some((f) => tries.some(([x, y]) => {
          var rect = flat ? {x: x + f * len, y, w, h} : {x, y: y + f * len, w, h}
          var lo = flat ? Math.min(p[0], q[0]) : Math.min(p[1], q[1])
          var hi = flat ? Math.max(p[0], q[0]) : Math.max(p[1], q[1])
          if (flat ? rect.x < lo || rect.x + w > hi : rect.y < lo || rect.y + h > hi) return false
          if (!free(rect)) return false
          spot = rect
          return true
        }))
      })
      if (!spot) {
        var [p, q] = segs[0]
        spot = {x: (p[0] + q[0]) / 2 + 8, y: (p[1] + q[1]) / 2 - h - 8, w, h}
      }
      taken.push(spot)
      l.label = spot
    })

    // a box is drawn whole: paper mask, the shape, the tag, the words
    var tone = (e) => (e === focal ? {fill: t.accentTint, stroke: t.accent, width: 1.2, tag: accentText}
      : e.ext ? {fill: `rgba(${t.inkRgb},0.03)`, stroke: `rgba(${t.inkRgb},0.30)`, width: 1, tag: t.soft}
        : e.store ? {fill: `rgba(${t.inkRgb},0.05)`, stroke: t.muted, width: 1, tag: t.muted}
          : {fill: t.node, stroke: t.ink, width: 1, tag: t.muted})
    var shape = (e, k) => {
      var w = e.w
      var h = e.h
      if (e.store === 'db') {
        return `<path d="M0,6A${w / 2},6 0 0 1 ${w},6V${h - 6}A${w / 2},6 0 0 1 0,${h - 6}Z" fill="${k.fill}" stroke="${k.stroke}" stroke-width="${k.width}"/>` +
          `<path d="M0,6A${w / 2},6 0 0 0 ${w},6" fill="none" stroke="${k.stroke}" stroke-width="${k.width}"/>`
      }
      if (e.store === 'queue') {
        return `<path d="M8,0H${w - 8}A8,${h / 2} 0 0 1 ${w - 8},${h}H8A8,${h / 2} 0 0 1 8,0Z" fill="${k.fill}" stroke="${k.stroke}" stroke-width="${k.width}"/>` +
          `<path d="M${w - 8},0A8,${h / 2} 0 0 0 ${w - 8},${h}" fill="none" stroke="${k.stroke}" stroke-width="${k.width}"/>`
      }
      return `<rect width="${w}" height="${h}" rx="6" fill="${k.fill}" stroke="${k.stroke}" stroke-width="${k.width}"/>`
    }
    var mask = (e) => (e.store === 'db'
      ? `<path d="M0,6A${e.w / 2},6 0 0 1 ${e.w},6V${e.h - 6}A${e.w / 2},6 0 0 1 0,${e.h - 6}Z" fill="${t.paper}"/>`
      : e.store === 'queue'
        ? `<path d="M8,0H${e.w - 8}A8,${e.h / 2} 0 0 1 ${e.w - 8},${e.h}H8A8,${e.h / 2} 0 0 1 8,0Z" fill="${t.paper}"/>`
        : `<rect width="${e.w}" height="${e.h}" rx="6" fill="${t.paper}"/>`)
    var nodes = model.elements.map((e) => {
      var k = tone(e)
      var mid = e.w / 2
      var tagW = Math.ceil(measure(e.tag, 8, mono, 500, 0.64)) + 12
      var tagX = e.store === 'queue' ? 16 : 10
      var tagY = 10 + e.top
      var g = [`<g class="node c4-node" id="${id}-c4-${esc(e.alias)}-0" transform="translate(${num(e.x)},${num(e.y)})">`,
        mask(e), shape(e, k),
        `<rect x="${tagX}" y="${tagY}" width="${tagW}" height="14" rx="2" fill="none" stroke="${k.tag}" stroke-opacity="0.5" stroke-width="0.8"/>`,
        `<text x="${tagX + tagW / 2}" y="${tagY + 7}" text-anchor="middle" dominant-baseline="central" font-family="${mono}" font-size="8" font-weight="500" letter-spacing="0.64" fill="${k.tag}">${esc(e.tag)}</text>`]
      if (e.kind === 'person') {
        // a small person glyph in the top right corner
        var px = e.w - 22
        var py = 10
        g.push(`<circle cx="${px + 6}" cy="${py + 4}" r="3.5" fill="none" stroke="${k.tag}" stroke-width="1"/>`,
          `<path d="M${px},${py + 15}a6,6 0 0 1 12,0" fill="none" stroke="${k.tag}" stroke-width="1"/>`)
      }
      // the words sit as one block in the space under the tag
      var block = e.names.length * 15 + (e.techs.length ? 14 : 0) + (e.descrs.length ? 4 + e.descrs.length * 14 : 0)
      var y = tagY + 14 + Math.max(8, (e.h - (tagY + 14) - 8 - block) / 2)
      e.names.forEach((line) => {
        y += 15
        g.push(`<text x="${mid}" y="${num(y - 3)}" text-anchor="middle" font-family="${sans}" font-size="12" font-weight="600" fill="${e === focal ? accentText : t.ink}">${esc(line)}</text>`)
      })
      e.techs.forEach((line) => {
        y += 14
        g.push(`<text x="${mid}" y="${num(y - 3)}" text-anchor="middle" font-family="${mono}" font-size="9" fill="${t.muted}">${esc(line)}</text>`)
      })
      if (e.descrs.length) y += 4
      e.descrs.forEach((line) => {
        y += 14
        g.push(`<text x="${mid}" y="${num(y - 3)}" text-anchor="middle" font-family="${sans}" font-size="11" fill="${t.muted}">${esc(line)}</text>`)
      })
      g.push('</g>')
      return g.join('')
    })

    // markers, one per line colour
    var colors = [...new Set([t.muted, ...lines.map((l) => l.r.lineColor).filter(Boolean)])]
    var marker = (c) => `${id}-c4-arrow-${colors.indexOf(c)}`
    var defs = colors.map((c) =>
      `<marker id="${marker(c)}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="${esc(c)}"/></marker>`)

    var body = []
    if (model.title) body.push(`<text x="${MARGIN}" y="${MARGIN + 14}" font-family="${sans}" font-size="16" font-weight="600" fill="${t.ink}">${esc(model.title)}</text>`)
    boundaries.forEach((b) => {
      var tagX = b.x + 12 + measure(b.caption, 8, mono, 500, 1.12) + 8
      body.push(`<g class="c4-boundary" data-alias="${esc(b.alias)}"><rect x="${num(b.x)}" y="${num(b.y)}" width="${b.w}" height="${b.h}" rx="8" fill="rgba(${t.inkRgb},0.02)" stroke="${t.ruleSolid}"${b.node ? '' : ' stroke-dasharray="4 4"'}/>` +
        `<text x="${num(b.x + 12)}" y="${num(b.y + 18)}" font-family="${mono}" font-size="8" font-weight="500" letter-spacing="1.12" fill="${t.soft}">${esc(b.caption)}</text>` +
        (b.tagText ? `<text x="${num(tagX)}" y="${num(b.y + 18)}" font-family="${mono}" font-size="8" letter-spacing="0.64" fill="${t.soft}" fill-opacity="0.8">${esc(b.tagText)}</text>` : '') + '</g>')
    })
    lines.forEach((l) => {
      var color = l.r.lineColor || t.muted
      var m = `url(#${marker(color)})`
      body.push(`<path class="c4-rel relationshipLine" id="${id}-c4-rel-${l.i}" data-from="${esc(l.r.from)}" data-to="${esc(l.r.to)}" d="${round(l.pts, 8)}" fill="none" ` +
        `stroke="${esc(color)}" stroke-width="1" marker-end="${m}"${l.r.bi ? ` marker-start="${m}"` : ''}/>`)
    })
    lines.forEach((l) => {
      var s = l.label
      if (!s) return
      var r = l.r
      var tx = s.x + 4 + (r.index ? 20 : 0)
      var g = [`<g class="edgeLabel c4-label" data-id="${id}-c4-rel-${l.i}"><rect x="${num(s.x)}" y="${num(s.y)}" width="${s.w}" height="${s.h}" rx="2" fill="${t.paper}"/>`]
      if (r.index) {
        g.push(`<circle cx="${num(s.x + 11)}" cy="${num(s.y + 8)}" r="7" fill="${t.paper}" stroke="${t.muted}"/>`,
          `<text x="${num(s.x + 11)}" y="${num(s.y + 8)}" text-anchor="middle" dominant-baseline="central" font-family="${mono}" font-size="8" fill="${t.ink}">${esc(r.index)}</text>`)
      }
      var y = s.y + 8
      if (r.label) {
        g.push(`<text x="${num(tx)}" y="${num(y)}" dominant-baseline="central" font-family="${mono}" font-size="9" letter-spacing="0.54" fill="${esc(r.textColor || t.muted)}">${esc(r.label)}</text>`)
        y += 12
      }
      if (r.techn) g.push(`<text x="${num(tx)}" y="${num(y)}" dominant-baseline="central" font-family="${mono}" font-size="8" fill="${t.soft}">[${esc(r.techn)}]</text>`)
      g.push('</g>')
      body.push(g.join(''))
    })

    var width = grid(Math.max(right, ...lines.flatMap((l) => l.pts.map((p) => p[0])), ...lines.filter((l) => l.label).map((l) => l.label.x + l.label.w)) + MARGIN)
    var height = grid(Math.max(bottom, ...lines.flatMap((l) => l.pts.map((p) => p[1])), ...lines.filter((l) => l.label).map((l) => l.label.y + l.label.h)) + MARGIN)
    var info = {nodes: {}, links: {}}
    model.elements.forEach((e) => {
      info.nodes[e.alias] = {name: e.label || e.alias, kind: e.tag, techn: e.techn, descr: e.descr, focal: e === focal}
    })
    lines.forEach((l) => {
      info.links[`rel-${l.i}`] = {from: l.r.from, to: l.r.to, label: l.r.label, techn: l.r.techn, index: l.r.index || ''}
    })
    var summary = `${model.title || model.kind}: ${model.elements.length} elements, ${lines.length} relationships` +
      (focal ? `, centred on ${focal.label || focal.alias}` : '')
    return [`<svg xmlns="http://www.w3.org/2000/svg" id="${id}" width="100%" style="max-width: ${width}px;" viewBox="0 0 ${width} ${height}" ` +
      `role="graphics-document document" aria-roledescription="c4" font-family="${esc(sans)}">`,
      `<title>${esc(model.title || model.kind)}</title><desc>${esc(summary)}</desc>`,
      `<defs>${defs.join('')}</defs>`, body.join(''), nodes.join(''),
      `<metadata class="c4-model">${esc(JSON.stringify(info))}</metadata>`, '</svg>'].join('')
  }

  return {parse, render}
})()
