// Mermaid mindmaps drawn to the diagram-design tree laid on its side: the root in the middle as the one accent, the
// first-level branches split left and right by size, each taking one colour of the series palette as a thin edge bar.
// Connectors are orthogonal elbows from the parent's edge to a bus and into each child. Syntax that is not understood
// falls back to mermaid itself, see render()
var mindmap = (() => {
  // the delimiters of a node shape, longest first so (( is not read as (
  var SHAPES = [
    ['((', '))', 'circle'], ['))', '((', 'bang'], ['{{', '}}', 'hexagon'],
    [')', '(', 'cloud'], ['(', ')', 'rounded'], ['[', ']', 'square']
  ]

  var label = (text) => {
    var found
    // a markdown string: "`text`"
    if ((found = /^"`([\s\S]*)`"$/.exec(text)) || (found = /^"([\s\S]*)"$/.exec(text))) text = found[1]
    return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').trim()
  }

  var node = (text) => {
    text = text.replace(/:::.*$/, '').trim()
    for (var i = 0; i < SHAPES.length; i++) {
      var [open, close, shape] = SHAPES[i]
      var at = text.indexOf(open)
      if (at < 0 || !text.endsWith(close) || text.length < at + open.length + close.length) continue
      var id = text.slice(0, at).trim()
      if (id && !/^[\w-]+$/.test(id)) continue
      return {id, shape, text: label(text.slice(at + open.length, text.length - close.length))}
    }
    return {id: '', shape: 'plain', text: label(text)}
  }

  var parse = (src) => {
    var lines = src.replace(/%%\{[\s\S]*?\}%%/g, '').split('\n')
    var head = false
    var root = null
    var stack = []
    for (var i = 0; i < lines.length; i++) {
      var raw = lines[i].replace(/%%.*$/, '').replace(/\t/g, '    ')
      var line = raw.trim()
      if (!line) continue
      if (!head) {
        if (!/^mindmap$/i.test(line)) return null
        head = true
        continue
      }
      // icons and classes decorate the node above them, the drawing keeps only the node
      if (/^::icon\(/.test(line) || /^:::/.test(line)) continue
      var indent = raw.length - raw.trimStart().length
      var item = Object.assign(node(line), {children: []})
      if (!item.text) return null
      if (!root) {
        root = item
        stack = [{indent, item}]
        continue
      }
      while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop()
      // a second root is not a mindmap mermaid would draw either
      if (!stack.length) return null
      stack[stack.length - 1].item.children.push(item)
      stack.push({indent, item})
    }
    return head && root ? root : null
  }

  var esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]))
  var num = (v) => Math.round(v * 10) / 10
  var up4 = (v) => Math.ceil(v / 4) * 4

  var ctx = (() => {
    try {
      return document.createElement('canvas').getContext('2d')
    }
    catch (err) {
      return null
    }
  })()
  var measure = (s, size, family, weight) =>
    ctx ? (ctx.font = `${weight || 400} ${size}px ${family}`, ctx.measureText(s).width) : s.length * size * 0.58

  // words onto lines no wider than max, the last line ends in an ellipsis when the text is cut
  var wrap = (text, max, size, family, weight, limit) => {
    var lines = []
    var line = ''
    text.split(/\s+/).filter(Boolean).forEach((word) => {
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
    return lines.length ? lines : ['']
  }

  var MARGIN = 32
  var LEVEL = 48
  var GAP = 12
  var BRANCH_GAP = 16
  var R = 8
  // type per depth: size, weight, line height, padding x / y, widest text
  var TYPE = [
    {size: 14, weight: 600, line: 18, px: 16, py: 12, max: 200},
    {size: 12, weight: 600, line: 15, px: 16, py: 10, max: 180},
    {size: 12, weight: 500, line: 15, px: 12, py: 8, max: 160}
  ]

  // mindmap source -> svg markup, or '' when mermaid should draw it. t: the style tokens of mermaid.js
  var render = (src, t, fonts, id) => {
    var root = parse(src)
    if (!root) return ''
    var sans = fonts.sans
    var series = t.series && t.series.length ? t.series : [t.muted]

    // walk the tree once: depth, size and an index for every node
    var all = []
    var size = (item, depth, branch) => {
      var type = TYPE[Math.min(depth, 2)]
      item.depth = depth
      item.branch = branch
      item.n = all.length
      all.push(item)
      item.lines = item.text.split(/<br\s*\/?>/i).flatMap((part) => wrap(part, type.max, type.size, sans, type.weight, 4)).slice(0, 4)
      item.w = up4(Math.max(depth ? 64 : 96, Math.max(...item.lines.map((l) => measure(l, type.size, sans, type.weight))) + type.px * 2 + (depth === 1 ? 4 : 0) + (item.shape === 'hexagon' ? 12 : 0)))
      item.h = up4(Math.max(depth ? 32 : 48, item.lines.length * type.line + type.py * 2))
      item.children.forEach((child, i) => size(child, depth + 1, depth ? branch : i))
    }
    size(root, 0, -1)

    // the vertical room a subtree needs: its own box or its children stacked, whichever is taller
    var span = (item) => {
      var gap = item.depth ? GAP : BRANCH_GAP
      var kids = item.children.reduce((sum, c, i) => sum + span(c) + (i ? gap : 0), 0)
      item.span = Math.max(item.h, kids)
      return item.span
    }
    span(root)

    // first-level branches go right then left, each to the side that is shorter so far, order kept per side
    var sides = {right: [], left: []}
    var height = {right: 0, left: 0}
    root.children.forEach((c) => {
      var side = height.right <= height.left ? 'right' : 'left'
      height[side] += c.span + (sides[side].length ? BRANCH_GAP : 0)
      sides[side].push(c)
      var mark = (item) => {
        item.side = side
        item.children.forEach(mark)
      }
      mark(c)
    })

    // columns: every depth on a side is as wide as its widest node, nodes align on the edge nearer the root
    var cols = {right: [], left: []}
    all.forEach((item) => {
      if (!item.depth) return
      var c = cols[item.side]
      c[item.depth] = Math.max(c[item.depth] || 0, item.w)
    })
    var edge = (side, depth) => {
      var x = root.w / 2 + LEVEL
      for (var d = 1; d < depth; d++) x += cols[side][d] + LEVEL
      return x
    }

    // place a subtree in the band from top: the node centred on its children, or on its own band when a leaf
    var place = (item, top) => {
      var gap = item.depth ? GAP : BRANCH_GAP
      var kids = item.children.reduce((sum, c, i) => sum + c.span + (i ? gap : 0), 0)
      if (item.children.length) {
        var y = top + (item.span - kids) / 2
        item.children.forEach((c) => {
          place(c, y)
          y += c.span + gap
        })
        var first = item.children[0]
        var last = item.children[item.children.length - 1]
        item.cy = (first.cy + last.cy) / 2
      }
      else item.cy = top + item.span / 2
      var near = edge(item.side, item.depth)
      item.x = item.side === 'right' ? near : -near - item.w
      item.y = Math.round((item.cy - item.h / 2) / 4) * 4
      item.cy = item.y + item.h / 2
    }
    ;['right', 'left'].forEach((side) => {
      var y = -height[side] / 2
      sides[side].forEach((c) => {
        place(c, y)
        y += c.span + BRANCH_GAP
      })
    })
    root.x = -root.w / 2
    root.y = Math.round(-root.h / 2 / 4) * 4
    root.cy = root.y + root.h / 2

    // shift onto the canvas
    var minX = Math.min(...all.map((i) => i.x))
    var minY = Math.min(...all.map((i) => i.y))
    var maxX = Math.max(...all.map((i) => i.x + i.w))
    var maxY = Math.max(...all.map((i) => i.y + i.h))
    var dx = MARGIN - minX
    var dy = MARGIN - minY
    all.forEach((i) => {
      i.x += dx
      i.y += dy
      i.cy += dy
    })
    var width = up4(maxX - minX) + MARGIN * 2
    var bottom = up4(maxY - minY) + MARGIN * 2

    // connectors: out of the parent's side, a bus halfway across the gap, into the child's near edge
    var lines = []
    all.forEach((parent) => parent.children.forEach((child) => {
      var right = child.side === 'right'
      var x1 = right ? parent.x + parent.w : parent.x
      var x2 = right ? child.x : child.x + child.w
      var s = right ? 1 : -1
      var xm = x1 + s * LEVEL / 2
      var y1 = parent.cy
      var y2 = child.cy
      var d
      var r = Math.min(R, Math.abs(y2 - y1) / 2)
      if (r < 1) d = `M${num(x1)},${num(y1)}H${num(x2)}`
      else {
        var v = y2 > y1 ? 1 : -1
        d = `M${num(x1)},${num(y1)}H${num(xm - s * r)}Q${num(xm)},${num(y1)} ${num(xm)},${num(y1 + v * r)}` +
          `V${num(y2 - v * r)}Q${num(xm)},${num(y2)} ${num(xm + s * r)},${num(y2)}H${num(x2)}`
      }
      lines.push(`<path class="mindmap-line relationshipLine" id="${id}-L-${child.n}" data-from="n${parent.n}" data-to="n${child.n}" ` +
        `d="${d}" fill="none" stroke="${t.muted}" stroke-width="1"/>`)
    }))

    // the outline of a node by its shape: subtle variants of one box, not cartoons
    var outline = (item, fill, stroke, extra) => {
      var {x, y, w, h} = item
      if (item.shape === 'hexagon') {
        var c = 10
        return `<path d="M${x + c},${y}H${x + w - c}L${x + w},${y + h / 2}L${x + w - c},${y + h}H${x + c}L${x},${y + h / 2}Z" fill="${fill}" stroke="${stroke}"${extra}/>`
      }
      var rx = {square: 2, rounded: 12, circle: h / 2}[item.shape] || (item.depth > 1 ? 4 : 6)
      var dash = item.shape === 'cloud' || item.shape === 'bang' ? ' stroke-dasharray="4 3"' : ''
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(rx, h / 2)}" fill="${fill}" stroke="${stroke}"${dash}${extra}/>`
    }

    var nodes = all.map((item) => {
      var type = TYPE[Math.min(item.depth, 2)]
      var g = [`<g class="node mindmap-item" id="${id}-mindmap-n${item.n}-0">`]
      if (!item.depth) g.push(outline(item, t.accentTint, t.accent, ' stroke-width="1.2"'))
      else if (item.depth === 1) {
        g.push(`<rect x="${item.x}" y="${item.y}" width="${item.w}" height="${item.h}" rx="6" fill="${t.paper}"/>`)
        g.push(outline(item, t.node, t.ink, ''))
        // the branch colour: a thin bar on the outer edge
        // kept clear of a chamfer or a wide corner
        var inset = item.shape === 'hexagon' ? 12 : item.shape === 'rounded' || item.shape === 'circle' ? 8 : 4
        var bx = item.side === 'right' ? item.x + item.w - inset - 3 : item.x + inset
        g.push(`<rect x="${bx}" y="${item.y + 6}" width="3" height="${item.h - 12}" rx="1.5" fill="${series[item.branch % series.length]}"/>`)
      }
      else {
        g.push(`<rect x="${item.x}" y="${item.y}" width="${item.w}" height="${item.h}" rx="4" fill="${t.paper}"/>`)
        g.push(item.shape === 'plain'
          ? outline(item, `rgba(${t.inkRgb},0.03)`, t.rule, '')
          : outline(item, t.node, t.muted, ''))
      }
      var cx = item.x + item.w / 2 - (item.depth === 1 ? (item.side === 'right' ? 2 : -2) : 0)
      var top = item.cy - (item.lines.length * type.line) / 2 + type.line / 2
      item.lines.forEach((line, k) => g.push(
        `<text x="${num(cx)}" y="${num(top + k * type.line)}" text-anchor="middle" dominant-baseline="central" font-family="${sans}" font-size="${type.size}" font-weight="${type.weight}" fill="${t.ink}">${esc(line)}</text>`))
      g.push('</g>')
      return g.join('')
    })

    var info = {nodes: {}}
    all.forEach((item) => {
      info.nodes['n' + item.n] = {name: item.lines.join(' '), depth: item.depth, shape: item.shape, children: item.children.length}
    })
    var name = root.lines.join(' ')
    var summary = `Mindmap of ${name}: ${root.children.length} branches, ${all.length - 1} topics` +
      (root.children.length ? ` (${root.children.map((c) => c.lines.join(' ')).join(', ')})` : '')

    return [`<svg xmlns="http://www.w3.org/2000/svg" id="${id}" width="100%" style="max-width: ${num(width)}px;" viewBox="0 0 ${num(width)} ${num(bottom)}" ` +
      `role="graphics-document document" aria-roledescription="mindmap" font-family="${esc(sans)}">`,
      `<title>${esc(name)}</title><desc>${esc(summary)}</desc>`,
      lines.join(''), nodes.join(''),
      `<metadata class="mindmap-model">${esc(JSON.stringify(info))}</metadata>`, '</svg>'].join('')
  }

  return {parse, render}
})()
