console.log("background", new Date());

var count = 0;

function main(sendMessage) {
  console.log("main");

  // export type NFLStreamType = { timestamp: number; streams?: StreamType[] };

  // export type StreamType = { url: string; name: string };

  Promise.resolve()
    .then(() => getRawStreams())
    .then((rawStreams) => rawStreams.map(getStream))
    .then((streamPromises) => Promise.all(streamPromises))
    .then((streams) =>
      sendMessage({
        timestamp: new Date().getTime(),
        streams,
      })
    )
    .then(() => console.log("done", ++count));
}

function getRawStreams() {
  return [];
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
