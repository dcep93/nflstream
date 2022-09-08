// INLINE_RUNTIME_CHUNK=false PUBLIC_URL=/html/ yarn build

chrome.action.onClicked.addListener(function (tab) {
  chrome.tabs.create({ url: "html/index.html" });
});
