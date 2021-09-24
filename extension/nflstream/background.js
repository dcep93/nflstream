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
        timestamp: new Date().getTime(),
        streams,
      })
    )
    .then(() => console.log("done", ++count));
}

function getRawStreams() {
  return [
    { url: "https://www.youtube.com/embed/f_GghfbcHx0", name: "yt" },
    { url: "http://weakstreams.com/streams/9520445", name: "ws" },
  ];
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
