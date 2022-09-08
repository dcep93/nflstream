// yarn buildext

chrome.action.onClicked.addListener(function (tab) {
  chrome.tabs.create({ url: "html/index.html" });
});
