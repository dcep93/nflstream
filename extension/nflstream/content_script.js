console.log("content_script", "nflstream", location.href);

function init() {
  document.body.innerHTML = `<div class="embed-responsive embed-responsive-16by9"><div id="video-player"></div></div>`;

  [
    "clappr.min.js",
    "hlsjs-p2p-engine.min.js",
    "clappr-plugin.min.js",
    "level-selector.min.js",
    "clappr-chromecast-plugin.min.js",

    "weakstreams.js",
  ].forEach((src) => {
    s = document.createElement("script");
    s.src = chrome.runtime.getURL(`assets/${src}`);
    document.head.appendChild(s);
  });
}

init();
