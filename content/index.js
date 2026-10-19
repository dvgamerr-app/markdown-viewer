
var $ = document.querySelector.bind(document)

var state = {
  theme: args.theme,
  raw: args.raw,
  themes: args.themes,
  content: args.content,
  compiler: args.compiler,
  custom: args.custom,
  icon: args.icon,
  html: '',
  markdown: '',
  toc: '',
  reload: {
    interval: null,
    ms: 1000,
    md: false,
  },
  _themes: {
    'github': 'light',
    'github-dark': 'dark',
    'nimbus': 'light',
    'nimbus-dark': 'dark',
    'almond': 'light',
    // 'air': 'light',
    'awsm': 'light',
    'axist': 'light',
    'bamboo': 'auto',
    'bullframe': 'light',
    'holiday': 'auto',
    'kacit': 'light',
    'latex': 'light',
    'marx': 'light',
    'mini': 'light',
    'modest': 'light',
    'new': 'auto',
    'no-class': 'auto',
    'pico': 'auto',
    'retro': 'dark',
    'sakura': 'light',
    'sakura-vader': 'dark',
    'semantic': 'light',
    'simple': 'auto',
    // 'splendor': 'light',
    'style-sans': 'light',
    'style-serif': 'light',
    'stylize': 'light',
    'superstylin': 'auto',
    'tacit': 'light',
    'vanilla': 'auto',
    'water': 'light',
    'water-dark': 'dark',
    'writ': 'light',
    'custom': 'auto',
  }
}

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.message === 'reload') {
    location.reload(true)
  }
  else if (req.message === 'theme') {
    state.theme = req.theme
    m.redraw()
  }
  else if (req.message === 'themes') {
    state.themes = req.themes
    m.redraw()
  }
  else if (req.message === 'raw') {
    state.raw = req.raw
    state.reload.md = true
    m.redraw()
  }
  else if (req.message === 'autoreload') {
    clearInterval(state.reload.interval)
  }
})

var oncreate = {
  html: () => {
    update()
  }
}

var onupdate = {
  html: () => {
    if (state.reload.md) {
      state.reload.md = false
      update(true)
    }
  },
  theme: () => {
    if (state.content.mermaid) {
      setTimeout(() => mmd.render(), 0)
    }
  }
}

var update = (update) => {
  scroll(update)

  if (state.content.syntax) {
    setTimeout(() => Prism.highlightAll(), 20)
  }

  if (state.content.mermaid) {
    setTimeout(() => mmd.render(), 40)
  }

  if (state.content.mathjax) {
    setTimeout(() => mj.render(), 60)
  }
}

var render = (md) => {
  state.markdown = md
  chrome.runtime.sendMessage({
    message: 'markdown',
    compiler: state.compiler,
    markdown: frontmatter(state.markdown)
  }, (res) => {
    state.html = res.html
    if (state.content.emoji) {
      state.html = emojinator(state.html)
    }
    if (state.content.mermaid) {
      state.html = state.html.replace(
        /<code class="language-(?:mermaid|mmd)">/gi,
        '<code class="mermaid">'
      )
    }
    if (state.content.toc) {
      state.toc = toc.render(state.html)
    }
    state.html = anchors(state.html)
    m.redraw()
  })
}

