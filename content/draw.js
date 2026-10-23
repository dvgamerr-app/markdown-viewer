// What the self-drawn diagrams share: markup-safe text, numbers on the grid, text metrics from a canvas and the
// source split into lines. Loaded before every renderer, see background/inject.js
var draw = (() => {
  var esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]))
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
    (ctx ? (ctx.font = `${weight || 400} ${size}px ${family}`, ctx.measureText(s).width) : s.length * size * 0.58) + s.length * tracking

  // one line no wider than max, cut with an ellipsis
  var fit = (text, max, size, family, weight, tracking) => {
    if (measure(text, size, family, weight, tracking) <= max) return text
    var cut = text
    while (cut.length > 1 && measure(cut + '…', size, family, weight, tracking) > max) cut = cut.slice(0, -1)
    return cut + '…'
  }

  // words onto lines no wider than max, the last line ends in an ellipsis when the text is cut
  var wrap = (text, max, size, family, weight, limit, tracking) => {
    var lines = []
    var line = ''
    String(text).split(/\s+/).filter(Boolean).forEach((word) => {
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

  // the source as lines, or null when a %%{init}%% directive configures mermaid: its settings only apply to
  // mermaid's own drawing, so mermaid draws the diagram
  var lines = (src) => (/%%\{[\s\S]*?\}%%/.test(src) ? null : src.split('\n'))

  return {esc, num, grid, measure, fit, wrap, lines}
})()
