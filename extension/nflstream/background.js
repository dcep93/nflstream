function sendMessage(tabId, payload) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, payload, resolve);
  });
}

const url = "https://nflstream.web.app/";
chrome.action.onClicked.addListener((tab) =>
  tab.url === url
    ? main("click", tab.id).then((message) =>
        sendMessage(tab.id, { type: "main", message })
      )
    : chrome.tabs.create({ url }, function (tab_) {})
);

chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) =>
    main("visit", sender.tab.id).then((message) =>
      sendMessage(sender.tab.id, { type: "main", message })
    ) && true
);

function main(src, tabId) {
  console.log("main", src);
  return fetch("https://reddit.nflbite.com/")
    .then((resp) => resp.text())
    .then((message) => sendMessage(tabId, { type: "parseGames", message }))
    .then(() => [
      "https://reddi.boxingstreams.cc/game/scardina-vs-doberstien-live-stream/",
    ]) // todo
    .then((hrefs) =>
      hrefs.map((href) =>
        fetch(href)
          .then((resp) => resp.text())
          .then((text) => {
            const matchId = text.match(/var streamsMatchId = (\d+);/)[1];
            const sport = text.match(/var streamsSport = "(\S+)"/)[1];
            const origin = href.split("//")[1].split("/")[0];
            return `https://sportscentral.io/streams-table/${matchId}/${sport}?new-ui=1&origin=${origin}`;
          })
          .then(fetch)
          .then((resp) => resp.text())
          .then((message) =>
            sendMessage(tabId, { type: "parseLinks", message })
          )
      )
    )
    .then((tinyUrls) =>
      tinyUrls.map((tinyUrl) =>
        Promise.resolve(tinyUrl)
          .then(fetch)
          .then((resp) => resp.text())
          .then((message) =>
            sendMessage(tabId, { type: "parseTinyUrl", message })
          )
      )
    )
    .then((urls) =>
      urls.map((url) =>
        Promise.resolve(url)
          .then((url) => url.split("/").reverse()[1])
          .then((id) => `http://weakstreams.com/streams/${id}`)
      )
    )
    .then((promises) => Promise.all(promises));
}

function log(arg) {
  console.log(arg);
  return arg;
}