function mount () {
  $('pre').style.display = 'none'
  var md = $('pre').innerText
  favicon()

  m.mount($('body'), {
    oninit: () => {
      render(md)
    },
    view: () => {
      var dom = []

      if (state.html) {
        state._themes.custom = state.custom.color

        var color =
          state._themes[state.theme] === 'dark' ||
          (state._themes[state.theme] === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
          ? 'dark' : 'light'

        $('body').classList.remove(...Array.from($('body').classList).filter((name) => /^_theme|_color/.test(name)))
        dom.push(m('link#_theme', {
          onupdate: onupdate.theme,
          rel: 'stylesheet', type: 'text/css',
          href: state.theme !== 'custom' ? chrome.runtime.getURL(`/themes/${state.theme}.css`) : '',
        }))
        $('body').classList.add(`_theme-${state.theme}`, `_color-${color}`)

        if (state.content.syntax) {
          dom.push(m('link#_prism', {
            rel: 'stylesheet', type: 'text/css',
            href: chrome.runtime.getURL(`/vendor/${color === 'dark' ? 'prism-okaidia' : 'prism'}.min.css`),
          }))
        }

        var theme =
          (/github(-dark)?/.test(state.theme) ? 'markdown-body' : 'markdown-theme') +
          (state.themes.width !== 'auto' ? ` _width-${state.themes.width}` : '')

        if (state.raw) {
          if (state.content.syntax) {
            dom.push(m('#_markdown', {oncreate: oncreate.html, onupdate: onupdate.html, class: theme},
              m.trust(`<pre class="language-md"><code class="language-md">${_escape(state.markdown)}</code></pre>`)
            ))
          }
          else {
            dom.push(m('pre#_markdown', {oncreate: oncreate.html, onupdate: onupdate.html}, state.markdown))
          }
        }
        else {
          dom.push(m('#_html', {oncreate: oncreate.html, onupdate: onupdate.html, class: theme},
            m.trust(state.html)
          ))
        }

        if (state.content.toc) {
          dom.push(m('#_toc.tex2jax-ignore', {oncreate: toc.spy, onupdate: toc.spy}, m.trust(state.toc)))
          state.raw ? $('body').classList.remove('_toc-right') : $('body').classList.add('_toc-right')
        }

        if (state.theme === 'custom') {
          dom.push(m('style', {type: 'text/css'}, state.custom.theme))
        }
      }

      return dom
    }
  })
}

var anchors = (html) =>
  html.replace(/(<h[1-6] id="(.*?)">)/g, (header, _, id) =>
    header +
    '<a class="anchor" name="' + id + '" href="#' + id + '">' +
    '<span class="octicon octicon-link"></span></a>'
  )

var toc = (() => {
  var walk = (regex, string, group, result = [], match = regex.exec(string)) =>
    !match ? result : walk(regex, string, group, result.concat(!group ? match[1] :
      group.reduce((all, name, index) => (all[name] = match[index + 1], all), {})))

  // nimbus "on this page": static rail (border-l + S-curves at indent changes)
  // with an animated active indicator that slides along the rail's arc length
  var READING_BAND = 0.25
  var BOTTOM_EPSILON = 2
  var REVEAL_PADDING = 12

  var curve = (from, to, d) =>
    '<svg aria-hidden="true" class="_toc-curve" viewBox="0 0 1 1" preserveAspectRatio="none" ' +
    'fill="none" stroke="currentColor" stroke-width="2" overflow="visible" ' +
    'style="margin-left: calc(' + from + 'rem - 0.0625rem); width: ' + Math.abs(to - from) + 'rem;">' +
    '<path d="' + d + '" vector-effect="non-scaling-stroke"/></svg>'

  var init = (root) => {
    var nav = root.querySelector('nav')
    var activePath = root.querySelector('[data-toc-rail-active]')
    var links = Array.from(root.querySelectorAll('[data-toc-link]'))
    if (!nav || !activePath || !links.length) return () => {}

    var slugs = links.map((link) => link.dataset.slug)
    var observed = slugs
      .map((slug, index) => ({el: document.getElementById(slug), index}))
      .filter((o) => o.el !== null)
    if (!observed.length) return () => {}

    var segments = []
    var totalLength = 0
    var currentIndex = -1
    var currentLink = null
    var hasApplied = false

    var buildRail = () => {
      var navRect = nav.getBoundingClientRect()
      var m = links.map((link) => {
        var r = link.getBoundingClientRect()
        return {x: r.left - navRect.left + 1, yTop: r.top - navRect.top, yBot: r.top - navRect.top + r.height}
      })
      var measure = (sub) => {
        activePath.setAttribute('d', sub)
        return activePath.getTotalLength()
      }
      var d = ''
      var next = []
      var cumulative = 0
      var prevX = 0
      var prevYBot = 0
      m.forEach((cur, i) => {
        if (i === 0) {
          d += `M ${cur.x} ${cur.yTop} `
        }
        else {
          var prev = m[i - 1]
          var midY = (prev.yBot + cur.yTop) / 2
          var connector = Math.abs(cur.x - prev.x) < 0.5
            ? `L ${cur.x} ${cur.yTop} `
            : `C ${prev.x} ${midY}, ${cur.x} ${midY}, ${cur.x} ${cur.yTop} `
          d += connector
          cumulative += measure(`M ${prevX} ${prevYBot} ${connector}`)
        }
        var start = cumulative
        var seg = `L ${cur.x} ${cur.yBot} `
        d += seg
        cumulative += measure(`M ${cur.x} ${cur.yTop} ${seg}`)
        next.push({start, length: cumulative - start})
        prevX = cur.x
        prevYBot = cur.yBot
      })
      activePath.setAttribute('d', d)
      segments = next
      totalLength = cumulative
    }

    var applyActive = (index, instant) => {
      var seg = segments[index]
      if (!seg) return
      if (instant) {
        activePath.setAttribute('data-initial', 'true')
        void activePath.getBoundingClientRect()
      }
      activePath.style.strokeDasharray = `${seg.length} ${totalLength + 1}`
      activePath.style.strokeDashoffset = `${-seg.start}`
      if (instant) {
        requestAnimationFrame(() => {
          activePath.setAttribute('data-ready', 'true')
          requestAnimationFrame(() => activePath.removeAttribute('data-initial'))
        })
      }
    }

    var reveal = (link) => {
      var hostRect = root.getBoundingClientRect()
      var linkRect = link.getBoundingClientRect()
      if (linkRect.top < hostRect.top + REVEAL_PADDING) {
        root.scrollTop += linkRect.top - hostRect.top - REVEAL_PADDING
      }
      else if (linkRect.bottom > hostRect.bottom - REVEAL_PADDING) {
        root.scrollTop += linkRect.bottom - hostRect.bottom + REVEAL_PADDING
      }
    }

    var setActive = (index) => {
      if (index === currentIndex) return
      currentIndex = index
      currentLink && currentLink.removeAttribute('aria-current')
      currentLink = links[index] || null
      if (currentLink) {
        currentLink.setAttribute('aria-current', 'true')
        reveal(currentLink)
      }
      applyActive(index, !hasApplied)
      hasApplied = true
    }

    var observedIndex = 0
    var atBottom = false
    var pinnedIndex = null
    var pinnedEnteredViewport = false

    var resolve = () =>
      setActive(pinnedIndex !== null ? pinnedIndex : atBottom ? links.length - 1 : observedIndex)

    var updateObservedIndex = () => {
      var bandBottom = window.innerHeight * READING_BAND
      var index = 0
      for (var o of observed) {
        if (o.el.getBoundingClientRect().top <= bandBottom) index = o.index
        else break
      }
      observedIndex = index
    }

    var updateBottom = () => {
      var scrollEl = document.scrollingElement || document.documentElement
      var maxScroll = scrollEl.scrollHeight - window.innerHeight
      atBottom = maxScroll > BOTTOM_EPSILON && scrollEl.scrollTop >= maxScroll - BOTTOM_EPSILON
    }

    var releaseStalePin = () => {
      if (pinnedIndex === null) return
      var heading = document.getElementById(slugs[pinnedIndex])
      if (!heading) {
        pinnedIndex = null
        pinnedEnteredViewport = false
        return
      }
      var rect = heading.getBoundingClientRect()
      if (rect.bottom >= 0 && rect.top <= window.innerHeight) {
        pinnedEnteredViewport = true
      }
      else if (pinnedEnteredViewport) {
        pinnedIndex = null
        pinnedEnteredViewport = false
      }
    }

    var ticking = false
    var onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        updateObservedIndex()
        updateBottom()
        releaseStalePin()
        resolve()
        ticking = false
      })
    }

    var onLayoutChange = () => {
      buildRail()
      updateObservedIndex()
      updateBottom()
      releaseStalePin()
      resolve()
      if (currentIndex >= 0) {
        applyActive(currentIndex, true)
        links[currentIndex] && reveal(links[currentIndex])
      }
    }

    var controller = new AbortController()
    var signal = controller.signal

    // clicking a link pins it until the reader scrolls by hand
    nav.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      var link = e.target.closest('[data-toc-link]')
      if (!link) return
      var i = slugs.indexOf(link.dataset.slug)
      if (i === -1) return
      pinnedIndex = i
      var rect = document.getElementById(slugs[i])?.getBoundingClientRect()
      pinnedEnteredViewport = !!rect && rect.bottom >= 0 && rect.top <= window.innerHeight
      resolve()
    }, {signal})

    var releasePin = () => {
      if (pinnedIndex === null) return
      pinnedIndex = null
      pinnedEnteredViewport = false
      resolve()
    }
    var keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar']
    window.addEventListener('wheel', releasePin, {passive: true, signal})
    window.addEventListener('touchmove', releasePin, {passive: true, signal})
    window.addEventListener('keydown', (e) => keys.includes(e.key) && releasePin(), {signal})
    window.addEventListener('scroll', onScroll, {passive: true, signal})
    window.addEventListener('resize', onLayoutChange, {passive: true, signal})

    var ro = new ResizeObserver(onLayoutChange)
    ro.observe(nav)

    buildRail()
    updateObservedIndex()
    updateBottom()
    resolve()

    return () => {
      controller.abort()
      ro.disconnect()
    }
  }

  var cleanup = () => {}
  var mounted = null

  return {
    render: (html) => {
      var headers = walk(
        /<h([1-6]) id="(.*?)">(.*?)<\/h[1-6]>/gs,
        html,
        ['level', 'id', 'title']
      ).map((header) => ({...header, level: parseInt(header.level)}))

      // a single h1 is the page title, list the sections below it
      if (headers.filter(({level}) => level === 1).length === 1 && headers.length > 1) {
        headers = headers.filter(({level}) => level !== 1)
      }
      if (!headers.length) return ''
      var top = Math.min(...headers.map(({level}) => level))

      return '<div class="_toc-title">On this page</div>' +
        '<nav aria-label="Table of contents" class="_toc-nav">' +
        '<svg data-toc-rail aria-hidden="true" class="_toc-rail" fill="none">' +
        '<path data-toc-rail-active class="_toc-rail-active" stroke-width="2" stroke-linecap="round"/></svg>' +
        '<ul class="_toc-list">' +
        headers.map(({id, title, level}, i) => {
          var depth = level - top
          var prev = i > 0 ? headers[i - 1].level - top : depth
          var next = i < headers.length - 1 ? headers[i + 1].level - top : depth
          return '<li>' +
            (depth > prev ? curve(prev, depth, 'M 0 0 C 0 0.5, 1 0.5, 1 1') : '') +
            '<a href="#' + id + '" data-toc-link data-slug="' + id + '" ' +
            'style="margin-left: calc(' + depth + 'rem - 0.125rem);">' +
            title.replace(/<a[^>]+>/g, '').replace(/<\/a>/g, '') +
            '</a>' +
            (next < depth ? curve(next, depth, 'M 1 0 C 1 0.5, 0 0.5, 0 1') : '') +
            '</li>'
        }).join('') +
        '</ul></nav>'
    },
    spy: (vnode) => {
      var root = vnode && vnode.dom || document.getElementById('_toc')
      if (!root) return
      var nav = root.querySelector('nav')
      // mithril keeps #_toc across redraws; re-init only when the trusted html was replaced
      if (nav && nav === mounted) return
      cleanup()
      mounted = nav
      cleanup = init(root)
    }
  }
})()

