// Traceway for the landing page: every visit is a session, and each tagged click is an action on its timeline.
// scripts/site.mjs only adds this script, the SDK and the traceway-dsn meta when PUBLIC_TRACEWAY_DSN is set,
// so without it the page loads nothing extra. Clicks are recorded as actions, not exceptions: nothing lands in Issues.
(function () {
  var meta = document.querySelector('meta[name="traceway-dsn"]')
  var sdk = window.Traceway
  if (!meta || !meta.content || !sdk) return
  try {
    sdk.init(meta.content, {recordAllSessions: true, attributes: {site: 'landing'}})
  }
  catch (err) {
    return
  }
  // capture phase: the demo tabs and start button replace parts of the page as they are clicked
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-track]')
    if (!el) return
    try { sdk.recordAction('click', el.getAttribute('data-track')) } catch (err) {}
  }, true)
  // an install click leaves the page right away, flush what is queued before it goes
  window.addEventListener('pagehide', function () {
    try { sdk.flush(1500) } catch (err) {}
  })
})()
