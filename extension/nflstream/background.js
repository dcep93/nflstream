console.log("background");

var version = null;

fetch(chrome.runtime.getURL("manifest.json"))
  .then((resp) => resp.json())
  .then((j) => j.version)
  .then((_version) => (version = _version));

chrome.runtime.onMessageExternal.addListener(
  ({ url, options }, _, sendResponse) => {
    if (!url) return sendResponse(version);
    return fetch(url, options)
      .then((resp) => resp.text())
      .then((text) => sendResponse(text))
      .catch((err) => err);
  }
);
