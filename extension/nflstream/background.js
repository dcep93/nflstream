var version;
fetch(chrome.runtime.getURL("manifest.json"))
  .then((response) => response.json())
  .then((json) => json.version)
  .then((_version) => (version = _version))
  .then(() => console.log("version", version));

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "version":
      sendResponse(version);
      break;
    default:
      main("visit", sender.tab.id).then((message) =>
        sendMessage(sender.tab.id, { type: "main", message })
      );
  }
  return true;
});

function main(src, tabId) {
  console.log("main", src);
  return fetch("https://reddit.nflbite.com/")
    .then((resp) => resp.text())
    .then((message) => sendMessage(tabId, { type: "parseGames", message }))
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
          .then(
            (link) =>
              link &&
              Promise.resolve(link)
                .then(fetch)
                .then((resp) => resp.text())
                .then((message) =>
                  sendMessage(tabId, { type: "parseTinyUrl", message })
                )
                .then(({ title, href }) =>
                  fetch(href)
                    .then((resp) => resp.text())
                    .then((message) => ({
                      title,
                      href: message.match(
                        /http:\/\/weakstreams.com\/streams\/\d+/
                      )[0],
                      chat: message.match(
                        /https:\/\/www.youtube.com\/live_chat\?v=.*?&/
                      )[0],
                    }))
                )
          )
      )
    )
    .then((promises) => Promise.all(promises))
    .then((messages) => messages.filter(Boolean))
    .then((streams) => ({ version, streams }))
    .then(log);
}

function log(arg) {
  console.log(arg);
  return arg;
}
