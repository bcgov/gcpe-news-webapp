/* Snowplow starts plowing - Standalone Search vA.2.10.2 */
<<<<<<< HEAD

        ; (function (p, l, o, w, i, n, g) {
        if (!p[i]) {
            p.GlobalSnowplowNamespace = p.GlobalSnowplowNamespace || [];
        p.GlobalSnowplowNamespace.push(i); p[i] = function () {
            (p[i].q = p[i].q || []).push(arguments)
        }; p[i].q = p[i].q || []; n = l.createElement(o); g = l.getElementsByTagName(o)[0]; n.async = 1;
        n.src = w; g.parentNode.insertBefore(n, g)
    }
}(window, document, "script", "https://sp-js.apps.gov.bc.ca/MDWay3UqFnIiGVLIo7aoMi4xMC4y.js", "snowplow"));
var collector = 'spt.apps.gov.bc.ca';
    window.snowplow('newTracker', 'rt', collector, {
            appId: "Snowplow_standalone",
        platform: 'web',
        post: true,
        forceSecureTracker: true,
        contexts: {
            webPage: true,
=======
;(function(p,l,o,w,i,n,g){if(!p[i]){p.GlobalSnowplowNamespace=p.GlobalSnowplowNamespace||[];
    p.GlobalSnowplowNamespace.push(i);p[i]=function(){(p[i].q=p[i].q||[]).push(arguments)
    };p[i].q=p[i].q||[];n=l.createElement(o);g=l.getElementsByTagName(o)[0];n.async=1;
    n.src=w;g.parentNode.insertBefore(n,g)}}(window,document,"script","https://sp-js.apps.gov.bc.ca/MDWay3UqFnIiGVLIo7aoMi4xMC4y.js","snowplow"));
var collector = 'spt.apps.gov.bc.ca';
window.snowplow('newTracker','rt',collector, {
    appId: "Snowplow_standalone",
    platform: 'web',
    post: true,
    forceSecureTracker: true,
    contexts: {
        webPage: true,
>>>>>>> 7e5f455f9c8494aa8eacf7dbdcbc65bdf9f3941e
        performanceTiming: true
    }
});
window.snowplow('enableActivityTracking', 30, 30); // Ping every 30 seconds after 30 seconds
window.snowplow('enableLinkClickTracking');
window.snowplow('trackPageView');
<<<<<<< HEAD
window.snowplow('trackSiteSearch',
    getUrlParamArray('q', '')
);

    function getUrlParamArray(param, defaultValue) {
        var vars = [];
        var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
            if (key === param) {
=======
// Change the 'Search term parameter' to what is being used on the site, generally it is q.
var searchParameter = 'q';
if (window.location.search.indexOf(searchParameter) > -1) {
  window.snowplow('trackSiteSearch',
      getUrlParamArray(searchParameter,'')
  );
}

function getUrlParamArray(param, defaultValue) {
    var vars = [];
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        if ( key === param ) {
>>>>>>> 7e5f455f9c8494aa8eacf7dbdcbc65bdf9f3941e
            vars.push(value);
        }
    });
    return vars;
}
/* Snowplow stop plowing */
