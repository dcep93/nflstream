console.log("background", new Date());

function main(sendResponse) {
  console.log("main");

  // export type NFLStreamType = { timestamp: string, streams?: StreamType[] };

  // export type StreamType = { url: string, name: string };

  sendResponse({ timestamp: new Date().toLocaleString() });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) =>
  main(sendResponse)
);

chrome.browserAction.onClicked.addListener((message, sender, sendResponse) =>
  main(sendResponse)
);
