function main() {
  console.log("main");
  return Promise.resolve();
}

const url = "https://nflstream.web.app";
chrome.browserAction.onClicked.addListener((tab) =>
  main()
    .then(() => tab.getURL())
    .then(
      (tabUrl) =>
        tabUrl.startswith(url) ||
        chrome.tabs.create({ url }, function (tab_) {})
    )
);

chrome.runtime.onMessage.addListener(main);
