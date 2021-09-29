function main(src) {
  console.log("main", src);
  return Promise.resolve();
}

const url = "https://nflstream.web.app/";
chrome.action.onClicked.addListener((tab) =>
  tab.url === url
    ? main("click")
    : chrome.tabs.create({ url }, function (tab_) {})
);

chrome.runtime.onMessage.addListener(() => main("visit"));
