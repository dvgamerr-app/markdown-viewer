// conversion counts for the landing page through Traceway. scripts/site.mjs only adds this script, the SDK and the
// traceway-dsn meta when PUBLIC_TRACEWAY_DSN is set, so without it the page loads nothing extra.
// Each event is one Traceway message ("landing: install-hero"), grouped and counted by name. The SDK adds the url
// (with any utm_* tags), referrer, browser and viewport. No session replay, console, network or navigation capture.
(function () {
  var meta = document.querySelector('meta[name="traceway-dsn"]')
  var sdk = window.Traceway
  if (!meta || !meta.content || !sdk) return
  try {
    sdk.init(meta.content, {
      sessionRecording: false,
      captureLogs: false,
      captureNetwork: false,
      captureNavigation: false,
      attributes: {site: 'landing'}
    })
  }
  catch (err) {
    return
  }
  var send = function (name) {
    try { sdk.captureMessage('landing: ' + name) } catch (err) {}
  }
  send('visit')
  // capture phase: the demo tabs and start button replace parts of the page as they are clicked
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-track]')
    el && send(el.getAttribute('data-track'))
  }, true)
  // an install click leaves the page right away, flush what is queued before it goes
  window.addEventListener('pagehide', function () {
    try { sdk.flush(1500) } catch (err) {}
  })
})()