var frontmatter = (md) => {
  if (/^-{3}[\s\S]+?-{3}/.test(md)) {
    var [, yaml] = /^-{3}([\s\S]+?)-{3}/.exec(md)
    var title = /title: (?:'|")*(.*)(?:'|")*/.exec(yaml)
    title && (document.title = title[1])
  }
  else if (/^\+{3}[\s\S]+?\+{3}/.test(md)) {
    var [, toml] = /^\+{3}([\s\S]+?)\+{3}/.exec(md)
    var title = /title = (?:'|"|`)*(.*)(?:'|"|`)*/.exec(toml)
    title && (document.title = title[1])
  }
  return md.replace(/^(?:-|\+){3}[\s\S]+?(?:-|\+){3}/, '')
}

var favicon = () => {
  var favicon = document.createElement('link')
  favicon.rel = 'icon'
  favicon.href = chrome.runtime.getURL(`/icons/${state.icon}/16x16.png`)
  $('head').appendChild(favicon)
}

var _escape = (str) =>
  str.replace(/[&<>]/g, (tag) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
  }[tag] || tag))

if (document.readyState === 'complete') {
  mount()
}
else {
  var timeout = setInterval(() => {
    if (document.readyState === 'complete') {
      clearInterval(timeout)
      mount()
    }
  }, 0)
}
