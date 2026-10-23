// Mermaid quadrant charts drawn to the diagram-design quadrant: a hairline cross through the centre, axis names as
// tracked mono eyebrows at the arrow tips, quadrant names as corner tags, items as small labelled dots. Only the
// "do first" cell (quadrant-1) is tinted and its item nearest the top-right corner takes the accent. Syntax that is
// not understood falls back to mermaid itself, see render()
var quadrant = (() => {
  var parse = (src) => {
    var lines = draw.lines(src)
    if (!lines) return null
    var model = {title: '', x: ['', ''], y: ['', ''], quadrants: ['', '', '', ''], points: []}
    var head = false
    var skip = false
    var axis = (text) => {
      var parts = text.split('-->').map((p) => p.trim())
      // an axis with one name is named at its tip, where it grows towards
      return parts.length < 2 ? ['', parts[0]] : [parts[0], parts[1]]
    }
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].replace(/%%.*$/, '').trim()
      if (!line) continue
      if (!head) {
        if (!/^quadrantChart$/i.test(line)) return null
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
      else if ((found = /^title\s+(.*)$/i.exec(line))) model.title = found[1].trim()
      else if ((found = /^x-axis\s+(.*)$/i.exec(line))) model.x = axis(found[1])
      else if ((found = /^y-axis\s+(.*)$/i.exec(line))) model.y = axis(found[1])
      else if ((found = /^quadrant-([1-4])\s+(.*)$/i.exec(line))) model.quadrants[found[1] - 1] = found[2].trim()
      // classes and per-point classes are styling the map does not draw, mermaid keeps them
      else if (/^classDef\b/.test(line)) return null
      else if ((found = /^(.+?)\s*:\s*\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]\s*(.*)$/.exec(line))) {
        if (found[1].includes(':::')) return null
        var x = parseFloat(found[2])
        var y = parseFloat(found[3])
        if (isNaN(x) || isNaN(y) || x < 0 || x > 1 || y < 0 || y > 1) return null
        var point = {label: found[1].trim(), x, y}
        var styles = found[4].trim()
        if (styles) {
          var ok = styles.split(',').every((part) => {
            var kv = /^(radius|color|stroke-color|stroke-width)\s*:\s*(.+)$/i.exec(part.trim())
            if (!kv) return false
            var key = kv[1].toLowerCase()
            var value = kv[2].trim()
            if (key === 'radius' || key === 'stroke-width') {
              var n = parseFloat(value)
              if (isNaN(n)) return false
              point[key === 'radius' ? 'radius' : 'strokeWidth'] = n
            }
            else point[key === 'color' ? 'color' : 'stroke'] = value
            return true
          })
          if (!ok) return null
        }
        model.points.push(point)
      }
      else return null
    }
    return head ? model : null
  }

  var {esc, num, measure} = draw
  // a colour from the source goes into an attribute, keep it to something that is a colour
  var colour = (v) => (/^(#[0-9a-f]{3,8}|[a-z]+|(rgb|hsl)a?\([\d\s.,%]+\))$/i.test(v || '') ? v : '')

  var MARGIN = 32
  var W = 560
  var H = 400
  var PAD = 20

  // quadrant source -> svg markup, or '' when mermaid should draw it. t: the style tokens of mermaid.js
  var render = (src, t, fonts, id) => {
    var model = parse(src)
    if (!model) return ''
    var sans = fonts.sans
    var mono = fonts.mono
    var accent = t.accent
    var accentText = t.accentText
    var eyebrow = (s) => s.toUpperCase()
    var tracked = (s, size) => measure(s, size, mono, 400) + s.length * size * 0.18

    var body = []
    var y = MARGIN
    if (model.title) {
      body.push(`<text x="${MARGIN}" y="${y + 14}" font-family="${sans}" font-size="16" font-weight="600" fill="${t.ink}">${esc(model.title)}</text>`)
      y += 40
    }
    // the top tip label sits above the plot
    var x0 = MARGIN
    var y0 = y + (model.y[1] ? 20 : 0)
    var x1 = x0 + W
    var y1 = y0 + H
    var cx = x0 + W / 2
    var cy = y0 + H / 2
    var px = (v) => x0 + PAD + v * (W - PAD * 2)
    var py = (v) => y1 - PAD - v * (H - PAD * 2)

    // the "do first" cell is the only tinted one
    body.push(`<rect x="${cx}" y="${y0}" width="${W / 2}" height="${H / 2}" fill="${accent}" fill-opacity="${t.dark ? 0.06 : 0.04}"/>`)

    // the cross, with an open chevron at each end that carries a label
    var stroke = `rgba(${t.inkRgb},0.45)`
    body.push(`<path d="M${x0},${cy}H${x1}M${cx},${y0}V${y1}" stroke="${stroke}" fill="none"/>`)
    var chevron = (x, y, dir) => {
      var d = {r: `M${x - 6},${y - 4}L${x},${y}L${x - 6},${y + 4}`, l: `M${x + 6},${y - 4}L${x},${y}L${x + 6},${y + 4}`,
        u: `M${x - 4},${y + 6}L${x},${y}L${x + 4},${y + 6}`, d: `M${x - 4},${y - 6}L${x},${y}L${x + 4},${y - 6}`}[dir]
      body.push(`<path d="${d}" stroke="${stroke}" fill="none"/>`)
    }
    var label = (x, y, text, anchor) => body.push(`<text x="${num(x)}" y="${num(y)}" text-anchor="${anchor}" font-family="${mono}" font-size="8" letter-spacing="1.44" fill="${t.muted}">${esc(eyebrow(text))}</text>`)
    if (model.x[1]) {
      chevron(x1, cy, 'r')
      label(x1, cy + 16, model.x[1], 'end')
    }
    if (model.x[0]) {
      if (model.x[1]) chevron(x0, cy, 'l')
      label(x0, cy + 16, model.x[0], 'start')
    }
    if (model.y[1]) {
      chevron(cx, y0, 'u')
      label(cx, y0 - 8, model.y[1], 'middle')
    }
    if (model.y[0]) {
      if (model.y[1]) chevron(cx, y1, 'd')
      label(cx, y1 + 16, model.y[0], 'middle')
    }

    // corner tags in the outer corner of each cell, quadrant-1 in the accent
    var corners = [[x1 - 16, y0 + 24, 'end'], [x0 + 16, y0 + 24, 'start'], [x0 + 16, y1 - 16, 'start'], [x1 - 16, y1 - 16, 'end']]
    model.quadrants.forEach((name, q) => {
      if (!name) return
      var [x, yy, anchor] = corners[q]
      body.push(`<text x="${x}" y="${yy}" text-anchor="${anchor}" font-family="${mono}" font-size="9" letter-spacing="1.62" ` +
        `fill="${q === 0 ? accentText : t.muted}"${q === 0 ? ' font-weight="600"' : ''}>${esc(eyebrow(name))}</text>`)
    })

    // one accent: the item in quadrant-1 nearest its outer corner, unless the source coloured it
    var focal = -1
    var best = Infinity
    model.points.forEach((p, i) => {
      if (p.x <= 0.5 || p.y <= 0.5 || p.color) return
      var d = (1 - p.x) ** 2 + (1 - p.y) ** 2
      if (d < best) {
        best = d
        focal = i
      }
    })

    // labels sit to the right of their dot, or to the left when that would cross the vertical axis or the edge,
    // and step off any label already placed or off the horizontal axis
    var placed = []
    var tags = [[x0 + 8, y0 + 8, x0 + 16 + tracked(eyebrow(model.quadrants[1] || ''), 9), y0 + 30],
      [x1 - 16 - tracked(eyebrow(model.quadrants[0] || ''), 9), y0 + 8, x1 - 8, y0 + 30],
      [x0 + 8, y1 - 30, x0 + 16 + tracked(eyebrow(model.quadrants[2] || ''), 9), y1 - 8],
      [x1 - 16 - tracked(eyebrow(model.quadrants[3] || ''), 9), y1 - 30, x1 - 8, y1 - 8]]
    var hits = (box) => placed.concat(tags).some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])
    var marks = model.points.map((p, i) => {
      var hot = i === focal
      var x = px(p.x)
      var yy = py(p.y)
      var r = p.radius || (hot ? 6 : 4)
      var w = measure(p.label, 11, sans, hot ? 600 : 400)
      var gap = r + 6
      var options = []
      ;[1, -1].forEach((dir) => [0, -14, 14].forEach((dy) => options.push({dir, dy})))
      var fits = (o) => {
        var left = o.dir > 0 ? x + gap : x - gap - w
        var right = left + w
        var top = yy + o.dy - 8
        var bottom = yy + o.dy + 4
        if (left < x0 || right > x1) return null
        if (left < cx && right > cx) return null
        if (top < cy && bottom > cy) return null
        return [left, top, right, bottom]
      }
      var pick = null
      for (var k = 0; k < options.length && !pick; k++) {
        var box = fits(options[k])
        if (box && !hits(box)) pick = {o: options[k], box}
      }
      if (!pick) {
        for (var j = 0; j < options.length && !pick; j++) {
          var any = fits(options[j])
          if (any) pick = {o: options[j], box: any}
        }
      }
      if (!pick) pick = {o: {dir: 1, dy: 0}, box: [x + gap, yy - 8, x + gap + w, yy + 4]}
      placed.push(pick.box)
      var fill = colour(p.color) || (hot ? accent : t.ink)
      var ring = colour(p.stroke)
      return [`<g class="node quadrant-point" id="${id}-quadrant-p${i}-0">`,
        `<circle cx="${num(x)}" cy="${num(yy)}" r="${num(r)}" fill="${fill}"` +
          (ring ? ` stroke="${ring}" stroke-width="${num(p.strokeWidth || 1)}"` : p.strokeWidth ? ` stroke="${fill}" stroke-width="${num(p.strokeWidth)}"` : '') + '/>',
        `<text x="${num(pick.o.dir > 0 ? x + gap : x - gap)}" y="${num(yy + pick.o.dy + 4)}" text-anchor="${pick.o.dir > 0 ? 'start' : 'end'}" font-family="${sans}" font-size="11"` +
          `${hot ? ' font-weight="600"' : ''} fill="${hot ? t.ink : t.muted}">${esc(p.label)}</text>`,
        '</g>'].join('')
    })

    var width = x1 + MARGIN
    var height = y1 + (model.y[0] ? 24 : 0) + MARGIN
    var cell = (p) => (p.y > 0.5 ? (p.x > 0.5 ? 1 : 2) : (p.x > 0.5 ? 4 : 3))
    var info = {nodes: {}}
    model.points.forEach((p, i) => {
      info.nodes['p' + i] = {name: p.label, x: p.x, y: p.y, quadrant: cell(p), cell: model.quadrants[cell(p) - 1], focal: i === focal}
    })
    var summary = `${model.title || 'Quadrant chart'}: ${model.points.length} items` +
      (model.x[0] || model.x[1] ? `, x from ${model.x[0]} to ${model.x[1]}` : '') +
      (model.y[0] || model.y[1] ? `, y from ${model.y[0]} to ${model.y[1]}` : '') +
      (focal >= 0 ? `, focal ${model.points[focal].label}` : '')

    return [`<svg xmlns="http://www.w3.org/2000/svg" id="${id}" width="100%" style="max-width: ${num(width)}px;" viewBox="0 0 ${num(width)} ${num(height)}" ` +
      `role="graphics-document document" aria-roledescription="quadrantChart" font-family="${esc(sans)}">`,
      `<title>${esc(model.title || 'Quadrant chart')}</title><desc>${esc(summary)}</desc>`,
      body.join(''), marks.join(''),
      `<metadata class="quadrant-model">${esc(JSON.stringify(info))}</metadata>`, '</svg>'].join('')
  }

  return {parse, render}
})()
