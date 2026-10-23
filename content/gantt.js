// Mermaid gantt charts drawn to the diagram-design gantt: task names in a left column, hairline bars on a dated axis,
// sections as ink-wash phase zones under a tracked eyebrow. The critical path takes the accent, done work recedes,
// the active task carries an ink outline. Syntax that is not understood falls back to mermaid itself, see render()
var gantt = (() => {
  var DAY = 86400000
  var UNITS = {ms: 1, s: 1000, m: 60000, h: 3600000, d: DAY, w: 7 * DAY}
  var TAGS = ['done', 'active', 'crit', 'milestone', 'vert']

  // a dateFormat as a regex over its tokens, only the numeric ones are understood
  var dateParser = (format) => {
    var fields = []
    var source = format.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/YYYY|MM|DD|HH|mm|ss|M|D|H/g, (token) => {
      fields.push(token[0] === 'Y' ? 'Y' : token === 'mm' ? 'n' : token === 'ss' ? 's' : token[0])
      return token.length === 4 ? '(\\d{4})' : token.length === 2 ? '(\\d{2})' : '(\\d{1,2})'
    })
    if (!fields.includes('Y') || !fields.includes('M') || !fields.includes('D')) return null
    var regex = new RegExp('^' + source + '$')
    return (text) => {
      var match = regex.exec(text)
      if (!match) return null
      var v = {Y: 0, M: 1, D: 1, H: 0, n: 0, s: 0}
      fields.forEach((f, i) => (v[f] = parseInt(match[i + 1], 10)))
      return Date.UTC(v.Y, v.M - 1, v.D, v.H, v.n, v.s)
    }
  }

  var duration = (text) => {
    var match = /^(\d+(?:\.\d+)?)(ms|s|m|h|d|w)$/.exec(text)
    return match ? parseFloat(match[1]) * UNITS[match[2]] : null
  }

  var weekend = (time) => {
    var day = new Date(time).getUTCDay()
    return day === 0 || day === 6
  }

  var parse = (src) => {
    var lines = draw.lines(src)
    if (!lines) return null
    var model = {title: '', dateFormat: 'YYYY-MM-DD', axisFormat: '', tickInterval: '', weekends: false, today: true, sections: [], links: {}}
    var head = false
    var section = null
    var skip = false
    var raw = []
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].replace(/%%.*$/, '').trim()
      if (!line) continue
      if (!head) {
        if (!/^gantt$/i.test(line)) return null
        head = true
        continue
      }
      if (skip) {
        skip = !line.includes('}')
        continue
      }
      var found
      if (/^acc(Title|Descr)\b/.test(line)) skip = /\{\s*$/.test(line)
      else if ((found = /^title\s+(.*)$/i.exec(line))) model.title = found[1].trim()
      else if ((found = /^dateFormat\s+(.*)$/i.exec(line))) model.dateFormat = found[1].trim()
      else if ((found = /^axisFormat\s+(.*)$/i.exec(line))) model.axisFormat = found[1].trim()
      else if ((found = /^tickInterval\s+(.*)$/i.exec(line))) model.tickInterval = found[1].trim()
      else if ((found = /^todayMarker\s+(.*)$/i.exec(line))) model.today = found[1].trim() !== 'off'
      else if ((found = /^excludes\s+(.*)$/i.exec(line))) {
        var rest = found[1].split(/[\s,]+/).filter(Boolean)
        if (rest.some((w) => !/^weekends?$/i.test(w))) return null
        model.weekends = true
      }
      else if ((found = /^section\s*(.*)$/i.exec(line))) {
        section = {name: found[1].trim(), tasks: []}
        model.sections.push(section)
      }
      else if ((found = /^click\s+(\S+)\s+href\s+"([^"]*)"/i.exec(line))) {
        found[1].split(',').forEach((id) => (model.links[id.trim()] = found[2]))
      }
      // a click that calls a function needs the page's script, the task stays a plain bar
      else if (/^click\s/i.test(line)) continue
      // switches the drawing does not follow: let mermaid draw the chart
      else if (/^(displayMode|includes|inclusiveEndDates|topAxis|weekday|weekend)\b/i.test(line)) return null
      else {
        var colon = line.indexOf(':')
        if (colon < 1) return null
        if (!section) {
          section = {name: '', tasks: []}
          model.sections.push(section)
        }
        var task = {name: line.slice(0, colon).trim(), section: section.name, tags: []}
        var meta = line.slice(colon + 1).split(',').map((m) => m.trim()).filter(Boolean)
        while (meta.length && TAGS.includes(meta[0])) task.tags.push(meta.shift())
        if (meta.length > 3 || !meta.length) return null
        if (meta.length === 3) task.id = meta.shift()
        if (meta.length === 2) task.start = meta.shift()
        task.end = meta[0]
        section.tasks.push(task)
        raw.push(task)
      }
    }
    if (!head || !raw.length) return null

    var date = dateParser(model.dateFormat)
    if (!date) return null
    // ids and dates, in source order: a task without a start begins where the one above it ended
    var byId = {}
    var previous = null
    for (var k = 0; k < raw.length; k++) {
      var task = raw[k]
      task.id = task.id || 'task' + (k + 1)
      if (task.start === undefined) {
        if (!previous) return null
        task.from = previous.to
      }
      else if (/^after\s/.test(task.start)) {
        var refs = task.start.split(/\s+/).slice(1).map((r) => byId[r])
        if (!refs.length || refs.some((r) => !r)) return null
        task.from = Math.max(...refs.map((r) => r.to))
        task.after = task.start.split(/\s+/).slice(1)
      }
      else {
        task.from = date(task.start)
        if (task.from === null) return null
      }
      var length = duration(task.end)
      if (length !== null) {
        task.to = task.from + length
        // excluded days do not count toward a duration, each one pushes the end a day further. As in mermaid the bar
        // stops where the last working day ends (until), the next task still starts after the skipped days (to)
        if (model.weekends && length >= DAY) {
          var off = false
          for (var at = task.from; at <= task.to; at += DAY) {
            if (!off) task.until = task.to
            off = weekend(at)
            if (off) task.to += DAY
          }
        }
      }
      else {
        task.to = date(task.end)
        if (task.to === null) return null
      }
      if (task.to < task.from) return null
      if (task.until === undefined) task.until = task.to
      byId[task.id] = task
      previous = task
    }
    model.tasks = raw
    return model
  }

  var {esc, num, grid, measure, fit} = draw

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  var pad = (v, n) => String(v).padStart(n || 2, '0')
  var strftime = (format, time) => {
    var d = new Date(time)
    return format.replace(/%([a-zA-Z%])/g, (all, c) => ({
      d: pad(d.getUTCDate()), e: String(d.getUTCDate()), m: pad(d.getUTCMonth() + 1), Y: String(d.getUTCFullYear()),
      y: pad(d.getUTCFullYear() % 100), b: MONTHS[d.getUTCMonth()].slice(0, 3), B: MONTHS[d.getUTCMonth()],
      a: DAYS[d.getUTCDay()].slice(0, 3), A: DAYS[d.getUTCDay()], H: pad(d.getUTCHours()), M: pad(d.getUTCMinutes()),
      j: pad(Math.floor((time - Date.UTC(d.getUTCFullYear(), 0, 1)) / DAY) + 1, 3), '%': '%'
    }[c] ?? all))
  }

  // tick times between from and to: every n units, days and weeks on calendar boundaries (weeks start on Sunday).
  // null past limit ticks: the walk stops there, a fine step over a long chart would otherwise freeze the page
  var ticks = (interval, from, to, limit) => {
    var out = []
    var d = new Date(from)
    if (interval.unit === 'month') {
      var at = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
      for (var i = 0; at <= to; i++) {
        if (at >= from && out.push(at) > limit) return null
        at = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + (i + 1) * interval.n, 1)
      }
      return out
    }
    var step = interval.n * (interval.unit === 'week' ? 7 * DAY : interval.unit === 'day' ? DAY : UNITS[interval.unit])
    var start = interval.unit === 'week' ? Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - d.getUTCDay())
      : interval.unit === 'day' ? Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) : Math.floor(from / step) * step
    for (var t = start; t <= to; t += step) if (t >= from && out.push(t) > limit) return null
    return out
  }

  var INTERVAL = {millisecond: 'ms', second: 's', minute: 'm', hour: 'h', day: 'day', week: 'week', month: 'month'}

  var MARGIN = 32
  var ROW = 40
  var BAR = 24
  var HEAD = 28
  var ZONE_GAP = 12
  var AXIS = 32

  // gantt source -> svg markup, or '' when mermaid should draw it. t: the style tokens of mermaid.js
  var render = (src, t, fonts, id) => {
    var model = parse(src)
    if (!model) return ''
    var sans = fonts.sans
    var mono = fonts.mono
    var accent = t.accent
    // the light accent is a bright orange for marks, text on paper needs the darker one
    var accentText = t.accentText
    var has = (task, tag) => task.tags.includes(tag)
    var rows = model.tasks.filter((task) => !has(task, 'vert'))
    var verts = model.tasks.filter((task) => has(task, 'vert'))
    if (!rows.length) return ''

    var from = Math.min(...model.tasks.map((task) => task.from))
    var to = Math.max(...model.tasks.map((task) => task.until))
    if (to === from) to = from + DAY
    var span = to - from

    // the label column fits the longest name, the time area gets a pitch that keeps day-scale charts readable
    var labelW = grid(Math.min(240, Math.max(120, ...rows.map((task) => measure(task.name, 12, sans, 600) + 24))))
    var x0 = MARGIN + labelW + 16
    var timeW = grid(Math.max(480, Math.min(880, (span / DAY) * 20)))
    var right = x0 + timeW
    var zoneRight = right + 12
    var width = zoneRight + MARGIN
    var x = (time) => x0 + ((time - from) / span) * timeW

    // the axis: an explicit tickInterval, or the smallest calendar step that leaves room for its label
    var format = model.axisFormat || '%Y-%m-%d'
    var interval = null
    if (model.tickInterval) {
      var match = /^(\d+)(millisecond|second|minute|hour|day|week|month)$/.exec(model.tickInterval)
      // a zero step never moves on
      if (!match || !parseInt(match[1], 10)) return ''
      interval = {n: parseInt(match[1], 10), unit: INTERVAL[match[2]]}
    }
    else {
      var label = measure(strftime(format, from), 9, mono) + 24
      var steps = [{n: 1, unit: 'h', size: 3600000}, {n: 6, unit: 'h', size: 6 * 3600000}, {n: 1, unit: 'day', size: DAY},
        {n: 2, unit: 'day', size: 2 * DAY}, {n: 1, unit: 'week', size: 7 * DAY}, {n: 2, unit: 'week', size: 14 * DAY},
        {n: 1, unit: 'month', size: 30 * DAY}, {n: 3, unit: 'month', size: 91 * DAY}, {n: 12, unit: 'month', size: 365 * DAY}]
      // a format without a day (or a month) would print the same label on every tick of a finer step
      var floor = /%[HM]/.test(format) ? 0 : /%[deaAj]/.test(format) ? DAY : /%[bBm]/.test(format) ? 30 * DAY : 365 * DAY
      interval = steps.find((s) => s.size >= floor && (s.size / span) * timeW >= label) || steps[steps.length - 1]
    }
    var marks = ticks(interval, from, to, 60)
    if (!marks) return ''

    var body = []
    var y = MARGIN
    if (model.title) {
      body.push(`<text x="${MARGIN}" y="${y + 14}" font-family="${sans}" font-size="16" font-weight="600" fill="${t.ink}">${esc(model.title)}</text>`)
      y += 40
    }
    var axisY = y + AXIS
    y = axisY + 12

    // phase zones, one per section, rows inside
    var zones = []
    var rowY = {}
    model.sections.forEach((section) => {
      var tasks = section.tasks.filter((task) => !has(task, 'vert'))
      if (!tasks.length) return
      var top = y
      var named = !!section.name
      var first = top + (named ? HEAD : 4)
      tasks.forEach((task, i) => (rowY[task.id] = first + i * ROW))
      var bottom = first + tasks.length * ROW + 4
      zones.push({name: section.name, top, bottom})
      y = bottom + ZONE_GAP
    })
    var chartBottom = y - ZONE_GAP
    // task dates are wall-clock times kept as UTC, as mermaid reads them in local time, so now is the local clock too
    var now = Date.now() - new Date().getTimezoneOffset() * 60000
    var today = model.today && now >= from && now <= to
    var footer = verts.length || today ? 24 : 0
    var height = chartBottom + footer + MARGIN

    // zones go first, the grid draws over their wash
    zones.forEach((zone) => {
      body.push(`<rect x="${MARGIN}" y="${zone.top}" width="${zoneRight - MARGIN}" height="${zone.bottom - zone.top}" rx="6" ` +
        `fill="rgba(${t.inkRgb},0.02)" stroke="rgba(${t.inkRgb},0.10)"/>`)
      if (zone.name) {
        body.push(`<text x="${MARGIN + 12}" y="${zone.top + 18}" font-family="${mono}" font-size="8" letter-spacing="1.44" fill="${t.muted}">${esc(zone.name.toUpperCase())}</text>`)
      }
    })

    // excluded weekends as faint bands across the time area
    if (model.weekends) {
      var day = Date.UTC(new Date(from).getUTCFullYear(), new Date(from).getUTCMonth(), new Date(from).getUTCDate())
      for (; day < to; day += DAY) {
        if (!weekend(day)) continue
        var a = Math.max(x(day), x0)
        var b = Math.min(x(day + DAY), right)
        if (b > a) body.push(`<rect x="${num(a)}" y="${axisY}" width="${num(b - a)}" height="${chartBottom - axisY}" fill="rgba(${t.inkRgb},0.035)"/>`)
      }
    }

    // the axis: mono ticks above a solid baseline with a short notch each, no lines through the zones: the only
    // full-height lines are today, the vert markers and the cursor
    body.push(`<path d="M${x0},${axisY}H${right}" stroke="${t.ruleSolid}"/>`)
    marks.forEach((time) => {
      var at = num(x(time))
      body.push(`<path d="M${at},${axisY - 4}V${axisY}" stroke="${t.ruleSolid}"/>` +
        `<text x="${at}" y="${axisY - 10}" text-anchor="middle" font-family="${mono}" font-size="9" fill="${t.muted}">${esc(strftime(format, time))}</text>`)
    })

    // the bars: name in the left column, bar on the axis
    var cards = rows.map((task) => {
      var top = rowY[task.id]
      var crit = has(task, 'crit')
      var done = has(task, 'done')
      var active = has(task, 'active')
      var nameFill = crit ? accentText : done ? t.muted : t.ink
      var g = [`<g class="node gantt-task" id="${id}-gantt-${esc(task.id)}-0">`]
      var name = `<text x="${MARGIN + 12}" y="${top + 20}" dominant-baseline="central" font-family="${sans}" font-size="12" font-weight="600" fill="${nameFill}">${esc(fit(task.name, labelW - 24, 12, sans, 600))}</text>`
      var link = model.links[task.id]
      g.push(link && /^https?:/i.test(link) ? `<a href="${esc(link)}" target="_blank" rel="noopener">${name}</a>` : name)
      var a = x(task.from)
      var b = x(task.until)
      if (has(task, 'milestone')) {
        var cx = num((a + b) / 2)
        var cy = top + 20
        g.push(`<path d="M${cx},${cy - 8}L${cx + 8},${cy}L${cx},${cy + 8}L${cx - 8},${cy}Z" fill="${crit ? accent : t.ink}" stroke="${t.paper}" stroke-width="1.5"/>`)
      }
      else {
        var w = Math.max(b - a, 4)
        var fill = crit ? t.accentTint : done ? `rgba(${t.inkRgb},0.05)` : active ? t.node : `rgba(${t.mutedRgb || t.inkRgb},0.15)`
        var stroke = crit ? accent : done ? t.ruleSolid : active ? t.ink : t.muted
        var weight = active ? (crit ? 1.6 : 1.4) : 1
        // an opaque mask first, so the grid stays behind a translucent bar
        g.push(`<rect x="${num(a)}" y="${top + 8}" width="${num(w)}" height="${BAR}" rx="4" fill="${t.paper}"/>`,
          `<rect class="gantt-bar" x="${num(a)}" y="${top + 8}" width="${num(w)}" height="${BAR}" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="${weight}"${done && crit ? ' stroke-opacity="0.5"' : ''}/>`)
      }
      g.push('</g>')
      return g.join('')
    })

    // vertical markers run the full height, their name under the chart
    var lines = verts.map((task) => {
      var at = num(x(task.from))
      return `<g class="gantt-vert"><path d="M${at},${axisY}V${chartBottom + 6}" stroke="${t.muted}" stroke-dasharray="4 3"/>` +
        `<text x="${at}" y="${chartBottom + 18}" text-anchor="middle" font-family="${mono}" font-size="8" letter-spacing="1.12" fill="${t.muted}">${esc(task.name.toUpperCase())}</text></g>`
    })

    // today, when it falls inside the chart
    if (today) {
      var tx = num(x(now))
      lines.push(`<g class="gantt-today"><path d="M${tx},${axisY}V${chartBottom}" stroke="${accent}"/>` +
        `<text x="${tx}" y="${chartBottom + 12}" text-anchor="middle" font-family="${mono}" font-size="8" letter-spacing="1.12" fill="${accentText}">TODAY</text></g>`)
    }

    // the cursor: a hairline that follows the pointer across the time area and names the date under it, see bind().
    // A chart that spans less than two days reads to the minute
    var cursorFormat = span < 2 * DAY ? '%a %d %b %Y %H:%M' : '%a %d %b %Y'
    lines.push(`<g class="gantt-cursor" display="none" pointer-events="none" data-x0="${x0}" data-x1="${right}" data-from="${from}" data-to="${to}" ` +
      `data-top="${axisY}" data-bottom="${chartBottom}" data-format="${cursorFormat}">` +
      `<path d="M0,${axisY}V${chartBottom}" stroke="${t.ink}" stroke-opacity="0.55"/>` +
      `<rect x="0" y="${axisY - 24}" width="0" height="18" rx="2" fill="${t.ink}"/>` +
      `<text x="0" y="${axisY - 15}" text-anchor="middle" dominant-baseline="central" font-family="${mono}" font-size="9" letter-spacing="0.5" fill="${t.paper}"></text></g>`)

    var iso = (time) => new Date(time).toISOString().slice(0, 10)
    var info = {nodes: {}}
    rows.forEach((task) => {
      info.nodes[task.id] = {name: task.name, section: task.section, start: iso(task.from), end: iso(task.until), tags: task.tags, after: task.after || []}
    })
    var critical = rows.filter((task) => has(task, 'crit')).map((task) => task.name)
    var summary = `${model.title || 'Gantt chart'}: ${rows.length} tasks from ${iso(from)} to ${iso(to)}` +
      (critical.length ? `, critical path ${critical.join(', ')}` : '')

    return [`<svg xmlns="http://www.w3.org/2000/svg" id="${id}" width="100%" style="max-width: ${width}px;" viewBox="0 0 ${width} ${num(height)}" ` +
      `role="graphics-document document" aria-roledescription="gantt" font-family="${esc(sans)}">`,
      `<title>${esc(model.title || 'Gantt chart')}</title><desc>${esc(summary)}</desc>`,
      body.join(''), cards.join(''), lines.join(''),
      `<metadata class="gantt-model">${esc(JSON.stringify(info))}</metadata>`, '</svg>'].join('')
  }

  // the cursor follows the pointer over a drawn chart; the chart may be scaled or panned, so the pointer is mapped
  // through the svg's own screen matrix
  var bind = (svg) => {
    var cursor = svg.querySelector('g.gantt-cursor')
    if (!cursor || cursor.dataset.bound) return
    cursor.dataset.bound = '1'
    var d = cursor.dataset
    var x0 = +d.x0
    var x1 = +d.x1
    var from = +d.from
    var to = +d.to
    var line = cursor.querySelector('path')
    var chip = cursor.querySelector('rect')
    var label = cursor.querySelector('text')
    var hide = () => cursor.setAttribute('display', 'none')
    svg.addEventListener('pointermove', (e) => {
      var matrix = svg.getScreenCTM()
      if (!matrix) return
      var p = svg.createSVGPoint()
      p.x = e.clientX
      p.y = e.clientY
      p = p.matrixTransform(matrix.inverse())
      if (p.x < x0 || p.x > x1 || p.y < +d.top - 28 || p.y > +d.bottom) return hide()
      var at = Math.round(p.x * 2) / 2
      label.textContent = strftime(d.format, from + ((p.x - x0) / (x1 - x0)) * (to - from))
      cursor.removeAttribute('display')
      line.setAttribute('d', `M${at},${d.top}V${d.bottom}`)
      var w = Math.ceil(label.getComputedTextLength()) + 12
      // the chip stays inside the time area at both ends
      var cx = Math.min(Math.max(at, x0 + w / 2), x1 - w / 2)
      chip.setAttribute('x', cx - w / 2)
      chip.setAttribute('width', w)
      label.setAttribute('x', cx)
    })
    svg.addEventListener('pointerleave', hide)
  }

  return {parse, render, bind}
})()
