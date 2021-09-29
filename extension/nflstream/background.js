function main(src) {
  console.log("main", src);
  return Promise.resolve({});
}

const url = "https://nflstream.web.app/";
chrome.action.onClicked.addListener((tab) =>
  tab.url === url
    ? main("click").then((msg) => chrome.tabs.sendMessage(tab.id, msg))
    : chrome.tabs.create({ url }, function (tab_) {})
);

chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) =>
    main("visit").then((msg) => sendResponse(msg)) && true
);
