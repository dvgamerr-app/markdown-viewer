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
      inkRgb: '45,49,66', accentRgb: '235,108,54',
      syn: {vis: '#9a6e3a', fn: '#dd4a68', type: '#0077aa', punct: '#7a8399', constant: '#990055'}
    },
    dark: {
      // nimbus-dark palette (scripts/nimbus/dark.css) as hex, mermaid cannot parse oklch
      paper: '#020202', paper2: '#0f0f0f', node: '#0f0f0f',
      ink: '#f5f5f5', muted: '#dedede', soft: '#a3a3a3',
      rule: 'rgba(245,245,245,0.12)', ruleSolid: '#404040',
      accent: '#79b1f9', accentTint: 'rgba(121,177,249,0.10)', link: '#79b1f9',
      series: ['#69ba7c', '#79b1f9', '#dcaf61', '#f07f77', '#a3a3a3'],
      inkRgb: '245,245,245', accentRgb: '121,177,249',
      syn: {vis: '#f92672', fn: '#e6db74', type: '#66d9ef', punct: '#a3a3a3', constant: '#ae81ff'}
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
    .flowchart-link, .edgePath .path, .messageLine0, .messageLine1, .relation, .transition, .relationshipLine {
      stroke-width: 1px !important;
    }
    .edgeLabel, .edgeLabel span, .edgeLabel p, .messageText, .labelText, .loopText, .er.relationshipLabel {
      font-family: ${mono} !important; font-size: 11px !important; letter-spacing: 0.04em;
    }
    /* a label sits beside its line and never cuts it, it only gets paper behind it when the text really lies on the line */
    .edgeLabel, .edgeLabel rect, .edgeLabel p, .labelBkg { background-color: transparent !important; fill: transparent !important; }
    .edgeLabel.mmd-over p { background-color: ${t.paper} !important; }
    .edgeLabel span, .edgeLabel p { color: ${t.soft} !important; padding: 0 4px; }
    .edgeLabel foreignObject { overflow: visible; }
    .edgeLabel foreignObject > div { transform: translateY(-12px); }
    line[id^=actor] { stroke: ${t.ruleSolid} !important; stroke-width: 1px !important; stroke-dasharray: 4 3; }
    .loopLine { stroke: rgba(${t.inkRgb},0.22) !important; stroke-dasharray: 4 3; }
    /* sequence: names in sans, labels in muted mono, fragments as ink-wash frames with a mono operator tab,
       activation bars as thin muted rails, notes neutral so accent stays free for the focal message */
    text.actor, text.actor > tspan { font-size: 13px !important; font-weight: 600; }
    .messageText { fill: ${t.muted} !important; }
    .noteText, .noteText > tspan { font-size: 12px !important; fill: ${t.ink} !important; }
    .note { fill: rgba(${t.inkRgb},0.03) !important; stroke: ${t.ruleSolid} !important; }
    rect.rect { fill: rgba(${t.inkRgb},0.04) !important; stroke: ${t.rule} !important; }
    .labelBox { fill: ${t.paper} !important; stroke: rgba(${t.inkRgb},0.22) !important; }
    .labelText, .labelText > tspan { font-size: 9px !important; letter-spacing: 0.12em; text-transform: uppercase; fill: ${t.muted} !important; }
    .loopText, .loopText > tspan { font-size: 11px !important; fill: ${t.muted} !important; }
    /* the else / and guard of a fragment is a sectionTitle */
    .sectionTitle { font-size: 11px !important; }
    .activation0, .activation1, .activation2 { fill: rgba(${t.inkRgb},0.06) !important; stroke: ${t.muted} !important; stroke-width: 0.8px !important; }
    .titleText, .pieTitleText { font-family: 'Instrument Serif', Georgia, serif !important; font-size: 22px !important; font-weight: 400 !important; }
    .sectionTitle, .tick text, .taskText, .taskTextOutsideRight, .taskTextOutsideLeft {
      font-family: ${mono} !important;
    }
    .grid .tick line { stroke: ${t.rule} !important; }

    /* class: one hairline box with rounded corners, names centred in sans, members in mono, stereotypes as
       tracked mono eyebrows, compartments split by hairlines, abstract names in italic */
    .mmd-class-box { fill: ${t.node}; stroke: ${t.ink}; stroke-width: 1px; }
    .focal .mmd-class-box { fill: ${t.accentTint}; stroke: ${t.accent}; stroke-width: 1.2px; }
    .mmd-class-head { fill: transparent; stroke: none; }
    .focal .mmd-class-head { fill: ${t.accentTint}; }
    .relation.mmd-focal-edge { stroke: ${t.accent} !important; }
    /* relationship names are small tracked mono caps, as in the skill's reference */
    .edgeLabel .label[data-id^=id_] :is(span, p) { font-size: 10px !important; letter-spacing: 0.1em; text-transform: uppercase; }
    .node .divider path { stroke: rgba(${t.inkRgb},0.22) !important; stroke-width: 1px !important; }
    .node .label-group foreignObject :is(div, span, p) { font-size: 13px !important; font-weight: 600 !important; color: ${t.ink} !important; text-align: center; }
    .node.mmd-abstract .label-group foreignObject :is(div, span, p) { font-style: italic; }
    .node .annotation-group foreignObject :is(div, span, p) {
      font-family: ${mono} !important; font-size: 9px !important; font-weight: 500 !important;
      letter-spacing: 0.12em; text-transform: uppercase; color: ${t.soft} !important;
    }
    .node .members-group foreignObject :is(div, span, p), .node .methods-group foreignObject :is(div, span, p) {
      font-family: ${mono} !important; font-size: 11px !important; font-weight: 400 !important; color: ${t.ink} !important;
      white-space: nowrap !important;
    }
    /* members read like code: visibility, types, method names and punctuation take the code block colours */
    .node foreignObject span.tok.tok-vis { color: ${t.syn.vis} !important; }
    .node foreignObject span.tok.tok-fn { color: ${t.syn.fn} !important; }
    .node foreignObject span.tok.tok-type { color: ${t.syn.type} !important; }
    .node foreignObject span.tok.tok-punct { color: ${t.syn.punct} !important; }
    .node foreignObject span.tok.tok-constant { color: ${t.syn.constant} !important; }
    .node.note rect, .node.note path { fill: rgba(${t.inkRgb},0.03) !important; stroke: ${t.ruleSolid} !important; }
    .node.note foreignObject :is(div, span, p) { font-size: 12px !important; color: ${t.ink} !important; }
    [id$=extensionStart] path, [id$=extensionEnd] path { fill: ${t.paper} !important; stroke: ${t.ink} !important; stroke-width: 1px; }
    [id$=compositionStart] path, [id$=compositionEnd] path { fill: ${t.ink} !important; stroke: ${t.ink} !important; }
    [id$=aggregationStart] path, [id$=aggregationEnd] path { fill: ${t.paper} !important; stroke: ${t.ink} !important; stroke-width: 1px; }

    /* state: rounded hairline boxes, a filled ink dot to start and a ringed dot to end, transitions named by
       tracked mono caps, composite states as dashed frames with a mono tab, bars and diamonds in ink */
    .statediagram-state rect.basic { rx: 8px; ry: 8px; }
    .state-start { fill: ${t.ink} !important; stroke: ${t.ink} !important; r: 6px; }
    [id*=root_end] .outer-path path[stroke]:not([stroke=none]) { stroke: ${t.ink} !important; stroke-width: 1px !important; }
    [id*=root_end] .outer-path > g path[fill]:not([fill=none]) { fill: ${t.ink} !important; }
    .edgeLabel .label[data-id^=edge] :is(span, p) { font-size: 10px !important; letter-spacing: 0.1em; text-transform: uppercase; }
    .statediagram-cluster rect.outer { rx: 8px; ry: 8px; fill: ${t.paper} !important; stroke: ${t.ruleSolid} !important; stroke-width: 1px !important; stroke-dasharray: 4 4; }
    .statediagram-cluster rect.inner { fill: rgba(${t.inkRgb},0.03) !important; stroke: none !important; }
    .statediagram-cluster .cluster-label :is(span, p) {
      font-family: ${mono} !important; font-size: 10px !important; letter-spacing: 0.12em; text-transform: uppercase; color: ${t.soft} !important;
    }
    .statediagram-cluster.statediagram-cluster-parallel rect, .statediagram-cluster [class*=divider] { stroke-dasharray: 4 4; }
    .statediagram-note .outer-path path[stroke]:not([stroke=none]) { stroke: ${t.ruleSolid} !important; stroke-width: 1px !important; }
    .statediagram-note .outer-path path[fill]:not([fill=none]) { fill: rgba(${t.inkRgb},0.03) !important; }
    .statediagram-note foreignObject :is(div, span, p) { font-size: 12px !important; color: ${t.ink} !important; }

    /* er: drawn again after layout, as in the skill's reference. An entity is a box with a tinted header (a mono
       type tag over the name), attributes in mono with the type on the right, # for a primary key and an arrow for a
       foreign key. Relationships are plain hairlines with the cardinality written out at both ends */
    .mmd-er-node > .label, .mmd-er-node > .outer-path, .mmd-er-node > rect.label-container, .mmd-er-node > .divider, .mmd-er-node > [class^=row-rect] { display: none; }
    .relationshipLine { marker-start: none !important; marker-end: none !important; }
    .mmd-er-node:not([data-mmd-seq=now]) > .mmd-er-fill { fill: ${t.node} !important; stroke: none !important; }
    .mmd-er-node > .mmd-er-head { fill: rgba(${t.inkRgb},0.05) !important; stroke: none !important; }
    .mmd-er-node > .mmd-er-box { fill: none !important; }
    .mmd-er-node:not([data-mmd-seq=now]) > .mmd-er-box { stroke: ${t.ink} !important; stroke-width: 1px !important; }
    .mmd-er-node[data-mmd-seq=now] > .mmd-er-fill { fill: ${t.accentTint} !important; }
    .mmd-er-node[data-mmd-seq=now] > .mmd-er-box { stroke: ${t.accent} !important; stroke-width: 1.6px !important; }
    .mmd-er-node > .mmd-er-rule { stroke: rgba(${t.inkRgb},0.22) !important; stroke-width: 1px !important; }
    .focal.mmd-er-node:not([data-mmd-seq=now]) > .mmd-er-fill { fill: ${t.accentTint} !important; }
    .focal.mmd-er-node > .mmd-er-head { fill: rgba(${t.accentRgb},0.12) !important; }
    .focal.mmd-er-node:not([data-mmd-seq=now]) > .mmd-er-box { stroke: ${t.accent} !important; }
    .focal.mmd-er-node > .mmd-er-rule { stroke: rgba(${t.accentRgb},0.4) !important; }
    .join.mmd-er-node > .mmd-er-box { stroke-dasharray: 5 4; }
    .join.mmd-er-node:not([data-mmd-seq=now]) > .mmd-er-fill { fill: rgba(${t.inkRgb},0.04) !important; }
    .join.mmd-er-node > .mmd-er-head { fill: rgba(${t.inkRgb},0.08) !important; }
    .mmd-er-tag { font-family: ${mono}; font-size: 8px; letter-spacing: 0.14em; fill: ${t.muted}; }
    .focal .mmd-er-tag { fill: ${t.accent}; }
    .mmd-er-name { font-family: ${sans}; font-size: 14px; font-weight: 600; fill: ${t.ink}; }
    .mmd-er-field { font-family: ${mono}; font-size: 10px; fill: ${t.ink}; }
    .mmd-er-type { font-family: ${mono}; font-size: 10px; fill: ${t.muted}; }
    /* a key row and a hovered relationship light up together */
    /* the page rounds every node rect, a row is square */
    .mmd-er-node > .mmd-er-row { fill: none !important; stroke: none !important; rx: 0 !important; ry: 0 !important; pointer-events: all; }
    .mmd-er-node > .mmd-er-row.mmd-hit { fill: rgba(${t.accentRgb},0.16) !important; }
    .mmd-er-field.mmd-hit, .mmd-er-type.mmd-hit { font-weight: 600; fill: ${t.ink}; }
    .relationshipLine.mmd-hover { stroke: ${t.accent} !important; stroke-width: 2px !important; }
    .mmd-er-hit { fill: none; stroke: transparent; stroke-width: 14px; pointer-events: stroke; }
    .mmd-er-card.mmd-on text { fill: ${t.accent}; }
    .mmd-er-card text { font-family: ${mono}; font-size: 10px; font-weight: 600; fill: ${t.muted}; text-anchor: middle; }
    .mmd-er-card rect { fill: ${t.paper}; stroke: none; }

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

  // a class box is drawn as two paths with square corners, redraw it as one rounded rect so it matches every other node
  var classBoxes = (svg) => {
    svg.querySelectorAll('g.node').forEach((node) => {
      var outline = node.querySelector(':scope > g.label-container')
      if (!outline || outline.querySelector('.mmd-class-box')) return
      var box = outline.getBBox()
      if (!box.width) return
      var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      rect.setAttribute('class', 'mmd-class-box')
      ;[['x', box.x], ['y', box.y], ['width', box.width], ['height', box.height], ['rx', 6], ['ry', 6]].forEach(([name, value]) => rect.setAttribute(name, value))
      outline.querySelectorAll('path').forEach((path) => path.setAttribute('display', 'none'))
      outline.insertBefore(rect, outline.firstChild)
      // the name compartment ends at the first divider
      var divider = node.querySelector('.divider path')
      var matrix = outline.getScreenCTM()
      if (divider && matrix) {
        var cut = svg.createSVGPoint()
        cut.y = divider.getBoundingClientRect().top
        var bottom = cut.matrixTransform(matrix.inverse()).y
        if (bottom > box.y + 6) {
          var head = document.createElementNS('http://www.w3.org/2000/svg', 'path')
          head.setAttribute('class', 'mmd-class-head')
          head.setAttribute('d', 'M' + box.x + ' ' + bottom + 'V' + (box.y + 6) + 'Q' + box.x + ' ' + box.y + ' ' + (box.x + 6) + ' ' + box.y +
            'H' + (box.x + box.width - 6) + 'Q' + (box.x + box.width) + ' ' + box.y + ' ' + (box.x + box.width) + ' ' + (box.y + 6) + 'V' + bottom + 'Z')
          outline.insertBefore(head, rect.nextSibling)
        }
      }
      node.querySelectorAll('.members-group p, .methods-group p').forEach((line) => {
        if (line.children.length || line.querySelector('.tok')) return
        var tokens = highlight(line.textContent)
        tokens && line.replaceChildren(...tokens)
      })
      var stereotype = node.querySelector('.annotation-group')
      if (stereotype && /abstract/i.test(stereotype.textContent)) node.classList.add('mmd-abstract')
    })
    svg.querySelectorAll('g.node.focal').forEach((node) => {
      var name = node.id.replace(/^.*classId-/, '').replace(/-\d+$/, '').replace(/[.*+?^$${}()|[\]\\]/g, '\\$&')
      var touches = new RegExp('^id_(?:' + name + '_.+|.+_' + name + ')_\\d+$')
      svg.querySelectorAll('path.relation').forEach((edge) => {
        var heads = (edge.getAttribute('marker-start') || '') + (edge.getAttribute('marker-end') || '')
        if (/extension/.test(heads) && touches.test(edge.getAttribute('data-id') || '')) edge.classList.add('mmd-focal-edge')
      })
    })
  }

  // find the labels whose text lies on their own line: those keep a paper background so the line does not run through the text
  var labelsOnLines = (svg) => {
    svg.querySelectorAll('g.edgeLabel').forEach((group) => {
      group.classList.remove('mmd-over')
      var tag = group.querySelector('.label[data-id]')
      var line = tag && svg.querySelector('path[data-id="' + tag.getAttribute('data-id') + '"]')
      var text = group.querySelector('p, span')
      var matrix = line && line.getScreenCTM()
      if (!text || !matrix) return
      // the label box is much taller than its text, measure the text itself
      var range = document.createRange()
      range.selectNodeContents(text)
      var box = range.getBoundingClientRect()
      var length = line.getTotalLength()
      if (!box.width || !length) return
      for (var at = 0; at <= length; at += 3) {
        var point = line.getPointAtLength(at).matrixTransform(matrix)
        if (point.x > box.left - 2 && point.x < box.right + 2 && point.y > box.top - 2 && point.y < box.bottom + 2) {
          group.classList.add('mmd-over')
          return
        }
      }
    })
  }

  // mermaid lays an entity out as a table; keep its position and size for the lines, but draw the box again as the
  // skill's reference does. The box only ever grows, upwards and sideways, so every line still ends inside it
  var erBoxes = (svg) => {
    var ns = 'http://www.w3.org/2000/svg'
    var make = (tag, cls, attrs, text) => {
      var el = document.createElementNS(ns, tag)
      el.setAttribute('class', cls)
      Object.keys(attrs || {}).forEach((name) => el.setAttribute(name, attrs[name]))
      if (text != null) el.textContent = text
      return el
    }
    var HEAD = 40
    var ROW = 20
    var PAD = 16
    var shift = (node) => {
      var m = /translate\(([^,)]+)[, ]+([^)]+)\)/.exec(node.getAttribute('transform') || '')
      return {x: m ? parseFloat(m[1]) : 0, y: m ? parseFloat(m[2]) : 0}
    }
    var boxes = []
    var room = {top: 0, side: 0}
    svg.querySelectorAll('g.node').forEach((node) => {
      // an entity without attributes is a plain labelled rect
      var outer = node.querySelector(':scope > .outer-path, :scope > rect.label-container')
      if (!outer || node.querySelector('.mmd-er-box')) return
      var old = outer.getBBox()
      if (!old.width) return
      var read = (cls) => Array.from(node.querySelectorAll(':scope > .label' + (cls ? '.' + cls : ''))).map((el) => el.textContent.trim())
      var name = read('name')[0] || read('')[0] || ''
      var types = read('attribute-type')
      var names = read('attribute-name')
      var keys = read('attribute-keys')
      var notes = read('attribute-comment')
      var rows = names.map((field, i) => {
        var key = (keys[i] || '').split(/\s*,\s*/)
        var mark = (key.includes('PK') ? '# ' : '') + (key.includes('FK') ? '\u2192 ' : '')
        var tail = [types[i], key.includes('UK') ? 'unique' : '', notes[i]].filter(Boolean).join(' \u00B7 ')
        return {left: mark + field, right: tail, field, pk: key.includes('PK'), fk: key.includes('FK'), uk: key.includes('UK')}
      })
      var focal = node.classList.contains('focal')
      var join = node.classList.contains('join')
      var tag = join ? 'JOIN' : focal ? 'ENTITY \u00B7 ROOT' : 'ENTITY'

      var tagEl = make('text', 'mmd-er-tag', {}, tag)
      var nameEl = make('text', 'mmd-er-name', {}, name)
      var cells = rows.map((row) => [make('text', 'mmd-er-field', {}, row.left), make('text', 'mmd-er-type', {'text-anchor': 'end'}, row.right)])
      var texts = [tagEl, nameEl].concat(cells.flat())
      texts.forEach((el) => node.appendChild(el))
      var wide = (el) => el.getComputedTextLength()
      var need = Math.max(wide(tagEl), wide(nameEl), ...cells.map(([l, r]) => wide(l) + (r.textContent ? 28 + wide(r) : 0))) + PAD * 2
      var height = Math.max(HEAD + ROW * rows.length + 12, old.height)
      var width = Math.max(old.width, need)
      var box = {x: old.x - (width - old.width) / 2, y: old.y + old.height - height, width, height}
      var right = box.x + box.width
      var round = {x: box.x, y: box.y, width: box.width, height: box.height, rx: 6, ry: 6}

      node.classList.add('mmd-er-node')
      node.insertBefore(make('rect', 'mmd-er-fill', round), node.firstChild)
      node.insertBefore(make('path', 'mmd-er-head', {
        d: 'M' + box.x + ' ' + (box.y + HEAD) + 'V' + (box.y + 6) + 'Q' + box.x + ' ' + box.y + ' ' + (box.x + 6) + ' ' + box.y +
          'H' + (right - 6) + 'Q' + right + ' ' + box.y + ' ' + right + ' ' + (box.y + 6) + 'V' + (box.y + HEAD) + 'Z'
      }), node.children[1])
      node.appendChild(make('line', 'mmd-er-rule', {x1: box.x, x2: right, y1: box.y + HEAD, y2: box.y + HEAD}))
      tagEl.setAttribute('x', box.x + PAD)
      tagEl.setAttribute('y', box.y + 16)
      nameEl.setAttribute('x', box.x + PAD)
      nameEl.setAttribute('y', box.y + 32)
      // each row is a hover target, lit when a relationship that runs through its key is
      node.__mmdRows = cells.map(([l, r], i) => {
        var y = box.y + HEAD + ROW * (i + 1)
        l.setAttribute('x', box.x + PAD)
        l.setAttribute('y', y)
        r.setAttribute('x', right - PAD)
        r.setAttribute('y', y)
        var rect = make('rect', 'mmd-er-row', {x: box.x + 1, y: y - 14, width: box.width - 2, height: ROW})
        node.insertBefore(rect, tagEl)
        return Object.assign({rect, texts: [l, r]}, rows[i])
      })
      node.appendChild(make('rect', 'mmd-er-box', round))
      var at = shift(node)
      boxes.push({old: {left: at.x + old.x, top: at.y + old.y, right: at.x + old.x + old.width, bottom: at.y + old.y + old.height}, grown: height - old.height})
      room.top = Math.max(room.top, height - old.height)
      room.side = Math.max(room.side, (width - old.width) / 2)
    })
    // the svg is cropped to what mermaid drew, make room for what grew
    var view = (svg.getAttribute('viewBox') || '').split(/[ ,]+/).map(parseFloat)
    if (view.length === 4 && (room.top || room.side)) {
      view[0] -= room.side
      view[1] -= room.top
      view[2] += room.side * 2
      view[3] += room.top
      svg.setAttribute('viewBox', view.join(' '))
      if (svg.style.maxWidth) svg.style.maxWidth = view[2] + 'px'
    }

    // cardinality is written at the end of the line, where the line meets the entity
    // the skill's notation: 1 for the one side, N for the many side, whether or not it is optional
    var words = {onlyOne: '1', zeroOrOne: '1', oneOrMore: 'N', zeroOrMore: 'N'}
    svg.querySelectorAll('path.relationshipLine').forEach((line) => {
      var length = line.getTotalLength()
      if (!length) return
      var group = make('g', 'mmd-er-card', {'data-edge': line.getAttribute('data-id')})
      ;[['marker-start', 0, 1], ['marker-end', length, -1]].forEach(([attr, distance, way]) => {
        var kind = /er-(onlyOne|zeroOrOne|oneOrMore|zeroOrMore)/.exec(line.getAttribute(attr) || '')
        if (!kind) return
        var point = line.getPointAtLength(distance)
        var inner = line.getPointAtLength(Math.max(0, Math.min(length, distance + way * 6)))
        var best = null
        boxes.forEach((b) => {
          var gap = Math.hypot(Math.max(b.old.left - point.x, 0, point.x - b.old.right), Math.max(b.old.top - point.y, 0, point.y - b.old.bottom))
          if (!best || gap < best.gap) best = {box: b, gap}
        })
        if (!best || best.gap > 8) return
        // push the label out along the line, past the part of the box that grew upwards
        var dx = inner.x - point.x
        var dy = inner.y - point.y
        var span = Math.hypot(dx, dy) || 1
        var lift = dy / span < -0.5 ? best.box.grown : 0
        var word = words[kind[1]]
        var half = word.length * 3.2 + 3
        var x = point.x + (dx / span) * (half + 6)
        var y = point.y + (dy / span) * (half + 6) - lift
        group.appendChild(make('rect', '', {x: x - half, y: y - 7, width: half * 2, height: 14, rx: 2}))
        group.appendChild(make('text', '', {x, y: y + 3.5}, word))
      })
      line.parentNode.appendChild(group)
      // the line is a hairline, give the pointer something wider to land on
      var hit = line.cloneNode(false)
      ;['id', 'style', 'marker-start', 'marker-end'].forEach((name) => hit.removeAttribute(name))
      hit.setAttribute('class', 'mmd-er-hit')
      hit.setAttribute('data-edge', line.getAttribute('data-id'))
      line.parentNode.appendChild(hit)
    })
  }

  // split a member such as "+deposit(amount) : void" or "-double balance" into coloured tokens
  var highlight = (() => {
    var span = (kind, text) => {
      var el = document.createElement('span')
      el.className = 'tok tok-' + kind
      el.textContent = text
      return el
    }
    var text = (value) => document.createTextNode(value)
    // List<T>, Map<K, V>: the brackets are punctuation, the names are types
    var type = (value) => value.split(/([<>,[\]~])/).filter(Boolean).map((part) => (/^[<>,[\]~]$/.test(part) ? span('punct', part) : /^\s+$/.test(part) ? text(part) : span('type', part)))
    var join = (items, glue) => items.reduce((all, item, i) => (i ? all.concat(glue(), item) : all.concat(item)), [])
    var param = (value) => {
      var words = value.trim().split(/\s+/)
      return words.length > 1 ? type(words.slice(0, -1).join(' ')).concat(text(' '), text(words[words.length - 1])) : [text(words[0] || '')]
    }
    return (value) => {
      var method = /^([+\-#~])?(\s*)([^\s(]+)\(([^)]*)\)(?:(\s*:\s*)(.+?))?\s*$/.exec(value)
      if (method) {
        var [, vis, gap, name, params, colon, ret] = method
        return [].concat(
          vis ? [span('vis', vis), text(gap)] : [],
          span('fn', name),
          span('punct', '('),
          params.trim() ? join(params.split(',').map(param), () => [span('punct', ','), text(' ')]).flat() : [],
          span('punct', ')'),
          ret ? [span('punct', colon), ...type(ret)] : []
        )
      }
      var field = /^([+\-#~])?(\s*)(.+?)\s*$/.exec(value)
      if (!field) return null
      var [, mark, space, rest] = field
      var head = mark ? [span('vis', mark), text(space)] : []
      if (/\s:\s/.test(rest)) {
        var [label, kind] = rest.split(/\s:\s(.+)/)
        return head.concat(text(label), span('punct', ' : '), type(kind || ''))
      }
      var words = rest.split(/\s+/)
      if (words.length === 1) return head.concat(/^[A-Z][A-Z0-9_]*$/.test(rest) ? span('constant', rest) : text(rest))
      return head.concat(type(words.slice(0, -1).join(' ')), text(' '), text(words[words.length - 1]))
    }
  })()

  var icons = {
    fullscreen: '<path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"/>',
    exit: '<path d="M6 2v4H2M14 6h-4V2M10 14v-4h4M2 10h4v4"/>',
    zoomIn: '<path d="M8 3v10M3 8h10"/>',
    zoomOut: '<path d="M3 8h10"/>',
    reset: '<path d="M3 8a5 5 0 1 0 1.5-3.5M3 2v3h3"/>',
    play: '<path d="M5 3l8 5-8 5z"/>',
    pause: '<path d="M5 3v10M11 3v10"/>',
    prev: '<path d="M10 3L5 8l5 5"/>',
    next: '<path d="M6 3l5 5-5 5"/>',
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
    // every render builds a new set of controls: drop the previous set, its listeners and its panzoom,
    // otherwise they keep running against the replaced svg
    pre._mmdDispose && pre._mmdDispose()
    var abort = new AbortController()
    var signal = abort.signal
    pre._mmdDispose = () => {
      abort.abort()
      panzoom.destroy()
      pre._mmdSeqStop && pre._mmdSeqStop()
      pre.querySelectorAll(':scope > .mmd-toolbar, :scope > .mmd-card, :scope > .mmd-find, :scope > .mmd-map, :scope > .mmd-player').forEach((el) => el.remove())
    }

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
    var isSequence = (() => {
      var drawn = pre.querySelector(':scope > code.mermaid svg')
      return !!drawn && drawn.getAttribute('aria-roledescription') === 'sequence'
    })()
    // a state machine and an entity model are both named nodes joined by lines, they share the focus and the playback
    var kind = (() => {
      var drawn = pre.querySelector(':scope > code.mermaid svg')
      return (drawn && drawn.getAttribute('aria-roledescription')) || ''
    })()
    var isEr = kind === 'er'
    var isDbml = kind === 'dbml'
    var isJourney = kind === 'journey'
    // a journey is a chain of stages joined by the sentiment curve, it plays like a state machine
    var isState = kind === 'stateDiagram' || isEr || isJourney
    // an entity model is not a flow, it has nothing to play: its relationships light up on hover instead
    var plays = isSequence || (isState && !isEr)
    plays && button('play', isJourney ? 'Play journey (P)' : isState ? 'Play transitions (P)' : 'Play sequence (P)', () => pre._mmdSeqToggle && pre._mmdSeqToggle())
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
    // state diagrams name nodes "state-<id>-<n>"; a composite state is a cluster, drawn apart from the nodes
    // but reached by transitions all the same. Notes are not part of the machine
    var nodes = Array.from(svg.querySelectorAll(isState ? 'g.node:not(.statediagram-note), g.statediagram-cluster' : 'g.node')).map((el) => {
      var match = (isEr ? /^entity-(.+)-\d+$/ : isDbml ? /^dbml-(.+)-[0-9]+$/ : isJourney ? /^journey-(.+)-[0-9]+$/ : isState ? /^state-(.+)-\d+$/ : /^flowchart-(.+)-\d+$/).exec(local(el.id))
      // an entity's text holds every attribute, its name is the first label
      var label = el.querySelector(':scope > .cluster-label, :scope > .label.name') || el
      return {el, id: (match && match[1]) || '', label: isDbml && match ? match[1] : label.textContent.trim(), cluster: el.classList.contains('statediagram-cluster')}
    }).filter((n) => n.id)
    // a dbml diagram carries what its popup shows, the columns and the keys of every table
    var model = (() => {
      var meta = (isDbml || isJourney) && svg.querySelector('metadata.dbml-model, metadata.journey-model')
      try {
        return meta ? JSON.parse(meta.textContent) : null
      }
      catch (err) {
        return null
      }
    })()
    nodes.forEach((n) => {
      if (isJourney && model && model.nodes[n.id]) n.label = model.nodes[n.id].name
    })
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
    // edges with a custom id (A e1@--> B) carry no node names, so find the nodes at the two ends of the path
    var reach = (el) => {
      var length = el.getTotalLength()
      var matrix = el.getScreenCTM()
      if (!length || !matrix) return null
      var at = (distance) => {
        var point = el.getPointAtLength(distance).matrixTransform(matrix)
        var best = null
        nodes.forEach((n) => {
          var box = n.el.getBoundingClientRect()
          var gap = Math.hypot(Math.max(box.left - point.x, 0, point.x - box.right), Math.max(box.top - point.y, 0, point.y - box.bottom))
          // a composite state holds its own nodes, a point inside it belongs to the cluster only at its frame
          if (n.cluster && !gap) gap = Math.min(point.x - box.left, box.right - point.x, point.y - box.top, box.bottom - point.y)
          if (!best || gap < best.gap) best = {id: n.id, gap}
        })
        // the arrowhead stops a few units short of the node border
        return best && best.gap <= 12 * Math.abs(matrix.a) ? best.id : null
      }
      var from = at(0)
      var to = at(length)
      // a state may loop back to itself
      return from && to && (isState || from !== to) ? {from, to} : null
    }
    var edges = Array.from(svg.querySelectorAll('path.flowchart-link, path.transition, path.relationshipLine')).map((el) => {
      var pair = el.dataset.from ? {from: el.dataset.from, to: el.dataset.to} : ends(el.id) || reach(el)
      if (!pair) return null
      var label = svg.querySelector('.edgeLabel [data-id="' + local(el.id) + '"]')
      var extras = Array.from(svg.querySelectorAll('.mmd-er-card')).filter((g) => g.getAttribute('data-edge') === el.getAttribute('data-id'))
      return {el, from: pair.from, to: pair.to, label: label ? label.closest('.edgeLabel') : null, extras}
    }).filter(Boolean)
    var h = (tag, cls, text) => {
      var el = document.createElement(tag)
      el.className = cls
      if (text != null) el.textContent = text
      return el
    }

    // arrowheads are separate marker elements, so a lit edge gets an orange copy of its marker
    // links out of the focused node are orange, links into it are blue
    var lit = (dir) => (dir === 'in' ? (document.documentElement.classList.contains('_mermaid-dark') ? '#79b1f9' : '#2e5aa8') : '#eb6c36')
    var tint = (edge, on, dir) => {
      var el = edge.el
      // a relationship has a marker at each end, the others only at the end
      ;['marker-end', 'marker-start'].forEach((attr) => {
        var key = attr === 'marker-end' ? 'mmdMarker' : 'mmdMarkerStart'
        if (!on) {
          if (el.dataset[key]) {
            el.setAttribute(attr, el.dataset[key])
            delete el.dataset[key]
          }
          return
        }
        var current = el.getAttribute(attr)
        var match = /#([^")]+)/.exec(current || '')
        if (!match || el.dataset[key]) return
        var copyId = match[1] + '-lit-' + dir
        if (!svg.querySelector('[id="' + copyId + '"]')) {
          var source = svg.querySelector('[id="' + match[1] + '"]')
          if (!source) return
          var copy = source.cloneNode(true)
          copy.id = copyId
          // open shapes (a crow's foot) stay unfilled, a detached copy has no computed style so ask the source
          var originals = source.querySelectorAll('path, circle')
          copy.querySelectorAll('path, circle').forEach((p, i) => {
            var style = getComputedStyle(originals[i])
            if (style.fill !== 'none') p.style.setProperty('fill', lit(dir), 'important')
            if (style.stroke !== 'none') p.style.setProperty('stroke', lit(dir), 'important')
          })
          source.parentNode.appendChild(copy)
        }
        el.dataset[key] = current
        el.setAttribute(attr, 'url(#' + copyId + ')')
      })
    }

    // pulse that travels along an edge in its drawn direction, one-shot for previews, looping while a node stays focused
    var flow = (edge, dir, delay = 0, loop = false) => {
      var line = edge.el.cloneNode(false)
      line.removeAttribute('id')
      line.removeAttribute('style')
      line.removeAttribute('marker-end')
      line.removeAttribute('marker-start')
      line.setAttribute('class', loop ? 'mmd-flow mmd-loop' : 'mmd-flow')
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
      if (isDbml) return drawTable(id, reach)
      if (isJourney) return drawStage(id)
      var node = byId.get(id)
      var kind = kinds.find((k) => node.el.classList.contains(k)) || 'node'
      var incoming = edges.filter((e) => e.to === id)
      var outgoing = edges.filter((e) => e.from === id)

      var head = h('div', 'mmd-card-head')
      var copy = h('div', 'mmd-card-copy')
      copy.append(
        h('span', 'mmd-card-eyebrow', kind === 'node' ? 'Node' : 'Node · ' + kind),
        h('strong', 'mmd-card-title', node.label),
        h('code', 'mmd-card-id', id)
      )
      var close = h('button', 'mmd-card-close', '×')
      close.type = 'button'
      close.title = 'Close (Esc)'
      close.setAttribute('aria-label', 'Close')
      close.addEventListener('click', () => focus(null))
      head.append(copy, close)

      var stats = h('div', 'mmd-card-stats')
      ;[['in', 'In', incoming.length], ['out', 'Out', outgoing.length]].forEach(([dir, text, count]) => {
        var cell = h('div', 'mmd-stat')
        cell.dataset.dir = dir
        cell.append(h('span', 'mmd-card-label', text), h('strong', '', String(count)))
        stats.appendChild(cell)
      })

      var reachBar = h('div', 'mmd-card-reach')
      ;[['up', 'Upstream'], ['down', 'Downstream']].forEach(([dir, text]) => {
        var count = trace(id, dir).shown.size - 1
        var btn = h('button', '')
        btn.type = 'button'
        btn.disabled = !count
        btn.dataset.dir = dir === 'up' ? 'in' : 'out'
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
      card.append(head, stats, reachBar, h('span', 'mmd-card-label mmd-card-section', 'Connections'), list)
    }

    var reachBar = (id, reach) => {
      var bar = h('div', 'mmd-card-reach')
      ;[['up', 'Upstream'], ['down', 'Downstream']].forEach(([dir, text]) => {
        var count = trace(id, dir).shown.size - 1
        var btn = h('button', '')
        btn.type = 'button'
        btn.disabled = !count
        btn.dataset.dir = dir === 'up' ? 'in' : 'out'
        btn.setAttribute('aria-pressed', String(reach === dir))
        btn.append(h('span', '', text), h('strong', '', String(count)))
        btn.addEventListener('click', () => focus(id, reach === dir ? null : dir))
        bar.appendChild(btn)
      })
      return bar
    }

    // dbml: hover a table, a column or a line and the links through it light up with a pulse and the key columns
    // they join, click a table for a popup with its columns, indexes and relations
    var hotD = {edges: [], rows: [], flows: []}
    var rowsOf = (nodeId, col) => {
      var n = byId.get(nodeId)
      return n ? Array.from(n.el.querySelectorAll('.dbml-row')).filter((r) => r.dataset.col === col) : []
    }
    var lightD = (picks, extra) => {
      hotD.edges.forEach((e) => {
        e.el.classList.remove('mmd-hover')
        if (!e.el.classList.contains('mmd-on')) {
          tint(e, false)
          delete e.el.dataset.mmdDir
        }
      })
      hotD.rows.forEach((r) => r.classList.remove('dbml-hot'))
      hotD.flows.forEach((f) => f.remove())
      var rows = new Set(extra)
      var flows = []
      picks.forEach(({edge, dir}) => {
        var meta = model && model.links[local(edge.el.id)]
        if (meta) rowsOf(meta.child, meta.childCol).concat(rowsOf(meta.parent, meta.parentCol)).forEach((r) => rows.add(r))
        edge.el.dataset.mmdDir = dir
        edge.el.classList.add('mmd-hover')
        tint(edge, true, dir)
        flows.push(flow(edge, dir, 0, true))
      })
      rows.forEach((r) => r.classList.add('dbml-hot'))
      hotD = {edges: picks.map((p) => p.edge), rows: Array.from(rows), flows}
    }
    // like every other motion, only in fullscreen: inline the diagram stays still
    var hoverD = (target) => {
      if (!active()) return
      if (focused) return lightD([], [])
      var find = (sel) => target && target.closest && target.closest(sel)
      var line = find('.dbml-hit-line')
      if (line) {
        var edge = edges.find((e) => local(e.el.id) === line.dataset.link)
        return lightD(edge ? [{edge, dir: 'out'}] : [], [])
      }
      var el = find('g.node')
      var node = el && nodes.find((n) => n.el === el)
      if (!node) return lightD([], [])
      var row = find('.dbml-row')
      var meta = (e) => (model && model.links[local(e.el.id)]) || {}
      var picks = edges.flatMap((e) => {
        if (row && !((e.from === node.id && meta(e).childCol === row.dataset.col) || (e.to === node.id && meta(e).parentCol === row.dataset.col))) return []
        return e.from === node.id || e.to === node.id ? [{edge: e, dir: e.from === node.id ? 'out' : 'in'}] : []
      })
      lightD(picks, row ? [row] : [])
    }
    pre.addEventListener('mouseover', (e) => isDbml && hoverD(e.target), {signal})
    pre.addEventListener('mouseleave', () => isDbml && lightD([], []), {signal})

    // popup for a table: what it holds (columns, indexes) and how it is linked
    var drawTable = (id, reach) => {
      var node = byId.get(id)
      var data = (model && model.nodes[id]) || {kind: 'table', title: node.label, cols: [], indexes: [], note: ''}
      var incoming = edges.filter((e) => e.to === id)
      var outgoing = edges.filter((e) => e.from === id)

      var head = h('div', 'mmd-card-head')
      var copy = h('div', 'mmd-card-copy')
      copy.append(h('span', 'mmd-card-eyebrow', data.kind === 'enum' ? 'Enum' : 'Table'), h('strong', 'mmd-card-title', data.title))
      data.note && copy.append(h('span', 'mmd-card-note', data.note))
      var close = h('button', 'mmd-card-close', '×')
      close.type = 'button'
      close.title = 'Close (Esc)'
      close.setAttribute('aria-label', 'Close')
      close.addEventListener('click', () => focus(null))
      head.append(copy, close)

      var stat = (dir, text, count) => {
        var cell = h('div', 'mmd-stat')
        if (dir) cell.dataset.dir = dir
        cell.append(h('span', 'mmd-card-label', text), h('strong', '', String(count)))
        return cell
      }
      var counts = h('div', 'mmd-card-stats mmd-auto')
      counts.append(stat('', data.kind === 'enum' ? 'Values' : 'Columns', data.cols.length))
      data.kind !== 'enum' && counts.append(stat('', 'Indexes', data.indexes.length))
      var links = h('div', 'mmd-card-stats mmd-auto')
      links.append(stat('in', 'Referenced by', incoming.length), stat('out', 'References', outgoing.length))

      var body = h('div', 'mmd-card-list mmd-card-body')
      var section = (text) => body.append(h('span', 'mmd-card-label mmd-card-section', text))
      section(data.kind === 'enum' ? 'Values' : 'Columns')
      data.cols.forEach((col) => {
        var row = h('div', 'mmd-col')
        var line = h('div', 'mmd-col-line')
        line.append(h('strong', 'mmd-col-name', col.name))
        ;(col.chips || []).forEach((chip) => line.append(h('span', 'mmd-chip', chip)))
        col.type && line.append(h('code', 'mmd-col-type', col.type))
        row.append(line)
        var sub = [col.inc && 'auto increment', col.def && 'default ' + col.def, col.note].filter(Boolean).join(' · ')
        sub && row.append(h('small', 'mmd-col-sub', sub))
        body.append(row)
      })
      if (data.indexes.length) {
        section('Indexes')
        data.indexes.forEach((ix) => {
          var row = h('div', 'mmd-col')
          var line = h('div', 'mmd-col-line')
          line.append(h('strong', 'mmd-col-name', ix.name))
          ix.unique && line.append(h('span', 'mmd-chip', 'UQ'))
          row.append(line, h('small', 'mmd-col-sub', '(' + ix.cols.join(', ') + ')'))
          body.append(row)
        })
      }
      if (incoming.length + outgoing.length) {
        section('Relations')
        incoming.concat(outgoing.filter((e) => !incoming.includes(e))).forEach((edge) => {
          var out = edge.from === id
          var otherId = out ? edge.to : edge.from
          var other = byId.get(otherId)
          if (!other) return
          var meta = (model && model.links[local(edge.el.id)]) || {}
          var row = h('button', 'mmd-row')
          row.type = 'button'
          row.dataset.dir = out ? 'out' : 'in'
          var text = h('span', 'mmd-row-copy')
          text.append(h('strong', '', other.label))
          text.append(h('small', '', (out ? 'this.' + meta.childCol + ' → ' + other.label + '.' + meta.parentCol : other.label + '.' + meta.childCol + ' → this.' + meta.parentCol) + (meta.label ? ' · ' + meta.label.toLowerCase() : '')))
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
          body.append(row)
        })
      }
      card.append(head, counts, links, reachBar(id, reach), body)
    }

    // popup for a journey stage: where it sits on the sentiment scale and how the neighbouring stages change it
    var drawStage = (id) => {
      var node = byId.get(id)
      var data = (model && model.nodes[id]) || {name: node.label, section: '', n: 0, score: 0, level: '', actors: [], prev: '', next: '', low: false}
      var before = model && model.nodes[data.prev]
      var after = model && model.nodes[data.next]

      var head = h('div', 'mmd-card-head')
      var copy = h('div', 'mmd-card-copy')
      copy.append(h('span', 'mmd-card-eyebrow', 'Stage ' + data.n + (data.section ? ' · ' + data.section : '')), h('strong', 'mmd-card-title', data.name))
      data.low && copy.append(h('span', 'mmd-card-note', 'Lowest point of the journey'))
      var close = h('button', 'mmd-card-close', '×')
      close.type = 'button'
      close.title = 'Close (Esc)'
      close.setAttribute('aria-label', 'Close')
      close.addEventListener('click', () => focus(null))
      head.append(copy, close)

      var stat = (dir, text, value) => {
        var cell = h('div', 'mmd-stat')
        if (dir) cell.dataset.dir = dir
        cell.append(h('span', 'mmd-card-label', text), h('strong', '', value))
        return cell
      }
      var step = (to) => (before ? (to - before.score > 0 ? '+' : to - before.score < 0 ? '−' : '') + Math.abs(to - before.score) : '—')
      var first = h('div', 'mmd-card-stats mmd-auto')
      first.append(stat('', 'Level', data.level), stat('', 'Score', data.score + '/5'))
      var second = h('div', 'mmd-card-stats mmd-auto')
      second.append(stat(before && data.score > before.score ? 'in' : before && data.score < before.score ? 'out' : '', 'Change', step(data.score)), stat('', 'Actors', String(data.actors.length)))

      var body = h('div', 'mmd-card-list mmd-card-body')
      if (data.actors.length) {
        body.append(h('span', 'mmd-card-label mmd-card-section', 'Actors'))
        data.actors.forEach((actor) => {
          var row = h('div', 'mmd-col')
          row.append(h('strong', 'mmd-col-name', actor))
          body.append(row)
        })
      }
      body.append(h('span', 'mmd-card-label mmd-card-section', 'Path'))
      ;[[data.prev, before, true], [data.next, after, false]].forEach(([otherId, other, back]) => {
        var target = byId.get(otherId)
        if (!other || !target) return
        var edge = edges.find((e) => (back ? e.from === otherId && e.to === id : e.from === id && e.to === otherId))
        var row = h('button', 'mmd-row')
        row.type = 'button'
        row.dataset.dir = back ? 'in' : 'out'
        var text = h('span', 'mmd-row-copy')
        var delta = back ? data.score - other.score : other.score - data.score
        text.append(h('strong', '', other.name), h('small', '', other.level + ' · ' + other.score + '/5 · ' + (delta > 0 ? 'rises ' : delta < 0 ? 'drops ' : 'holds ') + (delta ? Math.abs(delta) : '')))
        row.append(h('span', 'mmd-row-dir', back ? '←' : '→'), text)
        var preview = null
        var on = () => {
          if (!edge) return
          edge.el.classList.add('mmd-peek')
          preview = flow(edge, back ? 'in' : 'out')
        }
        var off = () => {
          edge && edge.el.classList.remove('mmd-peek')
          preview && preview.remove()
        }
        row.addEventListener('mouseenter', on)
        row.addEventListener('focus', on)
        row.addEventListener('mouseleave', off)
        row.addEventListener('blur', off)
        row.addEventListener('click', () => {
          focus(otherId)
          center(target.el)
        })
        body.append(row)
      })
      card.append(head, first, second, body)
    }

    var focused = null
    var focus = (id, reach = null) => {
      isDbml && lightD([], [])
      svg.querySelectorAll('.mmd-on, .mmd-selected, .mmd-peek').forEach((el) => el.classList.remove('mmd-on', 'mmd-selected', 'mmd-peek'))
      // the label colour comes from a stylesheet scoped by the svg id, only inline !important outranks it
      svg.querySelectorAll('.edgeLabel span, .edgeLabel p').forEach((el) => {
        el.style.removeProperty('color')
        el.style.removeProperty('font-weight')
      })
      svg.querySelectorAll('.mmd-flow').forEach((el) => el.remove())
      edges.forEach((edge) => {
        tint(edge, false)
        delete edge.el.dataset.mmdDir
      })
      focused = id
      svg.classList.toggle('mmd-focus', !!id)
      if (id) {
        var {shown, used} = trace(id, reach)
        used.forEach((edge, index) => {
          var dir = reach === 'up' ? 'in' : reach === 'down' ? 'out' : edge.from === id ? 'out' : 'in'
          edge.el.dataset.mmdDir = dir
          edge.el.classList.add('mmd-on')
          edge.extras.forEach((el) => el.classList.add('mmd-on'))
          tint(edge, true, dir)
          if (edge.label) {
            edge.label.classList.add('mmd-on')
            edge.label.querySelectorAll('span, p').forEach((el) => {
              el.style.setProperty('color', document.documentElement.classList.contains('_mermaid-dark') ? '#f5f5f5' : '#2d3142', 'important')
              el.style.setProperty('font-weight', '600', 'important')
            })
          }
          flow(edge, dir, Math.min(index, 6) * 0.2, true)
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
    var hovered = []
    var peek = (hit) => {
      if (peeked === hit) return
      hovered.forEach((e) => {
        e.el.classList.remove('mmd-hover')
        if (!e.el.classList.contains('mmd-on')) {
          tint(e, false)
          delete e.el.dataset.mmdDir
        }
      })
      hovered = []
      peeked = hit
      var node = hit && nodes.find((n) => n.el === hit)
      if (!node || focused) return
      hovered = edges.filter((e) => e.from === node.id || e.to === node.id)
      hovered.forEach((e) => {
        var dir = e.from === node.id ? 'out' : 'in'
        e.el.dataset.mmdDir = dir
        e.el.classList.add('mmd-hover')
        tint(e, true, dir)
      })
    }
    pre.addEventListener('mouseover', (e) => !isEr && !isDbml && active() && nodes.length && peek(e.target.closest && e.target.closest('g.node')), {signal})
    pre.addEventListener('mouseleave', () => peek(null), {signal})

    // entity model: hover a relationship, a key row or an entity and the relationships through it light up with the
    // key rows they join: the primary key on the one side, the foreign key that refers to it on the many side
    if (isEr) {
      var squash = (text) => text.toLowerCase().replace(/[^a-z0-9]/g, '')
      var rowsOf = (n) => (n && n.el.__mmdRows) || []
      var tie = (edge) => {
        if (edge.tie) return edge.tie
        var many = (attr) => /oneOrMore|zeroOrMore/.test(edge.el.getAttribute(attr) || '')
        var childIsFrom = many('marker-start') && !many('marker-end')
        var parent = byId.get(childIsFrom ? edge.to : edge.from)
        var child = byId.get(childIsFrom ? edge.from : edge.to)
        var names = parent ? [squash(parent.id), squash(parent.label)].filter(Boolean) : []
        var refs = rowsOf(child).filter((r) => r.fk)
        var named = refs.filter((r) => names.some((name) => squash(r.field).includes(name)))
        return (edge.tie = {parent, child, parentRows: rowsOf(parent).filter((r) => r.pk), childRows: named.length ? named : refs})
      }
      var hot = {edges: [], rows: []}
      var light = (edgesOn, rowsOn) => {
        hot.edges.forEach((edge) => {
          edge.el.classList.remove('mmd-hover')
          edge.extras.forEach((el) => el.classList.remove('mmd-on'))
        })
        hot.rows.forEach((row) => [row.rect].concat(row.texts).forEach((el) => el.classList.remove('mmd-hit')))
        svg.querySelectorAll('.mmd-flow').forEach((el) => el.remove())
        hot = {edges: edgesOn, rows: rowsOn}
        edgesOn.forEach((edge) => {
          edge.el.classList.add('mmd-hover')
          edge.extras.forEach((el) => el.classList.add('mmd-on'))
          flow(edge, 'out', 0, true)
        })
        rowsOn.forEach((row) => [row.rect].concat(row.texts).forEach((el) => el.classList.add('mmd-hit')))
      }
      var through = (edgesOn, extra = []) => {
        var rowsOn = new Set(extra)
        edgesOn.forEach((edge) => {
          var t = tie(edge)
          t.parentRows.concat(t.childRows).forEach((row) => rowsOn.add(row))
        })
        light(edgesOn, Array.from(rowsOn))
      }
      var rowEdges = (n, row) => edges.filter((edge) => {
        var t = tie(edge)
        return (t.parent === n && row.pk && t.parentRows.includes(row)) || (t.child === n && row.fk && t.childRows.includes(row))
      })
      // like every other motion, only in fullscreen: inline the diagram stays still
      var erHover = (target) => {
        if (focused || !active()) return
        var hit = target && target.closest && target.closest('.mmd-er-hit')
        var edge = hit && edges.find((e) => e.el.getAttribute('data-id') === hit.getAttribute('data-edge'))
        if (edge) return through([edge])
        var el = target && target.closest && target.closest('g.node')
        var n = el && nodes.find((x) => x.el === el)
        if (!n) return light([], [])
        var row = rowsOf(n).find((r) => r.rect === target || r.texts.includes(target))
        if (!row) return through(edges.filter((e) => e.from === n.id || e.to === n.id))
        var linked = rowEdges(n, row)
        linked.length ? through(linked, [row]) : light([], row.pk || row.fk || row.uk ? [row] : [])
      }
      pre.addEventListener('mouseover', (e) => erHover(e.target), {signal})
      pre.addEventListener('mouseleave', () => light([], []), {signal})
    }
    var down = null
    // capture: panzoom stops pointerdown from bubbling in fullscreen, so a bubbling listener
    // would keep the position of an older press and read every later click as a drag
    pre.addEventListener('pointerdown', (e) => (down = {x: e.clientX, y: e.clientY}), {capture: true, signal})
    pre.addEventListener('click', (e) => {
      if (!active() || !nodes.length) return
      // a drag that ends on a node is a move, not a click
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) return
      var hit = e.target.closest && e.target.closest('g.node')
      var node = hit && nodes.find((n) => n.el === hit)
      focus(node && node.id !== focused ? node.id : null)
    }, {signal})

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

    // sequence diagrams: step through the messages in order. A token travels along the current message,
    // the ones still to come stay dimmed, and the run ends with the whole diagram shown again
    var seqStop = () => {}
    var seqKey = () => false
    if (plays) {
      var TRAVEL = 480
      var HOLD = 720
      var calm = !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      var sequenceSteps = () => {
      var msgs = Array.from(svg.querySelectorAll('.messageLine0, .messageLine1')).map((line) => {
        var before = line.previousElementSibling
        var text = before && before.classList.contains('messageText') ? before : null
        // the autonumber dot (a bare line with a marker) and its number follow the line, possibly after an activation bar
        var extras = []
        for (var after = line.nextElementSibling; after && !/messageLine|messageText/.test(after.getAttribute('class') || ''); after = after.nextElementSibling) {
          if (after.tagName.toLowerCase() === 'line' || after.classList.contains('sequenceNumber')) extras.push(after)
        }
        // what the ends look like decides how it plays: an arrowhead is travelled towards, a cross is a lost
        // message (red), and a plain line has no direction so it shows an indeterminate progress (blue)
        var from = line.getAttribute('marker-start')
        var to = line.getAttribute('marker-end')
        var lost = /crosshead/.test((from || '') + (to || ''))
        var kind = lost ? 'lost' : from || to ? 'head' : 'plain'
        var parts = [line, text].concat(extras)
        parts.forEach((el) => el && el.setAttribute('data-mmd-kind', kind))
        // the lifelines it leaves and reaches, and how far down it sits
        var isLine = line.tagName.toLowerCase() === 'line'
        var begin = isLine ? {x: parseFloat(line.getAttribute('x1')), y: parseFloat(line.getAttribute('y1'))} : line.getPointAtLength(0)
        var end = isLine ? {x: parseFloat(line.getAttribute('x2'))} : begin
        return {parts, line, kind, from, to, tinted: [], label: text ? text.textContent.trim() : '', x: [begin.x, end.x], y: begin.y}
      })

      // messages that leave one lifeline for different targets, with nothing else reaching that lifeline in between,
      // are a fan-out and play together; a fragment edge (alt / else / loop) between two messages keeps them apart
      var lifelines = Array.from(svg.querySelectorAll('line.actor-line')).map((l) => parseFloat(l.getAttribute('x1')))
      var near = (x) => lifelines.reduce((best, lx, i) => (Math.abs(lx - x) < Math.abs(lifelines[best] - x) ? i : best), 0)
      var edges_ = Array.from(svg.querySelectorAll('.loopLine'))
        .filter((l) => l.tagName.toLowerCase() === 'line' && l.getAttribute('y1') === l.getAttribute('y2'))
        .map((l) => parseFloat(l.getAttribute('y1')))
      var fenced = (a, b) => edges_.some((y) => y > Math.min(a, b) && y < Math.max(a, b))
      var levels = []
      var ready = {}
      msgs.forEach((msg) => {
        var a = near(msg.x[0])
        var b = near(msg.x[1])
        var level = ready[a] || 0
        while (levels[level] && levels[level].some((other) => other.b === b || fenced(other.y, msg.y))) level++
        ;(levels[level] = levels[level] || []).push(Object.assign(msg, {b}))
        ready[a] = level
        ready[b] = Math.max(ready[b] || 0, level + 1)
      })
      return levels.filter(Boolean).map((group) => {
        group.sort((m, n) => m.y - n.y)
        return {
          msgs: group,
          parts: group.flatMap((m) => m.parts),
          label: group.map((m) => m.label).filter(Boolean).join(' \u00B7 '),
        }
      })
      }

      // state diagrams: walk the transitions breadth first from the start, so the machine unfolds the way it is read.
      // A composite state plays what is inside it before it is left, the branches of a fork leave together
      var stateSteps = () => {
        var named = (id) => {
          var node = byId.get(id)
          return (node && node.label) || (/start/.test(id) ? 'Start' : /end/.test(id) ? 'End' : id)
        }
        var rect = (n) => n.el.getBoundingClientRect()
        var holds = (cluster, n) => {
          var a = rect(cluster)
          var b = rect(n)
          return n !== cluster && b.left >= a.left && b.right <= a.right && b.top >= a.top && b.bottom <= a.bottom
        }
        var clusters = nodes.filter((n) => n.cluster)
        var incoming = new Set(edges.map((e) => e.to))
        var bar = (id) => {
          var node = byId.get(id)
          var box = node && rect(node)
          return !!box && !node.cluster && box.height > box.width * 3
        }
        var order = []
        var entered = new Set()
        var queue = []
        // depth first: a state's transitions play before the siblings that were waiting. Reaching a composite state
        // plays what is inside it first, then the transitions that leave it
        var enter = (id) => {
          if (entered.has(id)) return
          entered.add(id)
          var node = byId.get(id)
          var out = edges.filter((e) => e.from === id)
          if (!node || !node.cluster) return void queue.unshift(...out)
          var inside = []
          nodes.filter((n) => !n.cluster && holds(node, n) && !incoming.has(n.id) && !entered.has(n.id)).forEach((n) => {
            entered.add(n.id)
            inside.push(...edges.filter((e) => e.from === n.id))
          })
          queue.unshift(...inside, ...out)
        }
        nodes.filter((n) => !incoming.has(n.id) && !clusters.some((c) => holds(c, n))).reverse().forEach((n) => enter(n.id))
        while (queue.length) {
          var edge = queue.shift()
          if (order.includes(edge)) continue
          order.push(edge)
          enter(edge.to)
        }
        edges.filter((e) => !order.includes(e)).forEach((e) => order.push(e))
        var steps = []
        order.forEach((edge) => {
          var msg = {
            line: edge.el,
            kind: 'head',
            from: null,
            to: edge.el.getAttribute('marker-end'),
            tinted: [],
            edge
          }
          var parts = [edge.el, edge.label, ...edge.extras]
          edge.el.setAttribute('data-mmd-kind', 'head')
          var say = (edge.label ? edge.label.textContent.trim() + ' \u00B7 ' : '') + named(edge.from) + ' \u2192 ' + named(edge.to)
          // the branches that leave a fork, and the ones that meet at a join, play together
          var key = bar(edge.from) ? 'from:' + edge.from : bar(edge.to) ? 'to:' + edge.to : null
          var step = key && steps.find((s) => s.key === key)
          if (step) {
            step.msgs.push(msg)
            step.parts.push(...parts)
            step.to.push(edge.to)
            step.label += ' | ' + say
          }
          else {
            steps.push({msgs: [msg], parts, to: [edge.to], label: say, key})
          }
        })
        return steps
      }
      var steps = isState ? stateSteps() : sequenceSteps()
      var starts = isState ? new Set(nodes.filter((n) => !edges.some((e) => e.to === n.id)).map((n) => n.id)) : null
      var at = -1
      var playing = false
      var timer = 0
      var frame = 0
      var drawn = []

      var player = h('div', 'mmd-player')
      player.hidden = true
      ;['pointerdown', 'click', 'dblclick', 'wheel'].forEach((type) => player.addEventListener(type, (e) => e.stopPropagation()))
      var tool = (name, title, onclick) => {
        var btn = h('button', 'mmd-player-btn')
        btn.type = 'button'
        btn.title = title
        btn.setAttribute('aria-label', title)
        btn.innerHTML = icon(name)
        btn.addEventListener('click', onclick)
        return btn
      }
      var counter = h('span', 'mmd-player-count')
      var caption = h('span', 'mmd-player-caption')
      var playTool = tool('play', 'Play (P)', () => toggle())
      var closeTool = h('button', 'mmd-player-close', '\u00D7')
      closeTool.type = 'button'
      closeTool.title = 'Close (Esc)'
      closeTool.setAttribute('aria-label', 'Close')
      closeTool.addEventListener('click', () => seqStop())
      player.append(tool('prev', 'Previous message ([)', () => move(-1)), playTool, tool('next', 'Next message (])', () => move(1)), counter, caption, closeTool)
      pre.appendChild(player)

      var markSteps = (current) => steps.forEach((step, j) => {
        var state = current < 0 ? '' : j < current ? 'done' : j === current ? 'now' : 'wait'
        step.msgs.forEach((msg) => light(msg, state === 'now'))
        step.parts.forEach((el) => {
          if (!el) return
          state ? el.setAttribute('data-mmd-seq', state) : el.removeAttribute('data-mmd-seq')
        })
      })
      // the states take the run's colours too: the one just reached is lit, the ones reached before stay, the rest wait
      var markNodes = (current) => nodes.forEach((n) => {
        var reached = starts.has(n.id) || current >= steps.length || steps.slice(0, Math.max(current, 0)).some((s) => s.to.includes(n.id))
        var now = current >= 0 && current < steps.length && steps[current].to.includes(n.id)
        var state = current < 0 ? '' : now ? 'now' : reached ? 'done' : 'wait'
        state ? n.el.setAttribute('data-mmd-seq', state) : n.el.removeAttribute('data-mmd-seq')
      })
      var mark = (current) => {
        markSteps(current)
        isState && markNodes(current)
      }
      var clearToken = () => {
        cancelAnimationFrame(frame)
        drawn.forEach((el) => el.remove())
        drawn = []
      }
      // arrowheads and crosses are marker elements, so the current message gets a coloured copy of each
      var dark = () => document.documentElement.classList.contains('_mermaid-dark')
      var tone = (kind) => ({
        head: '#eb6c36',
        lost: dark() ? '#f07f77' : '#c0392b',
        plain: dark() ? '#79b1f9' : '#2e5aa8',
      })[kind]
      var light = (step, on) => {
        step.tinted.forEach(({attr, original}) => step.line.setAttribute(attr, original))
        step.tinted = []
        if (!on) return
        ;['marker-start', 'marker-end'].forEach((attr) => {
          var original = step.line.getAttribute(attr)
          var match = /#([^")]+)/.exec(original || '')
          if (!match) return
          var copyId = match[1] + '-lit-' + step.kind
          if (!svg.querySelector('[id="' + copyId + '"]')) {
            var source = svg.querySelector('[id="' + match[1] + '"]')
            if (!source) return
            var copy = source.cloneNode(true)
            copy.id = copyId
            var originals = source.querySelectorAll('*')
            copy.querySelectorAll('*').forEach((part, i) => {
              var style = getComputedStyle(originals[i])
              if (style.fill !== 'none') part.style.setProperty('fill', tone(step.kind), 'important')
              if (style.stroke !== 'none') part.style.setProperty('stroke', tone(step.kind), 'important')
            })
            source.parentNode.appendChild(copy)
          }
          step.tinted.push({attr, original})
          step.line.setAttribute(attr, 'url(#' + copyId + ')')
        })
      }
      var travelOne = (step) => {
        var line = step.line
        var parent = line.parentNode
        var ns = 'http://www.w3.org/2000/svg'
        // no arrowhead, no direction: an indeterminate bar slides along the line while the step lasts
        if (step.kind === 'plain') {
          var bar = line.cloneNode(false)
          ;['id', 'style', 'marker-start', 'marker-end', 'data-mmd-seq', 'data-mmd-kind'].forEach((name) => bar.removeAttribute(name))
          bar.setAttribute('class', 'mmd-indet')
          bar.setAttribute('pathLength', '1')
          parent.appendChild(bar)
          drawn.push(bar)
          return
        }
        var point
        if (line.tagName.toLowerCase() === 'line') {
          var [x1, y1, x2, y2] = ['x1', 'y1', 'x2', 'y2'].map((name) => parseFloat(line.getAttribute(name)))
          point = (t) => ({x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t})
        }
        else {
          var length = line.getTotalLength()
          point = (t) => line.getPointAtLength(length * t)
        }
        // each head is travelled towards from the opposite end, two heads send one token from each end past each other
        var ways = step.from && step.to ? [1, -1] : [step.from ? -1 : 1]
        var tokens = ways.map((way) => {
          var token = document.createElementNS(ns, 'circle')
          token.setAttribute('class', 'mmd-token')
          token.setAttribute('data-kind', step.kind)
          token.setAttribute('r', '4')
          parent.appendChild(token)
          drawn.push(token)
          return {token, way}
        })
        var place = (t) => tokens.forEach(({token, way}) => {
          var p = point(way > 0 ? t : 1 - t)
          token.setAttribute('cx', p.x)
          token.setAttribute('cy', p.y)
        })
        place(0)
        return place
      }
      // every message of a step travels on one clock
      var travel = (step) => {
        var places = step.msgs.map(travelOne).filter(Boolean)
        if (calm) return places.forEach((place) => place(1))
        var begin = performance.now()
        var tick = (now) => {
          var t = Math.min((now - begin) / TRAVEL, 1)
          places.forEach((place) => place(t))
          if (t < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      }
      var paint = () => {
        playTool.innerHTML = icon(playing ? 'pause' : 'play')
        playTool.title = playing ? 'Pause (P)' : at >= steps.length ? 'Replay (P)' : 'Play (P)'
        playTool.setAttribute('aria-label', playTool.title)
      }
      var go = (i) => {
        clearTimeout(timer)
        clearToken()
        player.hidden = false
        svg.classList.add('mmd-seq')
        at = Math.max(0, Math.min(i, steps.length - 1))
        mark(at)
        travel(steps[at])
        counter.textContent = at + 1 + ' / ' + steps.length
        caption.textContent = steps[at].label
        paint()
        if (playing) timer = setTimeout(() => (at + 1 < steps.length ? go(at + 1) : finish()), HOLD)
      }
      // the run ends complete: every message back at full strength
      var finish = () => {
        clearTimeout(timer)
        clearToken()
        playing = false
        at = steps.length
        mark(at)
        counter.textContent = steps.length + ' / ' + steps.length
        caption.textContent = 'Complete'
        paint()
      }
      var pause = () => {
        playing = false
        clearTimeout(timer)
        paint()
      }
      var toggle = () => {
        if (!steps.length) return
        if (at < 0 || at >= steps.length) {
          playing = true
          go(0)
        }
        else if (playing) {
          pause()
        }
        else {
          playing = true
          go(at)
        }
      }
      var move = (by) => {
        if (!steps.length) return
        pause()
        if (by > 0 && at >= steps.length - 1 && at >= 0) return finish()
        go(at < 0 ? 0 : at >= steps.length ? steps.length - 1 : at + by)
      }
      seqStop = () => {
        playing = false
        clearTimeout(timer)
        clearToken()
        at = -1
        mark(-1)
        svg.classList.remove('mmd-seq')
        player.hidden = true
        paint()
      }
      seqKey = (e) => {
        if (e.key === 'p' || e.key === 'P') return toggle(), true
        if (e.key === '[') return move(-1), true
        if (e.key === ']') return move(1), true
        if (e.key === 'Escape' && at >= 0) return seqStop(), true
        return false
      }
      paint()
    }

    pre._mmdSeqStop = seqStop
    pre._mmdSeqToggle = () => seqKey({key: 'p'})

    // keys while fullscreen: + - 0 zoom, arrows move, / find, M map, P play, escape unwinds focus then fullscreen
    pre._mmdKey = (e) => {
      if (e.target === finder) return false
      if (seqKey(e)) return true
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
        isEr && light([], [])
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
      var definitions = walk(/<pre><code class="mermaid(?: dbml)?">([\s\S]+?)<\/code><\/pre>/gi, state.html)

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
      sequence: {actorMargin: 64, boxMargin: 12, noteMargin: 12, messageMargin: 40, mirrorActors: false, activationWidth: 8},
      state: {padding: 12},
      er: {fontSize: 12, entityPadding: 4},
      gantt: {barHeight: 20, barGap: 8, fontSize: 11, sectionFontSize: 11}
    }
    mermaid.initialize(config)
    // render from textContent: mermaid.init reads innerHTML and its entity decoding fails in Firefox content scripts
    var jobs = Array.from(document.querySelectorAll('code.mermaid')).map((node) => {
      var text = node.textContent
      var id = 'mmd-' + ++sequence
      node.removeAttribute('data-processed')
      // dbml and user journeys draw themselves, mermaid only gets what they hand back
      var custom = node.classList.contains('dbml')
        ? () => dbml.render(text, t, {sans, mono}, id)
        : () => journey.render(text, t, {sans, mono}, id)
      var drawn = Promise.resolve().then(custom).then((svg) => (svg ? {svg} : mermaid.render(id, text)))
      return drawn.then(({svg, bindFunctions}) => {
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
      document.querySelectorAll('code.mermaid svg[aria-roledescription=classDiagram]').forEach(classBoxes)
      document.querySelectorAll('code.mermaid svg[aria-roledescription=er]').forEach(erBoxes)
      document.querySelectorAll('code.mermaid svg').forEach(labelsOnLines)
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
