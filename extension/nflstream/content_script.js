console.log("content_script", "nflstream", location.href);

function init() {
  fetchFromHTTP();
  window.addEventListener("message", muteUnmute);
}

function muteUnmute(event) {
  if (event.data.source !== "nflstream") return;
  const video = document.getElementsByTagName("video")[0];
  console.log(event.data, "muteUnmute", video);
  video.muted = event.data.mute;
}

function fetchFromHTTP() {
  // document.body.style.backgroundColor = "black";
  const maxAgeMs = 60 * 1000;
  const url = location.href;
  fetch("https://proxy420.appspot.com", {
    method: "POST",
    body: JSON.stringify({ maxAgeMs, url }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((resp) => resp.text())
    .then((text) => {
      const match = text.match(/([^]*)var vidgstream = "([^]*?)";([^]*)/);
      const meta = document.createElement("meta");
      meta.id = "meta-vidgstream";
      meta.setAttribute("data-vidgstream", match[2]);
      document.head.appendChild(meta);
      return match[1] + match[3];
    })
    .then((text) => new DOMParser().parseFromString(text, "text/html"))
    .then((d) => {
      document.body.appendChild(
        d.getElementsByClassName("embed-responsive")[0]
      );
      Array.from(d.getElementsByTagName("style")).map((s) =>
        document.head.appendChild(s)
      );
      const objs = Array.from(d.getElementsByTagName("script"))
        .map((s) => ({
          src: s.src,
          innerHTML: s.innerHTML,
          path:
            s.src?.replace("://", "-//").replaceAll("/", ":") ||
            `${hash(s.innerHTML)}.js`,
        }))
        .filter(
          ({ innerHTML }) =>
            !innerHTML.includes('document.body.addEventListener("click"')
        )
        .filter(
          ({ innerHTML }) => !innerHTML.includes('$(document).on("contextmenu"')
        )
        .filter(({ path }) => !path.includes("velocitycdn.com"))
        .filter(({ path }) => !path.includes("googletagmanager.com"));
      function loadPaths() {
        const obj = objs.shift();
        if (!obj) {
          return;
        }
        new Promise((resolve) => {
          const script = document.createElement("script");
          script.onload = resolve;
          script.src = chrome.runtime.getURL(`weakstreams_scripts/${obj.path}`);
          document.head.appendChild(script);
        }).then(loadPaths);
      }
      loadPaths();
    });
}

function hash(str) {
  var h = 0,
    i,
    chr;
  if (str.length === 0) return h;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    h = (h << 5) - h + chr;
    h |= 0; // Convert to 32bit integer
  }
  return h;
}

init();
