console.log("content_script", location.href);

function init() {
  if (location.href.startsWith("http://weakstreams.com/streams/")) {
    window.addEventListener("message", muteUnmute);
  } else {
    chrome.runtime.onMessage.addListener(receive);
    main();
  }
}

function muteUnmute(event) {
  const video = document.getElementsByTagName("video")[0];
  console.log(event.data, "muteUnmute", video);
  video.muted = event.data.mute;
}

function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, resolve);
  });
}

var version;
function main() {
  sendMessage({ action: "getVersion" })
    .then((_version) => {
      version = _version;
    })
    .then(updateStreams)
    .then(updateLogs);
}

function updateStreams() {
  console.log("updateStreams");
  return sendMessage({ action: "getStreams" })
    .then((streams) => update("extension_streams", { streams, version }))
    .then(() => setTimeout(updateStreams, 10 * 60 * 1000));
}

function updateLogs() {
  console.log("updateLogs");
  return sendMessage({ action: "getLogs" })
    .then((logs) => update("extension_logs", { logs, version }))
    .then(() => setTimeout(updateLogs, 10 * 1000));
}

function update(id, payload) {
  const div = document.getElementById(id);
  div.value = JSON.stringify(payload);
  div.click();
}

function receive(payload, sender, sendResponse) {
  console.log("receive", payload.type, payload);
  Promise.resolve(payload.message)
    .then({ parseGames, parseLinks, parseTinyUrl, parseSchedule }[payload.type])
    .then((response) => {
      console.log("respond", payload.type, response);
      sendResponse(response);
    });
}

function parse(text) {
  return Promise.resolve(text).then((text) => {
    const newHTMLDocument =
      document.implementation.createHTMLDocument("preview");
    const html = newHTMLDocument.createElement("html");
    html.innerHTML = text;
    return html;
  });
}

function parseGames(message) {
  return (
    parse(message)
      .then((html) => html.getElementsByClassName("competition"))
      .then(Array.from)
      .then((competitions) =>
        competitions.find((competition) =>
          Array.from(competition.getElementsByClassName("name")).find((name) =>
            name.innerHTML.startsWith("NFL")
          )
        )
      )
      .then(
        (competition) => competition?.getElementsByClassName("col-md-6") || []
      )
      .then(Array.from)
      // .then((matches) =>
      //   matches.filter((match) =>
      //     match
      //       .getElementsByClassName("status")[0]
      //       .classList.contains("live-indicator")
      //   )
      // )
      .then((matches) =>
        matches.map((match) => match.getElementsByTagName("a")[0].href)
      )
  );
}

function parseLinks(message) {
  return Promise.resolve(message)
    .then(parse)
    .then((html) => html.getElementsByTagName("tr"))
    .then(Array.from)
    .then((trs) =>
      trs.find(
        (tr) =>
          tr.getElementsByClassName("username")[0]?.innerText.trim() ===
          "Weak_Spell"
      )
    )
    .then((tr) => tr?.getAttribute("data-stream-link"));
}

function parseTinyUrl(message) {
  function dF(s) {
    var s1 = unescape(s.substr(0, s.length - 1));
    var t = "";
    for (i = 0; i < s1.length; i++) {
      t += String.fromCharCode(s1.charCodeAt(i) - s.substr(s.length - 1, 1));
    }
    console.log(
      "debug TODO dcep93",
      s1.charCodeAt(0) - s.substr(s.length - 1, 1)
    );
    return unescape(t);
  }
  return Promise.resolve(message)
    .then((message) => message.match(/dF\('(.+)'\)/)[1])
    .then(dF)
    .then(parse)
    .then((html) => ({
      name: html
        .getElementsByTagName("title")[0]
        .innerText.split(" - WeakStreams.com - ")[0],
      href: getUrl(message),
    }));
}

function parseSchedule(message) {
  return Promise.resolve(message)
    .then(parse)
    .then((html) => html.getElementsByTagName("a"))
    .then(Array.from)
    .then((as) =>
      as.filter((a) => {
        if (a.innerText === "LIVE") return true;
        const dataDate = a.getAttribute("data-date");
        if (dataDate) {
          const d = Date.parse(dataDate);
          if (Date.now() > d) return true;
        }
        return false;
      })
    )
    .then((as) => as.map((a) => a.getAttribute("href")));
}

init();

function log(arg) {
  console.log(arg);
  return arg;
}
