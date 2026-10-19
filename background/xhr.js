
md.xhr = () => {

  var normalize = (url) => {
    if (/^file:/i.test(url)) {
      // drop query/hash and decode the drive colon (file:///e%3A/x -> file:///e:/x), otherwise
      // the worker is refused with "Not allowed to load local resource"
      return url.replace(/[?#].*$/, '').replace(/^(file:\/\/\/[a-zA-Z])%3A/i, '$1:')
    }
    return url + '?preventCache=' + Date.now()
  }

  var get = (url, done) => {
    ;(async () => {
      try {
        var res = await fetch(normalize(url), {cache: 'no-store'})
        done(null, await res.text())
      }
      catch (err) {
        done(err)
      }
    })()
  }

  return {get}
}
