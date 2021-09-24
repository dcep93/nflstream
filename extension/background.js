console.log("background", new Date());

var count = 0;

function main(sendMessage) {
  console.log("main");

  // export type NFLStreamType = { timestamp: string, streams?: StreamType[] };

  // export type StreamType = { url: string, name: string };

  Promise.resolve()
    .then(() => getRawStreams())
    .then((rawStreams) => rawStreams.map(getStream))
    .then((streamPromises) => Promise.all(streamPromises))
    .then((streams) =>
      sendMessage({
        timestamp: new Date().toLocaleString(),
        streams,
      })
    )
    .then(() => console.log("done", ++count));
}

function getRawStreams() {
  return [{ url: "url", name: "name" }];
}

function getStream(rawStream) {
  return rawStream;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  main(sendResponse);
  return true;
});

chrome.browserAction.onClicked.addListener((tab) =>
  main((message) => chrome.tabs.sendMessage(tab.id, message))
);
