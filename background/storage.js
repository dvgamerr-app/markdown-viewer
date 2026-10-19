
// chrome.storage.sync.clear()
// chrome.permissions.getAll((p) => chrome.permissions.remove({origins: p.origins}))

md.storage = ({compilers}) => {

  var defaults = md.storage.defaults(compilers)

  var state = {}

  async function set (options) {
    await chrome.storage.sync.set(options)
    Object.assign(state, options)
  }

  chrome.storage.sync.get((res) => {
    md.storage.bug(res)

    Object.assign(state, JSON.parse(JSON.stringify(
      !Object.keys(res).length ? defaults : res)))

    // in case of new providers from the compilers branch
    Object.keys(compilers).forEach((compiler) => {
      if (!state[compiler]) {
        state[compiler] = compilers[compiler].defaults
      }
    })

    // mutate
    md.storage.migrations(state)

    set(state)
  })

  return {defaults, state, set}
}

md.storage.defaults = (compilers) => {
  var match = '\\.(?:markdown|mdown|mkdn|md|mkd|mdwn|mdtxt|mdtext|text)(?:#.*|\\?.*)?$'

  var defaults = {
    theme: 'nimbus',
    compiler: 'markdown-it',
    raw: false,
    match,
    themes: {
      width: 'auto',
    },
    content: {
      autoreload: true,
      emoji: true,
      mathjax: true,
      mermaid: true,
      syntax: true,
      toc: true,
    },
    origins: {
      'file://': {
        header: true,
        path: true,
        match,
      }
    },
    settings: {
      icon: 'default',
      theme: 'light',
    },
    custom: {
      theme: '',
      color: 'auto',
    }
  }

  Object.keys(compilers).forEach((compiler) => {
    defaults[compiler] = compilers[compiler].defaults
  })

  return defaults
}

md.storage.bug = (res) => {
  // reload extension bug
  chrome.permissions.getAll((permissions) => {
    var origins = Object.keys(res.origins || {})
    // host_permissions from the manifest are required and cannot be removed
    var required = chrome.runtime.getManifest().host_permissions || []
    var remove = permissions.origins
      .filter((origin) => origins.indexOf(origin.slice(0, -2)) === -1)
      .filter((origin) => required.indexOf(origin) === -1)
    if (remove.length) {
      chrome.permissions.remove({origins: remove})
    }
  })
}

md.storage.migrations = (state) => {
  // v3.6 -> v3.7
  if (typeof state.origins['file://'] === 'object') {
    state.origins['file://'].csp = false
  }
  if (typeof state.theme === 'string') {
    state.theme = {
      name: state.theme,
      url: chrome.runtime.getURL(`/themes/${state.theme}.css`)
    }
  }
  if (state.themes === undefined) {
    state.themes = []
  }
  // v3.9 -> v4.0
  if (state.content.mermaid === undefined) {
    state.content.mermaid = false
  }
  if (state.themes === undefined || state.themes instanceof Array) {
    state.themes = {wide: false}
  }
  if (typeof state.theme === 'object') {
    state.theme = state.theme.name
  }
  // v4.0 -> v5.0
  Object.keys(state.origins).forEach((origin) => {
    state.origins[origin].csp = false
    state.origins[origin].encoding = ''
  })
  if (state.content.syntax === undefined) {
    state.content.syntax = true
  }
  if (state.themes.wide !== undefined) {
    if (state.themes.wide) {
      state.themes.width = 'full'
    }
    delete state.themes.wide
  }
  if (state.icon === undefined) {
    state.icon = false
  }
  // v5.0 -> v5.1
  if (state.header !== null) {
    Object.keys(state.origins).forEach((origin) => {
      state.origins[origin].header = true
      state.origins[origin].path = true
      delete state.origins[origin].csp
      delete state.origins[origin].encoding
    })
    state.header = null
  }
  if (state.content.scroll !== undefined) {
    delete state.content.scroll
  }
  if (state.settings === undefined) {
    state.settings = {
      icon: state.icon === true ? 'light' : 'dark',
      theme: 'light'
    }
  }
  // v5.1 -> v5.2
  if (state['markdown-it'].abbr === undefined) {
    Object.assign(state['markdown-it'], {
      abbr: false,
      attrs: false,
      cjk: false,
      deflist: false,
      footnote: false,
      ins: false,
      mark: false,
      sub: false,
      sup: false,
      tasklists: false,
    })

  }
  // v5.2 -> v5.3
  if (state.custom === undefined) {
    state.custom = {
      theme: '',
      color: 'auto'
    }
  }
  // markdown-it is the only compiler, drop the removed ones
  state.compiler = 'markdown-it'
  delete state.marked
  delete state.remark
}
