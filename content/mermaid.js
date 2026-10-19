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
      // nimbus-dark palette (build/themes/nimbus/dark.css) as hex, mermaid cannot parse oklch
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
    reset: '<path d="M3 8a5 5 0 1 0 1.5-3.5M3 2v3h3"/>'
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
    if (e.key === 'Escape' && pre) fullscreen(pre, false)
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
    button('zoomIn', 'Zoom in', () => panzoom.zoomIn())
    button('zoomOut', 'Zoom out', () => panzoom.zoomOut())
    button('reset', 'Reset', () => panzoom.reset())
    var full = button('fullscreen', 'Fullscreen', () =>
      fullscreen(pre, !pre.classList.contains('mmd-fullscreen'))
    )
    bar.addEventListener('pointerdown', (e) => e.stopPropagation())
    pre.appendChild(bar)

    var code = pre.querySelector(':scope > code.mermaid')
    var svg = code.querySelector('svg')
    var active = () => pre.classList.contains('mmd-fullscreen')

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

  return {
    render: () => {
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
      Array.from(document.querySelectorAll('code.mermaid')).forEach((node, index) => {
        var text = node.textContent
        node.removeAttribute('data-processed')
        mermaid.render('mmd-' + Date.now() + '-' + index, text).then(({svg, bindFunctions}) => {
          node.innerHTML = svg
          node.setAttribute('data-processed', 'true')
          bindFunctions && bindFunctions(node)
        }, (err) => {
          document.querySelectorAll('[id^="dmmd-"]').forEach((el) => el.remove())
          node.textContent = text + '\n\n' + (err && err.message || err)
          node.setAttribute('data-processed', 'true')
        })
      })
      loaded = true

      var diagrams = Array.from(document.querySelectorAll('code.mermaid'))
      var timeout = setInterval(() => {
        var svg = Array.from(document.querySelectorAll('pre > code.mermaid > svg'))
        if (diagrams.every((diagram) => diagram.hasAttribute('data-processed'))) {
          clearInterval(timeout)
          svg.forEach((diagram) => {
            var panzoom = Panzoom(diagram, {canvas: true, maxScale: 20, minScale: 0.2, touchAction: 'auto', pinchAndPan: true, noBind: true, cursor: ''})
            var pre = diagram.closest('pre')
            pre && pre.querySelector(':scope > code.mermaid') && toolbar(pre, panzoom)
          })
        }
      }, 50)
    }
  }
})()
