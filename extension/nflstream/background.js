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
      sendResponse({ type: "main", message })
    ) && true
);

function main(src, tabId) {
  console.log("main", src);
  return fetch("https://reddit.nflbite.com/")
    .then((resp) => resp.text())
    .then((message) => sendMessage(tabId, { type: "parseGames", message }))
    .then((hrefs) =>
      hrefs.map((href) =>
        fetch(href)
          .then((resp) => resp.text())
          .then((message) =>
            sendMessage(tabId, { type: "parseLinks", message })
          )
      )
    )
    .then((promises) => Promise.all(promises));
}

function log(arg) {
  console.log(arg);
  return arg;
}
