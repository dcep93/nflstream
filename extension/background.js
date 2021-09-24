console.log("background", new Date());

function main() {
  console.log("main");

  // export type NFLStreamType = { updated: string, streams?: StreamType[] };

  // export type StreamType = { url: string, name: string };
}

main();

chrome.runtime.onMessage.addListener(main);

chrome.browserAction.onClicked.addListener(main);
