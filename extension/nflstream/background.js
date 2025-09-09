console.log("background");

var version = null;

fetch(chrome.runtime.getURL("manifest.json"))
  .then((resp) => resp.json())
  .then((j) => j.version)
  .then((_version) => (version = _version));

chrome.runtime.onMessageExternal.addListener(
  ({ url, options }, _, sendResponse) => {
    console.log({ url });
    if (!url) return sendResponse(version);
    return fetch(url, options)
      .then((resp) => {
        if (resp.status >= 400)
          return resp.text().then((text) => {
            throw new Error(text);
          });
        return resp.text();
      })
      .then((text) => sendResponse(text))
      .catch((err) => console.trace(err));
  }
);
