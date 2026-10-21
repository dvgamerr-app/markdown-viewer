var mmd = (() => {
  // Firefox content scripts reach the page window through an Xray wrapper whose builtins lack their methods, the GWT code bundled in mermaid calls window.Math.max
  if (window.Math !== Math) {
    try {
      Object.defineProperty(window, 'Math', {value: Math, configurable: true, writable: true})
    }
    catch (err) {
      window.Math = Math
    }
  }
  var loaded = false

  var walk = (regex, string, result = [], match = regex.exec(string)) =>
    !match ? result : walk(regex, string, result.concat(match[1]))

  // diagram-design style guide tokens
  var tokens = {
    light: {
      paper: '#f5f5f5', paper2: '#ececec', node: '#ffffff',
      ink: '#2d3142', muted: '#4f5d75', soft: '#7a8399',
      rule: 'rgba(45,49,66,0.12)', ruleSolid: '#bfc0c0',
      accent: '#eb6c36', accentTint: 'rgba(235,108,54,0.08)', link: '#2e5aa8',
      series: ['#7c8f6f', '#5e7a9b', '#b8915a', '#9c6b50', '#6e6479'],
      inkRgb: '45,49,66'
    },
    dark: {
      // nimbus-dark palette (scripts/nimbus/dark.css) as hex, mermaid cannot parse oklch
      paper: '#020202', paper2: '#0f0f0f', node: '#0f0f0f',
      ink: '#f5f5f5', muted: '#dedede', soft: '#a3a3a3',
      rule: 'rgba(245,245,245,0.12)', ruleSolid: '#404040',
      accent: '#79b1f9', accentTint: 'rgba(121,177,249,0.10)', link: '#79b1f9',
      series: ['#69ba7c', '#79b1f9', '#dcaf61', '#f07f77', '#a3a3a3'],
      inkRgb: '245,245,245'
    }
  }

  var sans = "'Geist', 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif"
  var mono = "'Geist Mono', ui-monospace, 'SFMono-Regular', Consolas, monospace"

  var variables = (t) => ({
    fontFamily: sans,
    fontSize: '13px',
    background: t.paper,
    // nodes
    primaryColor: t.node,
    primaryTextColor: t.ink,
    primaryBorderColor: t.ink,
    secondaryColor: t.paper2,
    secondaryTextColor: t.ink,
    secondaryBorderColor: t.muted,
    tertiaryColor: t.paper,
    tertiaryTextColor: t.ink,
    tertiaryBorderColor: t.ruleSolid,
    mainBkg: t.node,
    nodeBorder: t.ink,
    nodeTextColor: t.ink,
    textColor: t.ink,
    titleColor: t.ink,
    // edges
    lineColor: t.muted,
    arrowheadColor: t.muted,
    edgeLabelBackground: t.paper,
    // subgraphs
    clusterBkg: `rgba(${t.inkRgb},0.03)`,
    clusterBorder: t.ruleSolid,
    // notes
    noteBkgColor: t.accentTint,
    noteBorderColor: t.accent,
    noteTextColor: t.ink,
    // sequence
    actorBkg: t.node,
    actorBorder: t.ink,
    actorTextColor: t.ink,
    actorLineColor: t.ruleSolid,
    signalColor: t.muted,
    signalTextColor: t.ink,
    labelBoxBkgColor: t.paper,
    labelBoxBorderColor: t.ruleSolid,
    labelTextColor: t.ink,
    loopTextColor: t.soft,
    activationBkgColor: t.paper2,
    activationBorderColor: t.muted,
    sequenceNumberColor: t.paper,
    // state
    labelColor: t.ink,
    altBackground: t.paper2,
    compositeBackground: t.paper,
    compositeTitleBackground: t.paper2,
    // class / er
    classText: t.ink,
    attributeBackgroundColorOdd: t.node,
    attributeBackgroundColorEven: t.paper2,
    // gantt
    sectionBkgColor: `rgba(${t.inkRgb},0.04)`,
    altSectionBkgColor: 'transparent',
    sectionBkgColor2: `rgba(${t.inkRgb},0.02)`,
    taskBkgColor: t.paper2,
    taskBorderColor: t.muted,
    taskTextColor: t.ink,
    taskTextLightColor: t.ink,
    taskTextOutsideColor: t.ink,
    taskTextDarkColor: t.ink,
    activeTaskBkgColor: t.node,
    activeTaskBorderColor: t.ink,
    doneTaskBkgColor: `rgba(${t.inkRgb},0.08)`,
    doneTaskBorderColor: t.soft,
    critBkgColor: t.accentTint,
    critBorderColor: t.accent,
    todayLineColor: t.accent,
    gridColor: t.rule,
    // pie / journey / mindmap
    pie1: t.accent, pie2: t.series[1], pie3: t.series[0], pie4: t.series[2],
    pie5: t.series[3], pie6: t.series[4], pie7: t.muted, pie8: t.soft,
    pieStrokeColor: t.paper,
    pieOuterStrokeColor: t.ruleSolid,
    pieTitleTextColor: t.ink,
    pieSectionTextColor: t.paper,
    pieLegendTextColor: t.ink,
    pieOpacity: '0.9',
    cScale0: t.accent, cScale1: t.series[1], cScale2: t.series[0], cScale3: t.series[2],
    cScale4: t.series[3], cScale5: t.series[4], cScale6: t.muted, cScale7: t.soft,
    // git
    git0: t.accent, git1: t.link, git2: t.series[0], git3: t.series[2],
    git4: t.series[3], git5: t.series[4], git6: t.muted, git7: t.soft,
    commitLabelColor: t.ink,
    commitLabelBackground: t.paper,
    // quadrant
    quadrant1Fill: t.accentTint, quadrant2Fill: `rgba(${t.inkRgb},0.03)`,
    quadrant3Fill: t.paper, quadrant4Fill: `rgba(${t.inkRgb},0.03)`,
    quadrant1TextFill: t.ink, quadrant2TextFill: t.ink,
    quadrant3TextFill: t.ink, quadrant4TextFill: t.ink,
    quadrantPointFill: t.accent,
    quadrantPointTextFill: t.ink,
    quadrantTitleFill: t.ink,
    quadrantXAxisTextFill: t.soft,
    quadrantYAxisTextFill: t.soft,
    quadrantInternalBorderStrokeFill: t.ruleSolid,
    quadrantExternalBorderStrokeFill: t.ruleSolid
  })

  // editorial skin: hairline strokes, 6px radius, no shadows, mono for technical labels
  // node classes usable from markdown: A:::focal, A:::store, A:::external, A:::input, A:::optional, A:::security
  var css = (t) => `
    * { filter: none !important; }
    .node rect, .node polygon, .node circle, .node ellipse, .node path,
    .actor, .note, .labelBox, rect.task, .cluster rect, .er.entityBox,
    .stateGroup rect, .classGroup rect {
      stroke-width: 1px !important;
    }
    .node rect, .actor, rect.actor, .cluster rect, .note, .er.entityBox,
    .statediagram-state rect, .classGroup rect, rect.task { rx: 6px; ry: 6px; }
    .cluster rect { rx: 8px; ry: 8px; stroke-dasharray: 4 4; fill: ${t.paper} !important; }
    .cluster-label, .cluster-label span, .cluster .nodeLabel {
      font-family: ${mono} !important; font-size: 10px !important;
      letter-spacing: 0.12em; text-transform: uppercase; color: ${t.soft} !important; fill: ${t.soft} !important;
    }
    .nodeLabel, .node .label { font-weight: 600; color: ${t.ink}; }
    .flowchart-link, .edgePath .path, .messageLine0, .messageLine1, .relation, .transition {
      stroke-width: 1px !important;
    }
    .edgeLabel, .edgeLabel span, .edgeLabel p, .messageText, .labelText, .loopText, .er.relationshipLabel {
      font-family: ${mono} !important; font-size: 11px !important; letter-spacing: 0.04em;
    }
    .edgeLabel, .edgeLabel rect, .edgeLabel p, .labelBkg { background-color: ${t.paper} !important; fill: ${t.paper} !important; }
    .edgeLabel span, .edgeLabel p { color: ${t.soft} !important; padding: 0 4px; }
    .edgeLabel foreignObject { overflow: visible; }
    .edgeLabel foreignObject > div { transform: translateY(-12px); }
    line[id^=actor] { stroke: ${t.ruleSolid} !important; stroke-width: 1px !important; stroke-dasharray: 4 3; }
    .loopLine { stroke: ${t.ruleSolid} !important; stroke-dasharray: 4 3; }
    .titleText, .pieTitleText { font-family: 'Instrument Serif', Georgia, serif !important; font-size: 22px !important; font-weight: 400 !important; }
    .sectionTitle, .tick text, .taskText, .taskTextOutsideRight, .taskTextOutsideLeft {
      font-family: ${mono} !important;
    }
    .grid .tick line { stroke: ${t.rule} !important; }

    .focal > rect, .focal > polygon, .focal > circle, .focal > path {
      fill: ${t.accentTint} !important; stroke: ${t.accent} !important; stroke-width: 1.2px !important;
    }
    .store > rect, .store > polygon, .store > circle, .store > path {
      fill: rgba(${t.inkRgb},0.05) !important; stroke: ${t.muted} !important;
    }
    .external > rect, .external > polygon, .external > circle, .external > path {
      fill: rgba(${t.inkRgb},0.03) !important; stroke: rgba(${t.inkRgb},0.30) !important;
    }
    .input > rect, .input > polygon, .input > circle, .input > path {
      fill: ${t.paper2} !important; stroke: ${t.soft} !important;
    }
    .optional > rect, .optional > polygon, .optional > circle, .optional > path {
      fill: rgba(${t.inkRgb},0.02) !important; stroke: rgba(${t.inkRgb},0.20) !important; stroke-dasharray: 4 3;
    }
    .security > rect, .security > polygon, .security > circle, .security > path {
      fill: ${t.accentTint} !important; stroke: ${t.accent} !important; stroke-opacity: 0.5; stroke-dasharray: 4 4;
    }
  `

  var icons = {
    fullscreen: '<path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"/>',
    exit: '<path d="M6 2v4H2M14 6h-4V2M10 14v-4h4M2 10h4v4"/>',
    zoomIn: '<path d="M8 3v10M3 8h10"/>',
    zoomOut: '<path d="M3 8h10"/>',
    reset: '<path d="M3 8a5 5 0 1 0 1.5-3.5M3 2v3h3"/>',
    find: '<circle cx="7" cy="7" r="4"/><path d="M10 10l4 4"/>',
    map: '<rect x="2" y="3" width="12" height="10" rx="1.5"/><rect x="8" y="7" width="4" height="4" rx=".5"/>'
  }
  var icon = (name) =>
    `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`

  // mouse wheels send one large delta per notch (line mode in firefox); touchpads stream small
  // or horizontal deltas. once a gesture looks like a touchpad, keep it until the stream pauses
  var lastTrackpad = -Infinity
  var trackpad = (e) => {
    if (e.deltaMode !== 0) return false
    if (e.deltaX !== 0 || Math.abs(e.deltaY) < 30 || e.timeStamp - lastTrackpad < 150) {
      lastTrackpad = e.timeStamp
      return true
    }
    return false
  }

  // fullscreen fills the browser viewport only, not the screen
  var fullscreen = (pre, active) => {
    pre.classList.toggle('mmd-fullscreen', active)
    document.documentElement.classList.toggle('_mmd-fullscreen', active)
    pre._mmdFullscreen && pre._mmdFullscreen()
  }
  document.addEventListener('keydown', (e) => {
    var pre = document.querySelector('pre.mmd-fullscreen')
    if (!pre || e.ctrlKey || e.metaKey || e.altKey) return
    // the diagram handles its own keys first (focus, find, zoom, move), escape then leaves fullscreen
    if (pre._mmdKey && pre._mmdKey(e)) return e.preventDefault()
    if (e.key === 'Escape') fullscreen(pre, false)
  })

  // fullscreen + zoom controls; zoom/move only work in fullscreen, inline the diagram is static
  // mouse: wheel zoom, drag move | touchpad: pinch zoom, two-finger move | touch: pinch zoom, drag move
  var toolbar = (pre, panzoom) => {
    var old = pre.querySelector(':scope > .mmd-toolbar')
    if (old) old.remove()

    var bar = document.createElement('div')
    bar.className = 'mmd-toolbar'
    var button = (name, title, onclick) => {
      var btn = document.createElement('button')
      btn.type = 'button'
      btn.title = title
      btn.dataset.action = name
      btn.innerHTML = icon(name)
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        onclick(btn)
      })
      bar.appendChild(btn)
      return btn
    }
    var find = button('find', 'Find node (/)', () => openFind())
    var mapButton = button('map', 'Overview map (M)', () => toggleMap())
    button('zoomIn', 'Zoom in (+)', () => panzoom.zoomIn())
    var level = document.createElement('span')
    level.className = 'mmd-level'
    level.title = 'Reset (0)'
    level.addEventListener('click', (e) => {
      e.stopPropagation()
      panzoom.reset()
    })
    bar.appendChild(level)
    button('zoomOut', 'Zoom out (-)', () => panzoom.zoomOut())
    button('reset', 'Reset (0)', () => panzoom.reset())
    var full = button('fullscreen', 'Fullscreen', () =>
      fullscreen(pre, !pre.classList.contains('mmd-fullscreen'))
    )
    bar.addEventListener('pointerdown', (e) => e.stopPropagation())
    pre.appendChild(bar)

    var code = pre.querySelector(':scope > code.mermaid')
    var svg = code.querySelector('svg')
    var active = () => pre.classList.contains('mmd-fullscreen')

    // flowchart nodes: click to focus a node and its direct links, everything else dims
    // mermaid prefixes every id with the svg id: node "<svg>-flowchart-A-0", edge "<svg>-L_A_B_0"
    var local = (id) => (id.startsWith(svg.id + '-') ? id.slice(svg.id.length + 1) : id)
    var nodes = Array.from(svg.querySelectorAll('g.node')).map((el) => {
      var match = /^flowchart-(.+)-\d+$/.exec(local(el.id))
      return {el, id: (match && match[1]) || '', label: el.textContent.trim()}
    }).filter((n) => n.id)
    var kinds = ['focal', 'store', 'external', 'input', 'optional', 'security']
    var byId = new Map(nodes.map((n) => [n.id, n]))
    // node ids may hold underscores, so split "L_<from>_<to>_<n>" at the point where both sides are known nodes
    var ends = (id) => {
      var match = /^L_(.+)_\d+$/.exec(local(id))
      var parts = match ? match[1].split('_') : []
      for (var i = 1; i < parts.length; i++) {
        var from = parts.slice(0, i).join('_')
        var to = parts.slice(i).join('_')
        if (byId.has(from) && byId.has(to)) return {from, to}
      }
      return null
    }
    var edges = Array.from(svg.querySelectorAll('path.flowchart-link')).map((el) => {
      var pair = ends(el.id)
      if (!pair) return null
      var label = svg.querySelector('.edgeLabel [data-id="' + local(el.id) + '"]')
      return {el, from: pair.from, to: pair.to, label: label ? label.closest('.edgeLabel') : null}
    }).filter(Boolean)
    var h = (tag, cls, text) => {
      var el = document.createElement(tag)
      el.className = cls
      if (text != null) el.textContent = text
      return el
    }

    // one-shot pulse that travels along an edge in its drawn direction
    var flow = (edge, dir, delay = 0) => {
      var line = edge.el.cloneNode(false)
      line.removeAttribute('id')
      line.removeAttribute('style')
      line.removeAttribute('marker-end')
      line.removeAttribute('marker-start')
      line.setAttribute('class', 'mmd-flow')
      line.setAttribute('pathLength', '1')
      line.dataset.dir = dir
      line.style.animationDelay = delay + 's'
      edge.el.parentNode.appendChild(line)
      return line
    }

    // the edges and nodes reached from a node: direct links, or everything up/downstream of it
    var trace = (id, reach) => {
      var shown = new Set([id])
      var used = []
      if (!reach) {
        edges.forEach((e) => {
          if (e.from !== id && e.to !== id) return
          used.push(e)
          shown.add(e.from).add(e.to)
        })
        return {shown, used}
      }
      var queue = [id]
      while (queue.length) {
        var current = queue.shift()
        edges.forEach((e) => {
          var next = reach === 'down' ? e.from === current && e.to : e.to === current && e.from
          if (!next) return
          if (!used.includes(e)) used.push(e)
          if (!shown.has(next)) {
            shown.add(next)
            queue.push(next)
          }
        })
      }
      return {shown, used}
    }

    // popup card for the focused node: kind, links, up/downstream reach, clickable relations
    var card = h('div', 'mmd-card')
    card.hidden = true
    ;['pointerdown', 'click', 'dblclick', 'wheel'].forEach((type) => card.addEventListener(type, (e) => e.stopPropagation()))
    pre.appendChild(card)
    var drawCard = (id, reach) => {
      card.replaceChildren()
      card.hidden = !id
      if (!id) return
      var node = byId.get(id)
      var kind = kinds.find((k) => node.el.classList.contains(k)) || 'node'
      var head = h('div', 'mmd-card-head')
      var copy = h('div', 'mmd-card-copy')
      copy.append(h('span', 'mmd-card-eyebrow', 'Node'), h('strong', 'mmd-card-title', node.label))
      var close = h('button', 'mmd-card-close', '×')
      close.type = 'button'
      close.title = 'Close (Esc)'
      close.addEventListener('click', () => focus(null))
      head.append(copy, close)

      var meta = h('div', 'mmd-card-meta')
      meta.append(h('span', 'mmd-chip', kind), h('code', 'mmd-chip', id))

      var incoming = edges.filter((e) => e.to === id)
      var outgoing = edges.filter((e) => e.from === id)
      var summary = h('p', 'mmd-card-summary', incoming.length + ' in · ' + outgoing.length + ' out')

      var reachBar = h('div', 'mmd-card-reach')
      reachBar.append(h('span', 'mmd-card-label', 'Reach'))
      ;[['up', 'Upstream'], ['down', 'Downstream']].forEach(([dir, text]) => {
        var count = trace(id, dir).shown.size - 1
        var btn = h('button', '')
        btn.type = 'button'
        btn.disabled = !count
        btn.setAttribute('aria-pressed', String(reach === dir))
        btn.append(h('span', '', text), h('strong', '', String(count)))
        btn.addEventListener('click', () => focus(id, reach === dir ? null : dir))
        reachBar.appendChild(btn)
      })

      var list = h('div', 'mmd-card-list')
      incoming.concat(outgoing.filter((e) => !incoming.includes(e))).forEach((edge) => {
        var out = edge.from === id
        var otherId = out ? edge.to : edge.from
        var other = byId.get(otherId)
        if (!other) return
        var row = h('button', 'mmd-row')
        row.type = 'button'
        row.dataset.dir = out ? 'out' : 'in'
        var text = h('span', 'mmd-row-copy')
        text.append(h('strong', '', other.label))
        var via = edge.label && edge.label.textContent.trim()
        via && text.append(h('small', '', via))
        row.append(h('span', 'mmd-row-dir', out ? '→' : '←'), text)
        var preview = null
        var on = () => {
          edge.el.classList.add('mmd-peek')
          preview = flow(edge, out ? 'out' : 'in')
        }
        var off = () => {
          edge.el.classList.remove('mmd-peek')
          preview && preview.remove()
        }
        row.addEventListener('mouseenter', on)
        row.addEventListener('focus', on)
        row.addEventListener('mouseleave', off)
        row.addEventListener('blur', off)
        row.addEventListener('click', () => {
          focus(otherId)
          center(other.el)
        })
        list.appendChild(row)
      })
      card.append(head, meta, summary, reachBar, list)
    }

    var focused = null
    var focus = (id, reach = null) => {
      svg.querySelectorAll('.mmd-on, .mmd-selected, .mmd-peek').forEach((el) => el.classList.remove('mmd-on', 'mmd-selected', 'mmd-peek'))
      svg.querySelectorAll('.mmd-flow').forEach((el) => el.remove())
      focused = id
      svg.classList.toggle('mmd-focus', !!id)
      if (id) {
        var {shown, used} = trace(id, reach)
        used.forEach((edge, index) => {
          edge.el.classList.add('mmd-on')
          edge.label && edge.label.classList.add('mmd-on')
          var dir = reach === 'up' ? 'in' : reach === 'down' ? 'out' : edge.from === id ? 'out' : 'in'
          flow(edge, dir, Math.min(index, 8) * 0.06)
        })
        nodes.forEach(({el, id: nodeId}) => el.classList.toggle('mmd-on', shown.has(nodeId)))
        byId.get(id).el.classList.add('mmd-selected')
      }
      drawCard(id, reach)
      drawMap()
    }
    var center = (el) => {
      var box = el.getBoundingClientRect()
      var area = pre.getBoundingClientRect()
      var scale = panzoom.getScale()
      panzoom.pan(
        (area.left + area.width / 2 - box.left - box.width / 2) / scale,
        (area.top + area.height / 2 - box.top - box.height / 2) / scale,
        {relative: true, animate: true}
      )
    }

    // hover: light up the links of the node under the pointer
    var peeked = null
    var peek = (hit) => {
      if (peeked === hit) return
      svg.querySelectorAll('.mmd-hover').forEach((el) => el.classList.remove('mmd-hover'))
      peeked = hit
      var node = hit && nodes.find((n) => n.el === hit)
      if (!node || focused) return
      edges.forEach((e) => (e.from === node.id || e.to === node.id) && e.el.classList.add('mmd-hover'))
    }
    pre.addEventListener('mouseover', (e) => active() && nodes.length && peek(e.target.closest && e.target.closest('g.node')))
    pre.addEventListener('mouseleave', () => peek(null))
    var down = null
    pre.addEventListener('pointerdown', (e) => (down = {x: e.clientX, y: e.clientY}))
    pre.addEventListener('click', (e) => {
      if (!active() || !nodes.length) return
      // a drag that ends on a node is a move, not a click
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) return
      var hit = e.target.closest && e.target.closest('g.node')
      var node = hit && nodes.find((n) => n.el === hit)
      focus(node && node.id !== focused ? node.id : null)
    })

    // find: type to match labels or ids, enter jumps to the first match
    var finder = document.createElement('input')
    finder.className = 'mmd-find'
    finder.type = 'search'
    finder.placeholder = 'Find node'
    finder.hidden = true
    finder.setAttribute('aria-label', 'Find node')
    var closeFind = () => {
      finder.hidden = true
      finder.value = ''
      nodes.forEach((n) => n.el.classList.remove('mmd-match'))
      finder.blur()
    }
    var openFind = () => {
      if (!active() || !nodes.length) return
      finder.hidden = false
      finder.focus()
    }
    finder.addEventListener('input', () => {
      var q = finder.value.trim().toLowerCase()
      nodes.forEach((n) =>
        n.el.classList.toggle('mmd-match', !!q && (n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q)))
      )
    })
    finder.addEventListener('keydown', (e) => {
      e.stopPropagation()
      if (e.key === 'Escape') closeFind()
      if (e.key !== 'Enter') return
      var hit = nodes.find((n) => n.el.classList.contains('mmd-match'))
      if (!hit) return
      focus(hit.id)
      center(hit.el)
    })
    finder.addEventListener('pointerdown', (e) => e.stopPropagation())
    pre.appendChild(finder)

    // overview map: whole diagram with the live viewport, click or drag to move there
    var overview = document.createElement('div')
    overview.className = 'mmd-map'
    overview.hidden = true
    pre.appendChild(overview)
    var mapOn = true
    var size = () => [svg.parentNode.clientWidth || 1, svg.parentNode.clientHeight || 1]
    var moveMap = () => {
      var view = overview.querySelector('.mmd-map-view')
      if (!view) return
      var scale = panzoom.getScale()
      var pan = panzoom.getPan()
      var [width, height] = size()
      var w = overview.clientWidth
      var h = overview.clientHeight
      view.style.left = (-pan.x / width) * w + 'px'
      view.style.top = (-pan.y / height) * h + 'px'
      view.style.width = w / scale + 'px'
      view.style.height = h / scale + 'px'
    }
    var drawMap = () => {
      overview.replaceChildren()
      if (!active() || !mapOn) return void (overview.hidden = true)
      overview.hidden = false
      var [width, height] = size()
      var ratio = Math.min(1, 200 / width, 140 / height)
      overview.style.width = width * ratio + 'px'
      overview.style.height = height * ratio + 'px'
      var copy = svg.cloneNode(true)
      copy.removeAttribute('style')
      copy.setAttribute('width', '100%')
      copy.setAttribute('height', '100%')
      copy.setAttribute('aria-hidden', 'true')
      var view = document.createElement('div')
      view.className = 'mmd-map-view'
      overview.append(copy, view)
      moveMap()
    }
    var toMap = (e) => {
      var box = overview.getBoundingClientRect()
      var scale = panzoom.getScale()
      var [width, height] = size()
      panzoom.pan(
        width / (2 * scale) - ((e.clientX - box.left) / box.width) * width,
        height / (2 * scale) - ((e.clientY - box.top) / box.height) * height
      )
    }
    overview.addEventListener('pointerdown', (e) => {
      e.stopPropagation()
      overview.setPointerCapture(e.pointerId)
      toMap(e)
      overview.onpointermove = toMap
    })
    overview.addEventListener('pointerup', () => (overview.onpointermove = null))
    var toggleMap = () => {
      mapOn = !mapOn
      mapButton.classList.toggle('mmd-off', !mapOn)
      drawMap()
    }
    svg.addEventListener('panzoomchange', (e) => {
      level.textContent = Math.round(e.detail.scale * 100) + '%'
      moveMap()
    })

    // keys while fullscreen: + - 0 zoom, arrows move, / find, M map, escape unwinds focus then fullscreen
    pre._mmdKey = (e) => {
      if (e.target === finder) return false
      var step = 80 / panzoom.getScale()
      if (e.key === 'Escape') return focused ? (focus(null), true) : false
      if (e.key === '+' || e.key === '=') return panzoom.zoomIn(), true
      if (e.key === '-' || e.key === '_') return panzoom.zoomOut(), true
      if (e.key === '0') return panzoom.reset(), true
      if (e.key === '/') return openFind(), true
      if (e.key === 'm' || e.key === 'M') return toggleMap(), true
      var move = {ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step]}[e.key]
      return move ? (panzoom.pan(move[0], move[1], {relative: true}), true) : false
    }

    // panzoom is created with noBind: its pointer handlers (which preventDefault)
    // are attached only in fullscreen so the inline diagram scrolls and selects like the page
    var sync = () => {
      var on = active()
      full.innerHTML = icon(on ? 'exit' : 'fullscreen')
      full.title = on ? 'Exit fullscreen' : 'Fullscreen'
      on ? panzoom.bind() : panzoom.destroy()
      panzoom.setOptions({touchAction: on ? 'none' : 'auto'})
      code.style.userSelect = svg.style.userSelect = on ? 'none' : ''
      panzoom.reset({animate: false})
      if (!on) {
        focus(null)
        closeFind()
      }
      find.hidden = !nodes.length
      level.textContent = '100%'
      drawMap()
    }
    pre._mmdFullscreen = sync
    sync()

    pre.onwheel = (e) => {
      if (!active()) return
      e.preventDefault()
      if (e.ctrlKey) {
        // touchpad pinch (reported as ctrl+wheel with small deltas)
        var scale = panzoom.getScale() * Math.exp(-e.deltaY * 0.01)
        panzoom.zoomToPoint(scale, e)
      }
      else if (trackpad(e)) {
        // touchpad two-finger scroll -> move
        var current = panzoom.getScale()
        panzoom.pan(-e.deltaX / current, -e.deltaY / current, {relative: true})
      }
      else {
        // mouse wheel -> zoom
        panzoom.zoomWithWheel(e)
      }
    }
    pre.ondblclick = () => active() && panzoom.reset()
  }

  // the page asks for a render more than once while it loads (before and after the theme css arrives).
  // overlapping renders share mermaid's config and measuring queue, so a late stale result would
  // overwrite a good diagram with one sized for the wrong state: run one at a time, rerun once after
  var running = false
  var queued = false
  var sequence = 0

  var render = () => {
    if (running) {
      queued = true
      return
    }
    running = true
    if (loaded) {
      var definitions = walk(/<pre><code class="mermaid">([\s\S]+?)<\/code><\/pre>/gi, state.html)

      Array.from(document.querySelectorAll('pre code.mermaid')).forEach((diagram, index) => {
        diagram.removeAttribute('data-processed')
        diagram.innerHTML = definitions[index]
      })
    }
    var dark =
      state._themes[state.theme] === 'dark' ||
      (state._themes[state.theme] === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    var t = dark ? tokens.dark : tokens.light
    document.documentElement.classList.toggle('_mermaid-dark', dark)

    var config = {
      theme: 'base',
      themeVariables: variables(t),
      themeCSS: css(t),
      fontFamily: sans,
      flowchart: {curve: 'step', padding: 16, nodeSpacing: 48, rankSpacing: 56, htmlLabels: true},
      sequence: {actorMargin: 64, boxMargin: 12, noteMargin: 12, messageMargin: 40, mirrorActors: false},
      state: {padding: 12},
      er: {fontSize: 12},
      gantt: {barHeight: 20, barGap: 8, fontSize: 11, sectionFontSize: 11}
    }
    mermaid.initialize(config)
    // render from textContent: mermaid.init reads innerHTML and its entity decoding fails in Firefox content scripts
    var jobs = Array.from(document.querySelectorAll('code.mermaid')).map((node) => {
      var text = node.textContent
      var id = 'mmd-' + ++sequence
      node.removeAttribute('data-processed')
      return mermaid.render(id, text).then(({svg, bindFunctions}) => {
        node.innerHTML = svg
        node.setAttribute('data-processed', 'true')
        bindFunctions && bindFunctions(node)
      }, (err) => {
        var temp = document.getElementById('d' + id)
        temp && temp.remove()
        node.textContent = text + '\n\n' + (err && err.message || err)
        node.setAttribute('data-processed', 'true')
      })
    })
    loaded = true

    Promise.all(jobs).then(() => {
      document.querySelectorAll('pre > code.mermaid > svg').forEach((diagram) => {
        var panzoom = Panzoom(diagram, {canvas: true, maxScale: 20, minScale: 0.2, touchAction: 'auto', pinchAndPan: true, noBind: true, cursor: ''})
        var pre = diagram.closest('pre')
        pre && pre.querySelector(':scope > code.mermaid') && toolbar(pre, panzoom)
      })
    }).finally(() => {
      running = false
      if (queued) {
        queued = false
        render()
      }
    })
  }

  return {render}
})()
