console.log("background");

chrome.runtime.onMessageExternal.addListener(
  ({ url, options }, _, sendResponse) => {
    if (!url) return sendResponse(true);
    return fetch(url, options)
      .then((resp) => resp.text())
      .then((text) => sendResponse(text));
  }
);
