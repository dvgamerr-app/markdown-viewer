
;(() => {
  var current = ''

  var response = (md) => {
    if (!current) {
      current = md
    }
    else if (current !== md) {
      state.reload.md = true
      current = md
      render(md)
    }
  }

  var xhr = new XMLHttpRequest()
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      response(xhr.responseText)
    }
  }

  var stop = () => clearInterval(state.reload.interval)

  var callback = (res) => {
    if (chrome.runtime.lastError || !res) {
      stop()
    }
    else if (res.err) {
      console.error(res.err)
      stop()
    }
    else {
      response(res.body)
    }
  }

  var get = () => {
    if (location.protocol === 'file:') {
      // the extension was reloaded or updated: this orphaned content script can't reach it anymore
      if (!chrome.runtime?.id) {
        stop()
        return
      }
      try {
        chrome.runtime.sendMessage({
          message: 'autoreload',
          location: location.href
        }, callback)
      }
      catch (err) {
        stop()
      }
    }
    else {
      xhr.open('GET', location.href + '?preventCache=' + Date.now(), true)
      try {
        xhr.send()
      }
      catch (err) {
        console.error(err)
        stop()
      }
    }
  }

  get()
  state.reload.interval = setInterval(get, state.reload.ms)
})()
