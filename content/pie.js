// Mermaid pies drawn as an editorial donut: one ring cut by paper gaps, the largest slice takes the accent and the
// rest the muted series palette, every slice named directly on a hairline leader instead of a legend, the focal
// share (or the total with showData) in the centre. Syntax that is not understood falls back to mermaid itself, see render()
var pie = (() => {
  var parse = (src) => {
    var lines = draw.lines(src)
    if (!lines) return null
    var model = {title: '', showData: false, slices: []}
    var head = false
    var skip = false
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].replace(/%%.*$/, '').trim()
      if (!line) continue
      var found
      if (!head) {
        if (!(found = /^pie\b\s*(showData)?\s*(?:title\s+(.*))?$/i.exec(line))) return null
        model.showData = !!found[1]
        model.title = (found[2] || '').trim()
        head = true
        continue
      }
      if (skip) {
        skip = !line.includes('}')
        continue
      }
      if (/^acc(Title|Descr)\b/.test(line)) {
        skip = /\{\s*$/.test(line)
      }
      else if (/^showData$/i.test(line)) model.showData = true
      else if ((found = /^title\s+(.*)$/i.exec(line))) model.title = found[1].trim()
      else if ((found = /^"([^"]*)"\s*:\s*(-?[\d.]+(?:e[+-]?\d+)?)$/i.exec(line))) {
        var value = parseFloat(found[2])
        if (isNaN(value) || value < 0) return null
        model.slices.push({label: found[1], value})
      }
      else return null
    }
    var total = model.slices.reduce((sum, s) => sum + s.value, 0)
    return head && total > 0 ? model : null
  }

  var {esc, num, measure} = draw
  // 65 -> 65, 7.5 -> 7.5, 0.04 -> 0.04: no trailing zeros
  var fmt = (v) => String(Math.abs(v) >= 10 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100)
  // shares carry one decimal at most
  var pct = (v) => String(Math.round(v * 10) / 10)

  var MARGIN = 32
  var R = 120
  var RING = 44
  var LEAD = 40
  var ROW = 32

  // pie source -> svg markup, or '' when mermaid should draw it. t: the style tokens of mermaid.js
  var render = (src, t, fonts, id) => {
    var model = parse(src)
    if (!model) return ''
    var sans = fonts.sans
    var mono = fonts.mono
    var accent = t.accent
    var accentText = t.accentText
    var slices = model.slices.filter((s) => s.value > 0)
    var total = slices.reduce((sum, s) => sum + s.value, 0)
    // one accent: the largest slice, the first one when several tie
    var focal = slices.reduce((best, s, i) => (s.value > slices[best].value ? i : best), 0)
    // the palette never repeats the accent, dark mode has it as a series colour
    var palette = [t.series[1], t.series[0], t.series[2], t.series[3], t.series[4], t.muted, t.soft].filter((c) => c.toLowerCase() !== accent.toLowerCase())
    var k = 0
    slices.forEach((s, i) => {
      s.share = s.value / total * 100
      s.color = i === focal ? accent : palette[k++ % palette.length]
      // the ring closes on itself: the last slice must not wear the colour of the first
      if (i === slices.length - 1 && i > 1 && s.color === slices[0].color) s.color = palette[k % palette.length]
      s.name = s.label
      s.note = model.showData ? `${fmt(s.value)} · ${pct(s.share)}%` : `${pct(s.share)}%`
      s.w = Math.max(measure(s.name, 12, sans, 600), measure(s.note, 9, mono, 400) + s.note.length * 0.54)
    })

    // clockwise from twelve o'clock
    var at = 0
    slices.forEach((s) => {
      s.a0 = at
      at += s.share / 100 * Math.PI * 2
      s.a1 = at
      s.mid = (s.a0 + s.a1) / 2
    })

    // labels: right half and left half, each kept in angle order (top to bottom), pushed one row apart and then
    // moved as a block so on average every label sits level with its slice
    var side = (s) => (Math.sin(s.mid) >= 0 ? 1 : -1)
    var right = slices.filter((s) => side(s) > 0)
    var left = slices.filter((s) => side(s) < 0).reverse()
    var spread = (group) => {
      group.forEach((s) => (s.ly = s.natural = -Math.cos(s.mid) * (R + 12)))
      for (var i = 1; i < group.length; i++) group[i].ly = Math.max(group[i].ly, group[i - 1].ly + ROW)
      var shift = group.reduce((sum, s) => sum + s.ly - s.natural, 0) / (group.length || 1)
      group.forEach((s) => (s.ly -= shift))
    }
    spread(right)
    spread(left)

    var leftW = Math.max(0, ...left.map((s) => s.w))
    var rightW = Math.max(0, ...right.map((s) => s.w))
    var reach = R + LEAD
    var body = []
    var y = MARGIN
    if (model.title) {
      body.push(`<text x="${MARGIN}" y="${y + 14}" font-family="${sans}" font-size="16" font-weight="600" fill="${t.ink}">${esc(model.title)}</text>`)
      y += 40
    }
    var lys = slices.map((s) => s.ly)
    var top = Math.min(-R, ...lys.map((v) => v - 14))
    var bottomEdge = Math.max(R, ...lys.map((v) => v + 18))
    var cx = MARGIN + (leftW ? leftW + 8 : 0) + reach
    var cy = y + 8 - top
    var width = Math.max(cx + reach + (rightW ? rightW + 8 : 0) + MARGIN, 360)
    var height = cy + bottomEdge + MARGIN

    var point = (a, r) => [cx + Math.sin(a) * r, cy - Math.cos(a) * r]
    var arc = (s) => {
      var full = s.a1 - s.a0 >= Math.PI * 2 - 1e-6
      var r0 = R - RING
      if (full) {
        return `M${cx},${cy - R}A${R},${R} 0 1 1 ${cx - 0.01},${cy - R}Z` +
          `M${cx},${cy - r0}A${r0},${r0} 0 1 0 ${cx + 0.01},${cy - r0}Z`
      }
      var large = s.a1 - s.a0 > Math.PI ? 1 : 0
      var [x0, y0] = point(s.a0, R)
      var [x1, y1] = point(s.a1, R)
      var [x2, y2] = point(s.a1, r0)
      var [x3, y3] = point(s.a0, r0)
      return `M${num(x0)},${num(y0)}A${R},${R} 0 ${large} 1 ${num(x1)},${num(y1)}` +
        `L${num(x2)},${num(y2)}A${r0},${r0} 0 ${large} 0 ${num(x3)},${num(y3)}Z`
    }

    var marks = slices.map((s, i) => {
      var hot = i === focal
      var dir = side(s)
      // out of the ring along the slice, then to the label row, then level into the label
      var [ex, ey] = point(s.mid, R + 4)
      var [rx, ry] = point(s.mid, R + 12)
      var ly = cy + s.ly
      var kx = cx + dir * (R + 24)
      var tx = cx + dir * reach
      var anchor = dir > 0 ? 'start' : 'end'
      var lx = tx + dir * 8
      return [`<g class="node pie-slice" id="${id}-pie-s${i}-0">`,
        `<path d="${arc(s)}" fill="${s.color}" fill-opacity="${hot ? 1 : 0.85}" stroke="${t.paper}" stroke-width="2" stroke-linejoin="round"/>`,
        `<path d="M${num(ex)},${num(ey)}L${num(rx)},${num(ry)}L${num(kx)},${num(ly)}H${num(tx)}" fill="none" stroke="${hot ? accent : t.ruleSolid}"/>`,
        `<circle cx="${num(tx)}" cy="${num(ly)}" r="2" fill="${hot ? accent : t.muted}"/>`,
        `<text x="${num(lx)}" y="${num(ly - 3)}" text-anchor="${anchor}" font-family="${sans}" font-size="12" font-weight="600" fill="${hot ? accentText : t.ink}">${esc(s.name)}</text>`,
        `<text x="${num(lx)}" y="${num(ly + 10)}" text-anchor="${anchor}" font-family="${mono}" font-size="9" letter-spacing="0.54" fill="${hot ? accentText : t.muted}">${esc(s.note)}</text>`,
        '</g>'].join('')
    })

    // the centre carries the focal share, or the total when the source asks for the data
    var big = model.showData ? fmt(total) : `${pct(slices[focal].share)}%`
    var small = model.showData ? 'TOTAL' : slices[focal].name.toUpperCase()
    var smallSize = 8
    var maxSmall = (R - RING) * 2 - 24
    while (small.length > 4 && measure(small, smallSize, mono, 400) + small.length * 1.44 > maxSmall) small = small.slice(0, -2) + '…'
    body.push(`<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-family="${sans}" font-size="24" font-weight="600" fill="${model.showData ? t.ink : accentText}">${esc(big)}</text>`,
      `<text x="${cx}" y="${cy + 20}" text-anchor="middle" font-family="${mono}" font-size="${smallSize}" letter-spacing="1.44" fill="${t.muted}">${esc(small)}</text>`)

    var info = {nodes: {}}
    slices.forEach((s, i) => {
      info.nodes['s' + i] = {name: s.label, value: s.value, share: Math.round(s.share * 10) / 10, focal: i === focal}
    })
    var summary = `${model.title || 'Pie chart'}: ${slices.length} slices, largest ${slices[focal].label} at ${pct(slices[focal].share)}%`

    return [`<svg xmlns="http://www.w3.org/2000/svg" id="${id}" width="100%" style="max-width: ${num(width)}px;" viewBox="0 0 ${num(width)} ${num(height)}" ` +
      `role="graphics-document document" aria-roledescription="pie" font-family="${esc(sans)}">`,
      `<title>${esc(model.title || 'Pie chart')}</title><desc>${esc(summary)}</desc>`,
      body.join(''), marks.join(''),
      `<metadata class="pie-model">${esc(JSON.stringify(info))}</metadata>`, '</svg>'].join('')
  }

  return {parse, render}
})()
