function main() {
  console.log("main");
  return Promise.resolve();
}

const url = "https://nflstream.web.app/";
chrome.browserAction.onClicked.addListener((tab) =>
  tab.url === url ? main() : chrome.tabs.create({ url }, function (tab_) {})
);

chrome.runtime.onMessage.addListener(main);
