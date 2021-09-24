console.log("background", new Date());

function fileToPromise(fileName) {
  const url = chrome.runtime.getURL(`scripts/${fileName}`);
  return fetch(url)
    .then((response) => response.text())
    .then((code) => window.ts.transpile(code))
    .then(eval);
}

function main() {
  console.log("main");

  Promise.all(["firebase.ts", "fetch_and_save.ts"].map(fileToPromise)).catch(
    alert
  );
}

main();

chrome.runtime.onMessage.addListener(main);

chrome.browserAction.onClicked.addListener(main);
