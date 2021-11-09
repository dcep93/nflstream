console.log("content_script", location.href);
const start = new Date().getTime();

function init() {
  if (location.href.startsWith("http://weakstreams.com/streams/")) {
    window.addEventListener("message", muteUnmute);
  } else {
    chrome.runtime.onMessage.addListener(receive);
    sendMain();
  }
}

function muteUnmute(event) {
  const video = document.getElementsByTagName("video")[0];
  console.log(event.data, "muteUnmute", video);
  video.muted = event.data.mute;
}

function sendMain() {
  chrome.runtime.sendMessage({ action: "main" });
  setTimeout(sendMain, 5 * 60 * 1000);
}

function receive(payload, sender, sendResponse) {
  console.log("receive", new Date().getTime() - start, payload.type, payload);
  Promise.resolve(payload.message)
    .then(
      { main, parseGames, parseLinks, parseTinyUrl, parseSchedule }[
        payload.type
      ]
    )
    .then(sendResponse);
}

function main(message) {
  const div = document.getElementById("message_extension");
  div.value = JSON.stringify(message);
  div.click();
}

function parse(text) {
  return Promise.resolve(text).then((text) => {
    const html = document.createElement("html");
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
          Array.from(competition.getElementsByClassName("name")).find(
            (name) => name.innerHTML === "NFL, Regular Season"
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
  var _0xc49e = [
    "",
    "split",
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/",
    "slice",
    "indexOf",
    "",
    "",
    ".",
    "pow",
    "reduce",
    "reverse",
    "0",
  ];
  function _0xe81c(d, e, f) {
    var g = _0xc49e[2][_0xc49e[1]](_0xc49e[0]);
    var h = g[_0xc49e[3]](0, e);
    var i = g[_0xc49e[3]](0, f);
    var j = d[_0xc49e[1]](_0xc49e[0])
      [_0xc49e[10]]()
      [_0xc49e[9]](function (a, b, c) {
        if (h[_0xc49e[4]](b) !== -1)
          return (a += h[_0xc49e[4]](b) * Math[_0xc49e[8]](e, c));
      }, 0);
    var k = _0xc49e[0];
    while (j > 0) {
      k = i[j % f] + k;
      j = (j - (j % f)) / f;
    }
    return k || _0xc49e[11];
  }
  function asdf(h, u, n, t, e, r) {
    r = "";
    for (var i = 0, len = h.length; i < len; i++) {
      var s = "";
      while (h[i] !== n[e]) {
        s += h[i];
        i++;
      }
      for (var j = 0; j < n.length; j++)
        s = s.replace(new RegExp(n[j], "g"), j);
      r += String.fromCharCode(_0xe81c(s, e, 10) - t);
    }
    return decodeURIComponent(escape(r));
  }
  function qwer(x) {
    return x.match(/\.attr\("href","http.*?"\)/)[0].split('"')[3];
  }
  function getUrl(rawHtml) {
    var args = rawHtml
      .match(/decodeURIComponent\(escape\(r\)\)\}\(.*?\)\)/)[0]
      .split("(")[3]
      .split(")")[0]
      .split(",");
    var h = args[0].split('"')[1];
    var u = parseInt(args[1]);
    var n = args[2].split('"')[1];
    var t = parseInt(args[3]);
    var e = parseInt(args[4]);
    var r = parseInt(args[5]);

    var x = asdf(h, u, n, t, e, r);
    var y = qwer(x);
    return y;
  }
  return Promise.resolve(message)
    .then(parse)
    .then((html) => ({
      title: html
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
    .then((as) => as.filter((a) => a.innerHTML === "LIVE"))
    .then((as) => as.map((a) => a.getAttribute("href")));
}

init();

function log(arg) {
  console.log(arg);
  return arg;
}
