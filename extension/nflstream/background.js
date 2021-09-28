chrome.browserAction.onClicked.addListener((tab) =>
  chrome.tabs.create(
    { url: chrome.runtime.getURL("nflstream.html") },
    function (tab_) {}
  )
);
