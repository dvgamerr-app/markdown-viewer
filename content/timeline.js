// Mermaid timelines drawn to the diagram-design timeline: one hairline baseline, a dot per period, labels that
// alternate above and below on a hairline drop, the busiest period is the major milestone in the accent. Periods
// that are all numbers (years) sit by value so the spacing is honest, anything else is spaced evenly. Syntax that
// is not understood falls back to mermaid itself, see render()
var timeline = (() => {
  var parse = (src) => {
    var lines = src.replace(/%%\{[\s\S]*?\}%%/g, '').split('\n')
    var model = {title: '', sections: []}
    var head = false
    var section = null
    var skip = false
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].replace(/%%.*$/, '').trim()
      if (!line) continue
      if (!head) {
        if (!/^timeline(\s+(LR|TD))?$/i.test(line)) return null
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
      else if ((found = /^section\s*(.*)$/i.exec(line))) {
        section = {name: found[1].trim(), periods: []}
        model.sections.push(section)
      }
      else {
        if (!section) {
          section = {name: '', periods: []}
          model.sections.push(section)
        }
        var parts = line.split(':').map((p) => p.trim())
        var events = parts.slice(1).filter(Boolean)
        // a line that starts with a colon carries more events of the period above it
        if (!parts[0]) {
          var last = section.periods[section.periods.length - 1]
          if (!last) return null
          last.events.push(...events)
        }
        else section.periods.push({label: parts[0], events})
      }
    }
    return head && model.sections.some((s) => s.periods.length) ? model : null
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
  // tracking is added per character, as the browser draws letter-spacing
  var measure = (s, size, family, weight, tracking = 0) =>
    (ctx ? (ctx.font = `${weight || 400} ${size}px ${family}`, ctx.measureText(s).width) : s.length * size * 0.6) + s.length * tracking

  // words onto lines no wider than max, the last line ends in an ellipsis when the text is cut
  var wrap = (text, max, size, family, weight, limit, tracking) => {
    var lines = []
    var line = ''
    text.split(/\s+/).filter(Boolean).forEach((word) => {
      var next = line ? line + ' ' + word : word
      if (!line || measure(next, size, family, weight, tracking) <= max) line = next
      else {
        lines.push(line)
        line = word
      }
    })
    if (line) lines.push(line)
    if (lines.length > limit) {
      lines.length = limit
      var last = lines[limit - 1]
      while (last.length > 1 && measure(last + '…', size, family, weight, tracking) > max) last = last.slice(0, -1)
      lines[limit - 1] = last + '…'
    }
    return lines.length ? lines : ['']
  }

  // the skill's type ramp: date eyebrow 8px mono tracked 0.14em, event names 12px sans 600 (14px on the milestone),
  // a 16px line pitch. Structure sits on the 4px grid
  var MARGIN = 32
  var LABEL = 144
  var PAD = 8
  var DROP = 56
  var MAJOR = 80
  var GAP = 24
  var STEP = 32
  var CAP = 20
  var EVENTS = 4
  var TRACK = 1.12

  // "a", "a and b", "a, b and c"
  var list = (items) => (items.length > 1 ? items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1] : items[0] || '')

  // what happened in period i, in words: what it brings, where it sits among its neighbours and how much of the
  // timeline it holds. Years read as years, other numbers as plain steps
  var story = (periods, i, {numeric, values, major, total}) => {
    var p = periods[i]
    var before = periods[i - 1]
    var after = periods[i + 1]
    var years = numeric && values.every((v) => Number.isInteger(v) && v >= 1000 && v <= 2999)
    var span = (a, b) => {
      var gap = Math.round((values[b] - values[a]) * 10) / 10
      return years ? gap + (gap === 1 ? ' year' : ' years') : numeric ? gap + ' steps' : ''
    }
    var named = (q) => q.label + (q.events.length ? ' (' + list(q.events) + ')' : '')
    var out = [p.events.length ? `${p.label} brings ${list(p.events)}.` : `${p.label} is marked with no events.`]
    if (p.section) out.push(`It falls in ${p.section}.`)
    if (!before && !after) out.push('It is the only period on the timeline.')
    else if (!before) out.push(`It opens the timeline, ${numeric ? span(i, i + 1) + ' before' : 'ahead of'} ${named(after)}.`)
    else if (!after) out.push(`It closes the timeline, ${numeric ? span(i - 1, i) + ' after' : 'following'} ${named(before)}.`)
    else if (numeric) out.push(`It comes ${span(i - 1, i)} after ${named(before)} and ${span(i, i + 1)} before ${named(after)}.`)
    else out.push(`It follows ${named(before)} and leads to ${named(after)}.`)
    if (i === major) out.push(`The busiest period: ${p.events.length} of the ${total} events on the timeline happen here.`)
    else if (p.events.length && total > p.events.length) out.push(`It holds ${p.events.length} of the ${total} events on the timeline.`)
    return out.join(' ')
  }

  // timeline source -> svg markup, or '' when mermaid should draw it. t: the style tokens of mermaid.js, fit: the
  // width the axis may stretch to
  var render = (src, t, fonts, id, fit) => {
    var model = parse(src)
    if (!model) return ''
    var sans = fonts.sans
    var mono = fonts.mono
    var periods = []
    model.sections.forEach((section) => section.periods.forEach((p) => periods.push(Object.assign(p, {section: section.name}))))
    var n = periods.length
    var accent = t.accent
    // the light accent is a bright orange for marks, text on paper needs the darker one
    var accentText = t.paper === '#020202' ? t.accent : '#bf4520'
    var faint = (alpha) => `rgba(${t.inkRgb},${alpha})`

    // the major milestone: the period with the most events, when one period has more than every other
    var most = Math.max(...periods.map((p) => p.events.length))
    var major = most > 1 && periods.filter((p) => p.events.length === most).length === 1
      ? periods.findIndex((p) => p.events.length === most) : -1

    // what each label holds and how much room it takes
    periods.forEach((p, i) => {
      var big = i === major
      p.size = big ? 14 : 12
      p.date = wrap(p.label.toUpperCase(), LABEL, 8, mono, 400, 2, TRACK)
      var shown = p.events.length > EVENTS ? p.events.slice(0, EVENTS - 1) : p.events
      p.names = shown.map((e, k) => wrap(e, LABEL, k ? 12 : p.size, sans, 600, 2))
      p.more = p.events.length - shown.length
      var widths = p.date.map((l) => measure(l, 8, mono, 400, TRACK))
        .concat(p.names.flatMap((lines, k) => lines.map((l) => measure(l, k ? 12 : p.size, sans, 600))))
      p.w = grid(Math.max(...widths, 24) + PAD * 2)
      p.drop = big ? MAJOR : DROP
      // label lines below the drop: dates on a 12px pitch, names and the overflow on 16px
      p.rows = p.date.length * 12 + p.names.reduce((sum, l) => sum + l.length * 16, 0) + (p.more ? 16 : 0)
    })

    // an honest axis: numbers sit by value, the whole axis then stretches until no two labels on one side meet
    var values = periods.map((p) => parseFloat(p.label))
    var numeric = n > 1 && periods.every((p) => /^-?\d+(\.\d+)?$/.test(p.label)) && values.every((v, i) => !i || v > values[i - 1])
    if (!numeric) values = periods.map((p, i) => i)
    var spans = values.slice(1).map((v, i) => v - values[i])
    var scale = n > 1 ? STEP / Math.min(...spans) : 0
    for (var i = 0; i + 2 < n; i++) {
      scale = Math.max(scale, (periods[i].w / 2 + periods[i + 2].w / 2 + GAP) / (values[i + 2] - values[i]))
    }
    // evenly spaced periods have nothing to measure, give them the width of a label
    if (!numeric) scale = Math.max(scale, ...periods.map((p) => p.w / 2 + GAP / 2))
    var xs, capL, capR, right
    var place = () => {
      xs = values.map((v) => (v - values[0]) * scale)
      var left = Math.min(xs[0] - CAP, ...periods.map((p, i) => xs[i] - p.w / 2))
      xs = xs.map((x) => x - left + MARGIN)
      capL = xs[0] - CAP
      capR = xs[n - 1] + CAP
      right = Math.max(capR, ...periods.map((p, i) => xs[i] + p.w / 2))
    }
    place()
    // the axis fills the room it is given: only the distances grow, the type keeps its size. A label that stuck out
    // past an end stops doing so once the axis grows, so the stretch is measured again until it fits
    for (var pass = 0; n > 1 && fit && pass < 3 && right + MARGIN < fit - 1; pass++) {
      var span = xs[n - 1] - xs[0]
      scale *= (span + fit - right - MARGIN) / span
      place()
    }

    var body = []
    var y = MARGIN
    if (model.title) {
      body.push(`<text x="${MARGIN}" y="${y + 14}" font-family="${sans}" font-size="16" font-weight="600" fill="${t.ink}">${esc(model.title)}</text>`)
      y += 40
    }
    var named = model.sections.some((s) => s.name)
    var bandY = y
    if (named) y += 36

    // even periods hang above the baseline, odd ones below
    var reach = (p) => p.drop + 8 + p.rows
    var above = Math.max(0, ...periods.filter((p, k) => k % 2 === 0).map(reach))
    var below = Math.max(0, ...periods.filter((p, k) => k % 2 === 1).map(reach))
    var base = grid(y + above)
    y = base + Math.max(below, 16) + 24

    // sections: a tracked eyebrow over a hairline that spans the periods it holds, a tick where one ends
    if (named) {
      var at = 0
      model.sections.forEach((section) => {
        var count = section.periods.length
        if (!count) return
        var from = at ? (xs[at - 1] + xs[at]) / 2 : capL
        var to = at + count < n ? (xs[at + count - 1] + xs[at + count]) / 2 : capR
        body.push(`<text x="${num(from + 4)}" y="${bandY + 8}" font-family="${mono}" font-size="8" letter-spacing="1.44" fill="${t.muted}">${esc(section.name.toUpperCase())}</text>`,
          `<path d="M${num(from + 4)},${bandY + 18}H${num(to - 4)}" stroke="${t.ruleSolid}"/>`)
        if (at + count < n) body.push(`<path d="M${num(to)},${base - 8}V${base + 8}" stroke="${faint(0.2)}"/>`)
        at += count
      })
    }

    // the baseline: a cap at both ends, the stretches between periods are the links the viewer plays along
    var line = `stroke="${t.muted}" stroke-opacity="0.45"`
    body.push(`<path d="M${num(capL)},${base - 8}V${base + 8}M${num(capR)},${base - 8}V${base + 8}" stroke="${faint(0.2)}"/>`,
      `<path d="M${num(capL)},${base}H${num(xs[0])}M${num(xs[n - 1])},${base}H${num(capR)}" ${line}/>`)
    var segments = []
    for (var k = 1; k < n; k++) {
      segments.push(`<path class="timeline-line relationshipLine" id="${id}-S-${k}" data-from="p${k - 1}" data-to="p${k}" ` +
        `d="M${num(xs[k - 1])},${base}H${num(xs[k])}" fill="none" ${line}/>`)
    }
    // playback only: an ink stroke drawn along the baseline up to the period in play, see motion()
    segments.push(`<path class="tl-progress" aria-hidden="true" d="M${num(capL)},${base}H${num(capR)}" pathLength="1" fill="none" stroke="${t.ink}" stroke-width="1.5"/>`)

    var marks = periods.map((p, i) => {
      var x = num(xs[i])
      var up = i % 2 === 0
      var big = i === major
      var edge = up ? base - p.drop : base + p.drop
      // the label reads top down either way: above it ends a line short of the drop, below it starts one past it
      var top = up ? edge - 8 - p.rows : edge + 8
      var g = [`<g class="node timeline-period" id="${id}-timeline-p${i}-0">`,
        `<rect class="timeline-hit" x="${num(xs[i] - p.w / 2)}" y="${num((up ? top : base) - PAD)}" width="${p.w}" height="${num(p.rows + p.drop + PAD * 2 + 8)}" rx="6" fill="rgba(0,0,0,0)"/>`,
        // the drop runs out from the dot, so drawing it in playback grows it from the baseline
        `<path class="tl-drop" d="M${x},${base}V${edge}" pathLength="1" stroke="${big ? accent : faint(0.3)}"/>`,
        `<circle class="tl-ring" aria-hidden="true" cx="${x}" cy="${base}" r="${big ? 11 : 9}" fill="none" stroke="${t.ink}"/>`,
        `<circle cx="${x}" cy="${base}" r="${big ? 6 : 4}" fill="${big ? accent : t.ink}"/>`,
        `<g class="tl-label ${up ? 'tl-up' : 'tl-down'}">`]
      var yy = top
      p.date.forEach((l) => {
        yy += 12
        g.push(`<text x="${x}" y="${num(yy - 4)}" text-anchor="middle" font-family="${mono}" font-size="8" letter-spacing="${TRACK}" fill="${big ? accentText : t.muted}">${esc(l)}</text>`)
      })
      p.names.forEach((lines, k) => lines.forEach((l) => {
        yy += 16
        g.push(`<text x="${x}" y="${num(yy - 4)}" text-anchor="middle" font-family="${sans}" font-size="${k ? 12 : p.size}" font-weight="600" fill="${t.ink}">${esc(l)}</text>`)
      }))
      if (p.more) {
        yy += 16
        g.push(`<text x="${x}" y="${num(yy - 5)}" text-anchor="middle" font-family="${mono}" font-size="8" letter-spacing="${TRACK}" fill="${t.soft}">+${p.more} MORE</text>`)
      }
      g.push('</g></g>')
      return g.join('')
    })

    // legend: a bottom strip naming the marks in use and how the axis is spaced, left out when it has nothing to say
    var legend = []
    if (major >= 0 || numeric) {
      var ly = y
      legend.push(`<text x="${MARGIN}" y="${ly + 16}" font-family="${mono}" font-size="8" letter-spacing="1.44" fill="${t.muted}">LEGEND</text>`)
      var lx = MARGIN + 12
      var item = (r, fill, text) => {
        legend.push(`<circle cx="${lx}" cy="${ly + 32}" r="${r}" fill="${fill}"/>`,
          `<text x="${lx + 16}" y="${ly + 32}" dominant-baseline="central" font-family="${sans}" font-size="9" fill="${t.muted}">${esc(text)}</text>`)
        lx = grid(lx + 16 + measure(text, 9, sans, 400) + 32)
      }
      item(4, t.ink, 'Period')
      major >= 0 && item(6, accent, 'Busiest period')
      var note = 'Spacing is proportional to elapsed time.'
      numeric && legend.push(`<text x="${lx - 8}" y="${ly + 32}" dominant-baseline="central" font-family="${sans}" font-size="9" font-style="italic" fill="${t.muted}">${note}</text>`)
      // the strip may run wider than the axis, the figure widens with it
      right = Math.max(right, numeric ? lx - 8 + measure(note, 9, sans, 400) : lx - 32)
      legend.unshift(`<path d="M${MARGIN},${ly}H${num(right)}" stroke="${faint(0.1)}" stroke-width="0.8"/>`)
      y = ly + 48
    }
    var width = fit && right + MARGIN <= fit + 4 ? Math.floor(fit) : grid(right + MARGIN)
    var height = grid(y)

    var total = periods.reduce((sum, p) => sum + p.events.length, 0)
    var info = {axis: [num(capL), num(capR)], nodes: {}}
    periods.forEach((p, i) => {
      info.nodes['p' + i] = {
        name: p.label, section: p.section, n: i + 1, events: p.events, major: i === major, x: num(xs[i]),
        gap: numeric && i ? num(values[i] - values[i - 1]) : null,
        prev: i ? 'p' + (i - 1) : '', next: i < n - 1 ? 'p' + (i + 1) : '',
        story: story(periods, i, {numeric, values, major, total})
      }
    })
    var summary = `${model.title || 'Timeline'}: ${n} periods from ${periods[0].label} to ${periods[n - 1].label}, ${total} events` +
      (major >= 0 ? `, busiest at ${periods[major].label}` : '')

    return [`<svg xmlns="http://www.w3.org/2000/svg" id="${id}" width="100%" style="max-width: ${width}px;" viewBox="0 0 ${width} ${height}" ` +
      `role="graphics-document document" aria-roledescription="timeline" font-family="${esc(sans)}">`,
      `<title>${esc(model.title || 'Timeline')}</title><desc>${esc(summary)}</desc>`,
      `<style>${motionCss('#' + id, t)}</style>`,
      body.join(''), segments.join(''), marks.join(''), legend.join(''),
      `<metadata class="timeline-model">${esc(JSON.stringify(info))}</metadata>`, '</svg>'].join('')
  }

  // playback, the skill's step mode: the figure is complete until a run starts. In a run an ink stroke draws along
  // the baseline to the period in play, which is ringed while its drop draws out of the dot and its label rises off
  // the baseline. Periods behind stay, periods ahead wait faint. The run ends on the complete figure.
  // One clock: 160ms fast, 480ms step, every delay a multiple of 160ms.
  // The viewer's hover and focus skin every node with a glow and an accent outline; a period has no box to outline,
  // so it takes its ring instead: ink under the pointer or a find match, the accent while it is the one in focus
  var motionCss = (root, t) => `
    ${root} g.node, ${root} g.node:hover, ${root} g.node.mmd-selected { filter: none !important; }
    ${root} g.node > .timeline-hit { stroke: none !important; fill: transparent !important; }
    ${root} g.node > circle:not(.tl-ring) { stroke: none !important; }
    ${root} g.node > .tl-ring { stroke: ${t.ink} !important; stroke-width: 1px !important; fill: none !important; }
    ${root} g.node:hover > .tl-ring, ${root} g.node.mmd-match > .tl-ring, ${root} g.node.mmd-selected > .tl-ring { opacity: 1; }
    ${root} g.node.mmd-selected > .tl-ring { stroke: ${t.accent} !important; stroke-width: 1.5px !important; }
    ${root} .tl-progress { stroke-dasharray: 1 1; stroke-dashoffset: 1; opacity: 0; pointer-events: none;
      transition: stroke-dashoffset 480ms cubic-bezier(.2,.8,.2,1), opacity 160ms linear; }
    ${root}.tl-motion .tl-progress { opacity: 1; }
    ${root} .tl-ring { opacity: 0; pointer-events: none; transition: opacity 160ms linear; }
    ${root}.tl-motion [data-tl=now] .tl-ring { opacity: 1; transition-delay: 320ms; }
    ${root} .timeline-period, ${root} .tl-label { transition: opacity 480ms cubic-bezier(.2,.8,.2,1), transform 480ms cubic-bezier(.2,.8,.2,1); }
    ${root} .tl-drop { stroke-dasharray: 1 1; stroke-dashoffset: 0; transition: stroke-dashoffset 480ms cubic-bezier(.2,.8,.2,1); }
    ${root}.tl-motion [data-tl=wait] { opacity: .12; }
    ${root}.tl-motion [data-tl=wait] .tl-drop { stroke-dashoffset: 1; }
    ${root}.tl-motion [data-tl=wait] .tl-label { opacity: 0; }
    ${root}.tl-motion [data-tl=wait] .tl-up { transform: translateY(8px); }
    ${root}.tl-motion [data-tl=wait] .tl-down { transform: translateY(-8px); }
    ${root}.tl-motion [data-tl=now], ${root}.tl-motion [data-tl=now] .tl-drop { transition-delay: 160ms; }
    ${root}.tl-motion [data-tl=now] .tl-label { transition-delay: 320ms; }
    @media (prefers-reduced-motion: reduce) {
      ${root} * { transition: none !important; }
    }
    @media print {
      ${root} .tl-progress, ${root} .tl-ring { display: none; }
      ${root} [data-tl], ${root} .tl-label { opacity: 1 !important; transform: none !important; }
      ${root} .tl-drop { stroke-dashoffset: 0 !important; }
    }`

  // the steps of a run over a drawn timeline, and frame(i) to show step i: below 0 or past the end is the complete
  // figure. At most eight steps: a longer timeline steps by section, or else by even runs of periods
  var motion = (svg) => {
    var meta = svg.querySelector('metadata.timeline-model')
    var info
    try {
      info = JSON.parse(meta.textContent)
    }
    catch (err) {
      return null
    }
    var ids = Object.keys(info.nodes)
    var groups = []
    var sections = ids.reduce((list, key) => {
      var name = info.nodes[key].section
      if (!list.length || list[list.length - 1].name !== name) list.push({name, keys: []})
      list[list.length - 1].keys.push(key)
      return list
    }, [])
    if (ids.length <= 8) ids.forEach((key) => groups.push({keys: [key], name: ''}))
    else if (sections.length > 1 && sections.length <= 8) groups = sections
    else {
      var size = Math.ceil(ids.length / 8)
      for (var i = 0; i < ids.length; i += size) groups.push({keys: ids.slice(i, i + size), name: ''})
    }
    var els = ids.map((key) => svg.querySelector('[id="' + svg.id + '-timeline-' + key + '-0"]'))
    var progress = svg.querySelector('.tl-progress')
    var [from, to] = info.axis
    var at = {}
    groups.forEach((group, g) => group.keys.forEach((key) => (at[key] = g)))
    var steps = groups.map((group) => {
      var first = info.nodes[group.keys[0]]
      var last = info.nodes[group.keys[group.keys.length - 1]]
      var span = group.keys.length > 1 ? first.name + ' – ' + last.name : first.name
      var said = group.keys.length > 1 ? group.name : first.events.join(', ')
      return {label: said ? span + ' · ' + said : span, x: last.x}
    })
    var frame = (i) => {
      var on = i >= 0 && i < steps.length
      svg.classList.toggle('tl-motion', on)
      ids.forEach((key, k) => {
        if (!els[k]) return
        on ? els[k].setAttribute('data-tl', at[key] < i ? 'done' : at[key] === i ? 'now' : 'wait') : els[k].removeAttribute('data-tl')
      })
      if (progress) progress.style.strokeDashoffset = on ? String(1 - (steps[i].x - from) / (to - from || 1)) : ''
    }
    return {steps, frame}
  }

  return {parse, render, motion}
})()
