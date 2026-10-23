// Mermaid git graphs drawn to the diagram-design swimlane: one lane per branch with its name on a mono tab, commits as
// dots on the lane, branch-offs and merges as rounded right-angle elbows, ids in mono under each commit and tags as
// accent chips that stack instead of colliding. The main branch is ink, the others take the series palette, the
// accent is kept for highlighted commits and tags. Syntax that is not understood falls back to mermaid, see render()
var gitgraph = (() => {
  var TYPES = ['NORMAL', 'REVERSE', 'HIGHLIGHT']

  // `key: "value"` or `key: value` pairs after a command
  var attrs = (text) => {
    var out = {}
    var re = /(\w+)\s*:\s*(?:"([^"]*)"|([^\s"]+))/g
    var found
    while ((found = re.exec(text))) out[found[1].toLowerCase()] = found[2] !== undefined ? found[2] : found[3]
    return out
  }

  var unquote = (s) => s.replace(/^"(.*)"$/, '$1')

  // a short stable id in the shape mermaid gives a commit, `<seq>-<7 hex>`, so ids do not change between renders
  var hash = (s) => {
    var h = 0x811c9dc5
    for (var i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0
    return ('0000000' + h.toString(16)).slice(-7)
  }

  var parse = (src) => {
    var text = src.replace(/\r/g, '')
    var title = ''
    // front matter: a title is fine, any configuration is left to mermaid
    var front = /^\s*---\n([\s\S]*?)\n---\s*\n/.exec(text)
    if (front) {
      if (/^\s*config\s*:/m.test(front[1])) return null
      var named = /^\s*title\s*:\s*(.*)$/m.exec(front[1])
      title = named ? unquote(named[1].trim()) : ''
      text = text.slice(front[0].length)
    }
    var lines = draw.lines(text)
    if (!lines) return null
    var model = {title, dir: 'LR', branches: [], commits: []}
    var branches = {}
    var byId = {}
    var current = 'main'
    var head = false
    var skip = false
    var addBranch = (name, order, from) => {
      branches[name] = {name, order, index: model.branches.length, head: from}
      model.branches.push(branches[name])
    }
    addBranch('main', undefined, null)
    var add = (commit) => {
      var seq = model.commits.length
      commit.seq = seq
      commit.branch = current
      commit.id = commit.id || `${seq}-${hash(`${seq}|${current}|${commit.parents.join(',')}`)}`
      if (byId[commit.id]) return false
      if (commit.type && !TYPES.includes(commit.type)) return false
      commit.type = commit.type || 'NORMAL'
      byId[commit.id] = commit
      model.commits.push(commit)
      branches[current].head = commit.id
      return true
    }
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].replace(/%%.*$/, '').trim()
      if (!line) continue
      if (!head) {
        var start = /^gitGraph(?:\s+(LR|TB|BT))?\s*:?\s*$/i.exec(line)
        if (!start) return null
        model.dir = (start[1] || 'LR').toUpperCase()
        if (model.dir === 'BT') return null
        head = true
        continue
      }
      if (skip) {
        skip = !line.includes('}')
        continue
      }
      var found
      if (/^acc(Title|Descr)\b/.test(line)) {
        skip = /\{\s*$/.test(line)
      }
      else if ((found = /^commit\b(.*)$/i.exec(line))) {
        var a = attrs(found[1])
        var parent = branches[current].head
        if (!add({id: a.id, tag: a.tag || '', type: a.type && a.type.toUpperCase(), msg: a.msg || '', parents: parent ? [parent] : []})) return null
      }
      else if ((found = /^branch\s+("[^"]+"|[^\s"]+)(.*)$/i.exec(line))) {
        var name = unquote(found[1])
        if (branches[name]) return null
        var order = attrs(found[2]).order
        addBranch(name, order !== undefined ? parseFloat(order) : undefined, branches[current].head)
        current = name
      }
      else if ((found = /^(?:checkout|switch)\s+("[^"]+"|[^\s"]+)\s*$/i.exec(line))) {
        var to = unquote(found[1])
        if (!branches[to]) return null
        current = to
      }
      else if ((found = /^merge\s+("[^"]+"|[^\s"]+)(.*)$/i.exec(line))) {
        var from = unquote(found[1])
        var ma = attrs(found[2])
        if (!branches[from] || from === current) return null
        var ours = branches[current].head
        var theirs = branches[from].head
        if (!ours || !theirs || ours === theirs) return null
        if (!add({id: ma.id, tag: ma.tag || '', type: ma.type && ma.type.toUpperCase(), merge: from, parents: [ours, theirs]})) return null
      }
      else if ((found = /^cherry-pick\b(.*)$/i.exec(line))) {
        var ca = attrs(found[1])
        var picked = byId[ca.id]
        var base = branches[current].head
        if (!picked || picked.branch === current || !base) return null
        if (!add({tag: ca.tag || '', cherry: picked.id, parents: [base]})) return null
      }
      else return null
    }
    return head && model.commits.length ? model : null
  }

  var {esc, num, grid, measure, fit} = draw

  // an orthogonal polyline with every corner rounded at r=8, less where a leg is too short for it
  var rounded = (points) => {
    var d = `M${num(points[0].x)},${num(points[0].y)}`
    for (var i = 1; i < points.length - 1; i++) {
      var a = points[i - 1]
      var p = points[i]
      var b = points[i + 1]
      var r = Math.min(8, Math.hypot(p.x - a.x, p.y - a.y) / 2, Math.hypot(b.x - p.x, b.y - p.y) / 2)
      var inX = Math.sign(p.x - a.x)
      var inY = Math.sign(p.y - a.y)
      var outX = Math.sign(b.x - p.x)
      var outY = Math.sign(b.y - p.y)
      d += `L${num(p.x - inX * r)},${num(p.y - inY * r)}Q${num(p.x)},${num(p.y)} ${num(p.x + outX * r)},${num(p.y + outY * r)}`
    }
    var last = points[points.length - 1]
    return d + `L${num(last.x)},${num(last.y)}`
  }

  var MARGIN = 32
  var TAB = 20
  var STEP = 40
  var ROW = 32
  var CHIP = 16
  var LABEL = 112

  // git graph source -> svg markup, or '' when mermaid should draw it. t: the style tokens of mermaid.js
  var render = (src, t, fonts, id) => {
    var model = parse(src)
    if (!model) return ''
    var sans = fonts.sans
    var mono = fonts.mono
    var lr = model.dir === 'LR'
    var accent = t.accent
    // the light accent is a bright orange for marks, text on paper needs the darker one
    var accentText = t.accentText
    var series = t.series || [t.muted]
    // a branch never wears the accent, in the dark skin one of the series colours is the accent itself
    var palette = [series[1], series[0], series[2], series[3], series[4]].filter((c) => c && c.toLowerCase() !== String(accent).toLowerCase())
    if (!palette.length) palette = [t.muted]

    // lanes: explicit order first, then the order branches were made in, main keeps the top
    var lanes = model.branches.slice().sort((a, b) =>
      (a.order !== undefined ? a.order : a.index) - (b.order !== undefined ? b.order : b.index) || a.index - b.index)
    var lane = {}
    lanes.forEach((b, i) => {
      lane[b.name] = i
      b.color = b.name === 'main' ? t.ink : palette[(b.index - 1 + palette.length) % palette.length]
    })
    var byId = {}
    // the key the dom and the metadata use: an id may hold any character, two that clean to one key get a suffix
    var keys = {}
    model.commits.forEach((c) => {
      byId[c.id] = c
      var base = c.id.replace(/[^\w-]/g, '_')
      c.key = base
      for (var n = 2; keys[c.key]; n++) c.key = `${base}_${n}`
      keys[c.key] = true
      c.lane = lane[c.branch]
      c.color = lanes[c.lane].color
      // cross-lane segments leaving each side of the dot, -1 toward the lane before, +1 toward the next. Several on
      // one side fan out 12px apart so no two share a stroke
      c.cross = {'-1': 0, 1: 0}
      c.label = c.cherry ? `pick ${c.cherry}` : c.id
    })

    // connectors: the first parent on another lane is a branch-off, a second parent a merge, a pick a dashed link
    var links = []
    model.commits.forEach((c) => {
      var first = c.parents[0] && byId[c.parents[0]]
      if (first) {
        var off = first.lane !== c.lane
        var side = Math.sign(c.lane - first.lane)
        links.push({kind: off ? 'branch' : 'line', from: first, to: c, color: c.color, fan: off ? first.cross[side] * 12 : 0})
        if (off) first.cross[side]++
      }
      var other = c.parents[1] && byId[c.parents[1]]
      if (other) {
        links.push({kind: 'merge', from: other, to: c, color: other.color})
        c.cross[Math.sign(other.lane - c.lane)]++
      }
      if (c.cherry) {
        var pick = byId[c.cherry]
        links.push({kind: 'cherry', from: pick, to: c, color: t.muted})
        c.cross[Math.sign(pick.lane - c.lane)]++
      }
    })

    var tabW = lanes.map((b) => grid(measure(b.name, 9, mono, 600) + 20))
    model.commits.forEach((c) => {
      c.text = fit(c.label, LABEL, 8, mono, 400, 0.48)
      c.w = measure(c.text, 8, mono, 400, 0.48)
      c.chip = c.tag ? fit(c.tag, LABEL, 8, mono, 500, 0.48) : ''
      c.chipW = c.tag ? grid(measure(c.chip, 8, mono, 500, 0.48) + 12) : 0
    })

    var body = []
    var top = MARGIN
    if (model.title) {
      body.push(`<text x="${MARGIN}" y="${top + 14}" font-family="${sans}" font-size="16" font-weight="600" fill="${t.ink}">${esc(model.title)}</text>`)
      top += 40
    }
    var pos = {}
    var laneAt = []
    var right = 0
    var bottom = 0

    if (lr) {
      // left to right: each commit moves right until its id clears the last label on its lane and on any lane a
      // merge or pick would cross at its x
      var start = MARGIN + Math.max(...tabW) + 24
      var lastRight = lanes.map(() => start - 16)
      var x = 0
      model.commits.forEach((c, s) => {
        var shifted = c.cross[1]
        var left = shifted ? 8 + (shifted - 1) * 12 : -c.w / 2
        var need = s ? x + STEP : start
        need = Math.max(need, lastRight[c.lane] + 8 - left)
        var spans = links.filter((l) => l.to === c && l.kind !== 'line')
        spans.forEach((l) => {
          var lo = Math.min(l.from.lane, c.lane)
          var hi = Math.max(l.from.lane, c.lane)
          for (var k = lo; k <= hi; k++) if (k !== c.lane) need = Math.max(need, lastRight[k] + 8)
        })
        x = grid(need)
        pos[c.id] = {x}
        c.left = x + left
        c.right = x + (shifted ? left + c.w : c.w / 2)
        lastRight[c.lane] = Math.max(lastRight[c.lane], c.right)
        // the branch-off down from a parent and the merge up into this commit stand in the lanes they cross
        links.filter((l) => l.to === c && l.kind !== 'line').forEach((l) => {
          var at = l.kind === 'branch' ? pos[l.from.id].x + l.fan : x
          var lo = Math.min(l.from.lane, c.lane)
          var hi = Math.max(l.from.lane, c.lane)
          for (var k = lo + 1; k < hi; k++) lastRight[k] = Math.max(lastRight[k], at)
          if (l.kind === 'branch') lastRight[c.lane] = Math.max(lastRight[c.lane], at)
        })
      })

      // tags sit above their commit and stack a level up when the chip before them on the lane is in the way
      var levels = lanes.map(() => [])
      model.commits.forEach((c) => {
        if (!c.tag) return
        var cx = pos[c.id].x
        var x1 = c.cross[-1] ? cx + 8 + (c.cross[-1] - 1) * 12 : cx - c.chipW / 2
        var placed = levels[c.lane]
        var k = 0
        while (placed.some((p) => p.k === k && x1 < p.x2 + 6 && x1 + c.chipW > p.x1 - 6)) k++
        placed.push({k, x1, x2: x1 + c.chipW})
        c.chipX = x1
        c.level = k
      })
      var above = lanes.map((b, i) => Math.max(12, ...levels[i].map((p) => 30 + p.k * 20)))
      var below = lanes.map(() => 24)
      var y = top
      lanes.forEach((b, i) => {
        y = i ? Math.max(y + below[i - 1] + above[i] + 16, laneAt[i - 1] + 56) : top + Math.max(above[0], TAB / 2)
        laneAt[i] = grid(y)
        y = laneAt[i]
      })
      model.commits.forEach((c) => {
        pos[c.id].y = laneAt[c.lane]
      })
      right = Math.max(...model.commits.map((c) => Math.max(c.right, c.chipX !== undefined ? c.chipX + c.chipW : 0, pos[c.id].x + 8)))
      bottom = laneAt[lanes.length - 1] + below[lanes.length - 1]
    }
    else {
      // top to bottom: a row per commit, lanes as columns as wide as the ids on their right and the tags on their left
      var y0 = top + TAB + 28
      var rightW = lanes.map(() => 12)
      var leftW = lanes.map(() => 12)
      model.commits.forEach((c) => {
        rightW[c.lane] = Math.max(rightW[c.lane], 10 + c.w)
        if (c.tag) leftW[c.lane] = Math.max(leftW[c.lane], 10 + c.chipW)
      })
      lanes.forEach((b, i) => {
        var x = i
          ? laneAt[i - 1] + Math.max(rightW[i - 1] + leftW[i] + 24, tabW[i - 1] / 2 + tabW[i] / 2 + 16, 56)
          : MARGIN + Math.max(leftW[0], tabW[0] / 2)
        laneAt[i] = grid(x)
      })
      model.commits.forEach((c, s) => {
        pos[c.id] = {x: laneAt[c.lane], y: y0 + s * ROW}
      })
      right = laneAt[lanes.length - 1] + Math.max(rightW[lanes.length - 1], tabW[lanes.length - 1] / 2)
      bottom = y0 + (model.commits.length - 1) * ROW + 24
    }
    var width = grid(Math.max(right + MARGIN, 320))
    var height = grid(bottom + MARGIN)

    // lanes: a tab with the branch colour on its edge, then a dotted hairline the length of the graph
    lanes.forEach((b, i) => {
      var w = tabW[i]
      var tx = lr ? MARGIN : laneAt[i] - w / 2
      var ty = lr ? laneAt[i] - TAB / 2 : top
      body.push(`<g class="git-branch" data-branch="${esc(b.name)}">`,
        lr
          ? `<path d="M${tx + w + 8},${laneAt[i]}H${num(width - MARGIN)}" stroke="${t.ruleSolid}" stroke-dasharray="2 4"/>`
          : `<path d="M${laneAt[i]},${ty + TAB + 8}V${num(height - MARGIN)}" stroke="${t.ruleSolid}" stroke-dasharray="2 4"/>`,
        `<rect x="${num(tx)}" y="${ty}" width="${w}" height="${TAB}" rx="2" fill="${t.paper2 || t.paper}" stroke="${t.ruleSolid}"/>`,
        `<rect x="${num(tx + 1)}" y="${ty + 1}" width="2" height="${TAB - 2}" fill="${b.color}"/>`,
        `<text x="${num(tx + 12)}" y="${ty + TAB / 2}" dominant-baseline="central" font-family="${mono}" font-size="9" font-weight="600" fill="${t.ink}">${esc(b.name)}</text>`,
        '</g>')
    })

    // picks under everything, then the branch lines, the dashed links stay readable where a lane line covers them
    var lines = []
    links.forEach((l, k) => {
      var a = pos[l.from.id]
      var b = pos[l.to.id]
      // a branch-off crosses lanes at the parent then runs along its own lane, a merge or a pick runs along the
      // lane it comes from and crosses at the commit it lands on
      var o = l.fan
      var d = l.kind === 'line'
        ? `M${num(a.x)},${num(a.y)}L${num(b.x)},${num(b.y)}`
        : l.kind === 'branch'
          ? rounded(lr
            ? (o ? [a, {x: a.x + o, y: a.y}, {x: a.x + o, y: b.y}, b] : [a, {x: a.x, y: b.y}, b])
            : (o ? [a, {x: a.x, y: a.y + o}, {x: b.x, y: a.y + o}, b] : [a, {x: b.x, y: a.y}, b]))
          : rounded(lr ? [a, {x: b.x, y: a.y}, b] : [a, {x: a.x, y: b.y}, b])
      var cherry = l.kind === 'cherry'
      lines.push({cherry, svg: `<path class="git-line relationshipLine" id="${id}-L-${k}" data-from="${l.from.key}" data-to="${l.to.key}" data-kind="${l.kind}" ` +
        `d="${d}" fill="none" stroke="${l.color}" stroke-width="${cherry ? 1 : 2}"${cherry ? ' stroke-dasharray="4 3"' : ''} stroke-linecap="round"/>`})
    })
    body.push(...lines.filter((l) => l.cherry).map((l) => l.svg), ...lines.filter((l) => !l.cherry).map((l) => l.svg))

    var marks = model.commits.map((c) => {
      var p = pos[c.id]
      var g = [`<g class="node git-commit" id="${id}-git-${c.key}-0">`]
      if (c.type === 'HIGHLIGHT') {
        g.push(`<rect x="${p.x - 6}" y="${p.y - 6}" width="12" height="12" rx="2" fill="${t.paper}"/>`,
          `<rect x="${p.x - 6}" y="${p.y - 6}" width="12" height="12" rx="2" fill="${t.accentTint}" stroke="${accent}" stroke-width="1.5"/>`)
      }
      else if (c.merge) {
        g.push(`<circle cx="${p.x}" cy="${p.y}" r="5" fill="${t.paper}" stroke="${c.color}" stroke-width="2"/>`)
      }
      else {
        g.push(`<circle cx="${p.x}" cy="${p.y}" r="6" fill="${c.color}" stroke="${t.paper}" stroke-width="2"/>`)
        if (c.type === 'REVERSE') {
          g.push(`<path d="M${p.x - 2.5},${p.y - 2.5}l5,5M${p.x + 2.5},${p.y - 2.5}l-5,5" stroke="${t.paper}" stroke-width="1.5" stroke-linecap="round"/>`)
        }
      }

      // the id: under the dot (beside the line when a branch leaves downward), right of it top to bottom
      var lx
      var ly
      var anchor = 'start'
      if (lr) {
        lx = c.cross[1] ? p.x + 8 + (c.cross[1] - 1) * 12 : p.x - c.w / 2
        ly = p.y + 18
      }
      else {
        lx = p.x + 10
        ly = c.cross[1] ? p.y + 17 + (c.cross[1] - 1) * 12 : p.y + 3
      }
      g.push(`<rect x="${num(lx - 2)}" y="${num(ly - 8)}" width="${num(c.w + 4)}" height="11" fill="${t.paper}"/>`,
        `<text x="${num(lx)}" y="${num(ly)}" text-anchor="${anchor}" font-family="${mono}" font-size="8" letter-spacing="0.48" fill="${t.muted}">${esc(c.text)}</text>`)

      if (c.tag) {
        var cx
        var cy
        if (lr) {
          cx = c.chipX
          cy = p.y - 28 - c.level * 20
        }
        else {
          cx = p.x - 10 - c.chipW
          cy = c.cross[-1] ? p.y + 6 + (c.cross[-1] - 1) * 12 : p.y - CHIP / 2
        }
        g.push(`<rect x="${num(cx)}" y="${num(cy)}" width="${c.chipW}" height="${CHIP}" rx="2" fill="${t.paper}"/>`,
          `<rect class="git-tag" x="${num(cx)}" y="${num(cy)}" width="${c.chipW}" height="${CHIP}" rx="2" fill="${t.accentTint}" stroke="${accent}" stroke-opacity="0.6"/>`,
          `<text x="${num(cx + c.chipW / 2)}" y="${num(cy + CHIP / 2)}" text-anchor="middle" dominant-baseline="central" font-family="${mono}" font-size="8" font-weight="500" letter-spacing="0.48" fill="${accentText}">${esc(c.chip)}</text>`)
      }
      g.push('</g>')
      return g.join('')
    })

    var merges = model.commits.filter((c) => c.merge).length
    var tags = model.commits.filter((c) => c.tag).map((c) => c.tag)
    var summary = `${model.title || 'Git graph'}: ${model.commits.length} commits on ${lanes.length} branches` +
      (merges ? `, ${merges} merge${merges > 1 ? 's' : ''}` : '') + (tags.length ? `, tagged ${tags.join(', ')}` : '')
    var info = {
      dir: model.dir,
      branches: lanes.map((b) => b.name),
      nodes: {}
    }
    model.commits.forEach((c, i) => {
      info.nodes[c.key] = {
        name: c.id, branch: c.branch, n: i + 1, type: c.type, tag: c.tag, parents: c.parents,
        merge: c.merge || '', cherry: c.cherry || ''
      }
    })

    return [`<svg xmlns="http://www.w3.org/2000/svg" id="${id}" width="100%" style="max-width: ${width}px;" viewBox="0 0 ${width} ${height}" ` +
      `role="graphics-document document" aria-roledescription="gitGraph" font-family="${esc(sans)}">`,
      `<title>${esc(model.title || 'Git graph')}</title><desc>${esc(summary)}</desc>`,
      body.join(''), marks.join(''),
      `<metadata class="gitgraph-model">${esc(JSON.stringify(info))}</metadata>`, '</svg>'].join('')
  }

  return {parse, render}
})()
