console.log("background");

var version = null;
var contentScriptTabId = null;

fetch(chrome.runtime.getURL("manifest.json"))
  .then((resp) => resp.json())
  .then((j) => j.version)
  .then((_version) => (version = _version));

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "content_script_init" && sender.tab?.id) {
    contentScriptTabId = sender.tab.id;
  }
});

chrome.runtime.onMessageExternal.addListener(
  ({ url, options }, _, sendResponse) => {
    console.log({ url });
    if (!url) return sendResponse(version);
    if (url === "/content_script")
      return (
        contentScriptTabId &&
        new Promise((resolve) =>
          chrome.tabs.sendMessage(contentScriptTabId, options, (res) => {
            console.log({ res, options, e: chrome.runtime.lastError });
            if (chrome.runtime.lastError) {
              resolve(null);
            } else {
              resolve(res);
            }
          })
        )
          .then(JSON.stringify)
          .then((resp) => sendResponse(resp))
      );
    return fetch(url, options)
      .then((resp) => {
        if (resp.status >= 400)
          return resp.text().then((text) => {
            throw new Error(text);
          });
        const encoding = resp.headers.get("content-encoding");
        if (
          encoding &&
          encoding.toLowerCase() === "zstd" &&
          url.endsWith(".txt")
        ) {
          return resp
            .arrayBuffer()
            .then((buf) => new Uint8Array(buf))
            .then((bytes) => {
              let bin = "";
              const chunk = 0x8000; // avoid call stack blowups
              for (let i = 0; i < bytes.length; i += chunk) {
                bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
              }
              return btoa(bin);
            });
        }
        return resp.text();
      })
      .then((text) => sendResponse(text))
      .catch((err) => console.trace(err));
  }
);

// background.js (MV3 service worker)
chrome.runtime.onInstalled.addListener(async () => {
  const rules = [
    {
      id: 1001,
      priority: 2,
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          {
            header: "Referer",
            operation: "set",
            value: "https://icrackstreams.app/",
          },
        ],
      },
      condition: {
        // Initiator is the extension itself:
        domains: [chrome.runtime.id],
        requestDomains: ["gooz.aapmains.net"],
        resourceTypes: ["xmlhttprequest"],
      },
    },
    {
      id: 1002,
      priority: 1,
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          {
            header: "Referer",
            operation: "set",
            value: "https://gooz.aapmains.net/",
          },
        ],
      },
      condition: {
        domains: [chrome.runtime.id],
        excludedRequestDomains: ["gooz.aapmains.net"],
        urlFilter: "|http*://*",
        resourceTypes: ["xmlhttprequest"],
      },
    },
  ];

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: rules.map((r) => r.id),
    addRules: rules,
  });
});
