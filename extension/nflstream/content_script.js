console.log("content_script", "nflstream", location.href);

function init() {
  document.body.innerHTML = `<div class="embed-responsive embed-responsive-16by9"><div id="video-player"></div></div>`;

  appendScripts([
    "clappr.min.js",
    "hlsjs-p2p-engine.min.js",
    "clappr-plugin.min.js",
    "level-selector.min.js",

    "weakstreams.js",
  ]);
}

function appendScripts(scripts) {
  if (scripts.length === 0) return;

  s = document.createElement("script");
  s.src = chrome.runtime.getURL(`assets/${scripts[0]}`);
  s.addEventListener("load", () => appendScripts(scripts.slice(1)));
  document.head.appendChild(s);
}

init();
