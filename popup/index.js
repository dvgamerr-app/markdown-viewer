
var Popup = () => {

  var state = {
    compiler: '',
    options: {},
    content: {},
    theme: '',
    themes: {},
    _themes: [
      'github',
      'github-dark',
      'nimbus',
      'nimbus-dark',
      // 'air',
      'almond',
      'awsm',
      'axist',
      'bamboo',
      'bullframe',
      'holiday',
      'kacit',
      'latex',
      'marx',
      'mini',
      'modest',
      'new',
      'no-class',
      'pico',
      'retro',
      'sakura',
      'sakura-vader',
      'semantic',
      'simple',
      // 'splendor',
      'style-sans',
      'style-serif',
      'stylize',
      'superstylin',
      'tacit',
      'vanilla',
      'water',
      'water-dark',
      'writ',
      'custom',
    ],
    _width: [
      'auto',
      'full',
      'wide',
      'large',
      'medium',
      'small',
      'tiny',
    ],
    raw: false,
    tab: '',
    tabs: ['theme', 'compiler', 'content'],
    compilers: [],
    description: {
      themes: {},
      compiler: {},
      content: {
        autoreload: 'Auto reload on file change',
        emoji: 'Convert emoji :shortnames: into EmojiOne images',
        toc: 'Generate Table of Contents',
        mathjax: 'Render MathJax formulas',
        mermaid: 'Mermaid diagrams',
        syntax: 'Syntax highlighting for fenced code blocks',
      }
    },
    settings: {}
  }

  var events = {
    tab: (e) => {
      // the handler sits on the nav, so ignore clicks on the indicator or empty space
      var link = e.target.closest && e.target.closest('a[href^="#tab-"]')
      if (!link) {
        return false
      }
      state.tab = link.hash.replace('#tab-', '')
      localStorage.setItem('tab', state.tab)
      return false
    },

    compiler: {
      name: (e) => {
        state.compiler = state.compilers[e.target.selectedIndex]
        chrome.runtime.sendMessage({
          message: 'popup.compiler.name',
          compiler: state.compiler,
        }, () => {
          chrome.runtime.sendMessage({message: 'popup'}, init)
        })
      },
      options: (e) => {
        state.options[e.target.name] = !state.options[e.target.name]
        chrome.runtime.sendMessage({
          message: 'popup.compiler.options',
          compiler: state.compiler,
          options: state.options,
        })
      }
    },

    content: (e) => {
      state.content[e.target.name] = !state.content[e.target.name]
      chrome.runtime.sendMessage({
        message: 'popup.content',
        content: state.content,
      })
    },

    themes: (e) => {
      state.themes.width = state._width[e.target.selectedIndex]
      chrome.runtime.sendMessage({
        message: 'popup.themes',
        themes: state.themes,
      })
    },

    theme: (e) => {
      state.theme = state._themes[e.target.selectedIndex]
      chrome.runtime.sendMessage({
        message: 'popup.theme',
        theme: state.theme
      })
    },

    raw: () => {
      state.raw = !state.raw
      chrome.runtime.sendMessage({
        message: 'popup.raw',
        raw: state.raw
      })
    },

    defaults: () => {
      chrome.runtime.sendMessage({
        message: 'popup.defaults'
      }, () => {
        chrome.runtime.sendMessage({message: 'popup'}, init)
        localStorage.removeItem('tab')
        state._tabs.activeTabIndex = 0
      })
    },

    advanced: () => {
      chrome.runtime.sendMessage({message: 'popup.advanced'})
    }
  }

  var init = (res) => {
    state.compiler = res.compiler
    state.options = res.options
    state.content = res.content
    state.theme = res.theme
    state.themes = res.themes

    state.raw = res.raw
    state.tab = localStorage.getItem('tab') || 'theme'
    state.compilers = res.compilers
    state.description.compiler = res.description

    state.settings = res.settings
    document.querySelector('body').classList.add(state.settings.theme)

    m.redraw()
  }

  chrome.runtime.sendMessage({message: 'popup'}, init)

  var oncreate = {
    ripple: (vnode) => {
      mdc.ripple.MDCRipple.attachTo(vnode.dom)
    },
    tabs: (vnode) => {
      state._tabs = mdc.tabs.MDCTabBar.attachTo(vnode.dom)
      setTimeout(() => {
        state._tabs.activeTabIndex = state.tabs.indexOf(state.tab)
      }, 250)
    }
  }

  var onupdate = (tab, key) => (vnode) => {
    var value = tab === 'compiler' ? state.options[key]
      : tab === 'content' ? state.content[key]
      : null

    if (vnode.dom.classList.contains('is-checked') !== value) {
      vnode.dom.classList.toggle('is-checked')
    }
  }

  var toggle = (tab, key, checked, onchange) =>
    m('label.mdc-switch m-switch', {
      onupdate: onupdate(tab, key),
      title: state.description[tab][key]
      },
      m('input.mdc-switch__native-control', {type: 'checkbox', name: key, checked, onchange}),
      m('.mdc-switch__background', m('.mdc-switch__knob')),
      m('span.mdc-switch-label', key)
    )

  var flags = () => Object.keys(state.options)
    .filter((key) => typeof state.options[key] === 'boolean')

  var compilerSwitches = () =>
    m('.scroll', {class: flags().length > 8 ? 'max' : ''},
      flags().map((key) => toggle('compiler', key, state.options[key], events.compiler.options))
    )

  var contentSwitches = () =>
    m('.scroll', Object.keys(state.content).map((key) =>
      toggle('content', key, state.content[key], events.content)
    ))

  var render = () =>
    m('#popup',
      m('header.popup-brand', m('img', {src: '/icons/nimbus.svg', width: 38, height: 38, alt: ''}), m('div', m('strong', 'Nimbus Markdown'), m('span', 'A calmer way to read.'))),
      // raw
      m('button.mdc-button mdc-button--raised m-button', {
        oncreate: oncreate.ripple,
        onclick: events.raw
        },
        (state.raw ? 'Html' : 'Markdown')
      ),
      // defaults
      m('button.mdc-button mdc-button--raised m-button', {
        oncreate: oncreate.ripple,
        onclick: events.defaults
        },
        'Defaults'
      ),

      // tabs
      m('nav.mdc-tab-bar m-tabs', {
        oncreate: oncreate.tabs,
        onclick: events.tab
        },
        state.tabs.map((tab) =>
        m('a.mdc-tab', {
          href: '#tab-' + tab,
          class: state.tab === tab ? 'mdc-tab--active' : '',
          'aria-current': state.tab === tab ? 'page' : undefined,
          },
          tab
        )),
        m('span.mdc-tab-bar__indicator')
      ),
      m('.m-panels',
        // theme
        m('.m-panel', {
          class: state.tab === 'theme' ? 'is-active' : ''
          },
          m('select.mdc-elevation--z2 m-select', {
            onchange: events.theme
            },
            state._themes.map((theme) =>
              m('option', {selected: state.theme === theme}, theme)
            )
          ),
          m('select.mdc-elevation--z2 m-select', {
            onchange: events.themes
            },
            state._width.map((width) =>
              m('option', {
                selected: state.themes.width === width,
              }, width)
            )
          ),
        ),
        // compiler
        m('.m-panel', {
          class: state.tab === 'compiler' ? 'is-active' : ''
          },
          m('select.mdc-elevation--z2 m-select', {
            onchange: events.compiler.name,
            style: state.compilers.length > 1 ? '' : 'display: none',
            },
            state.compilers.map((name) =>
              m('option', {selected: state.compiler === name}, name)
            )
          ),
          compilerSwitches()
        ),
        // content
        m('.m-panel', {
          class: state.tab === 'content' ? 'is-active' : ''
          },
          contentSwitches()
        )
      ),

      // advanced options
      m('button.mdc-button mdc-button--raised m-button', {
        oncreate: oncreate.ripple,
        onclick: events.advanced
        },
        'All settings →'
      )
    )

  var options = () =>
    m('.row m-settings',
      m('.col-xxl-4.col-xl-4.col-lg-6.col-md-6.col-sm-12',
        m('h3', 'Theme'),
        m('.bs-callout m-theme',
          m('.row',
            m('.col-xxl-6.col-xl-6.col-lg-6.col-md-6.col-sm-12',
              m('span.m-label',
                'Content Theme'
              )
            ),
            m('.col-xxl-6.col-xl-6.col-lg-6.col-md-6.col-sm-12',
              m('select.mdc-elevation--z2 m-select', {
                onchange: events.theme
                },
                state._themes.map((theme) =>
                  m('option', {selected: state.theme === theme}, theme)
                )
              )
            ),
          ),
          m('.row',
            m('.col-xxl-6.col-xl-6.col-lg-6.col-md-6.col-sm-12',
              m('span.m-label',
                'Content Width'
              )
            ),
            m('.col-xxl-6.col-xl-6.col-lg-6.col-md-6.col-sm-12',
              m('select.mdc-elevation--z2 m-select', {
                onchange: events.themes
                },
                state._width.map((width) =>
                  m('option', {
                    selected: state.themes.width === width,
                  }, width)
                )
              )
            ),
          ),
          settings.render()
        ),
        state.theme === 'custom' &&
        custom.render()
      ),

      m('.col-xxl-4.col-xl-4.col-lg-6.col-md-6.col-sm-12',
        m('h3', 'Compiler'),
        m('.bs-callout m-compiler',
          m('select.mdc-elevation--z2 m-select', {
            onchange: events.compiler.name,
            style: state.compilers.length > 1 ? '' : 'display: none',
            },
            state.compilers.map((name) =>
              m('option', {selected: state.compiler === name}, name)
            )
          ),
          compilerSwitches()
        ),
      ),

      m('.col-xxl-4.col-xl-4.col-lg-6.col-md-6.col-sm-12',
        m('h3', 'Content'),
        m('.bs-callout m-content',
          contentSwitches()
        ),
      ),
    )

  return {state, render, options}
}

if (document.querySelector('.is-popup')) {
  var popup = Popup()
  m.mount(document.querySelector('body'), {
    view: (vnode) => popup.render()
  })
}
else {
  var settings = Settings()
  var custom = Custom()
}
