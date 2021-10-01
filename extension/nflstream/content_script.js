console.log("content_script");

function receive(payload, sender, sendResponse) {
  console.log("receive", payload);
  Promise.resolve(payload.message)
    .then({ main, parseGames, parseLinks }[payload.type])
    .then(sendResponse);
}

function main(message) {
  const div = document.getElementById("message_extension");
  div.value = JSON.stringify(message);
  div.click();
}

function parse(text) {
  return Promise.resolve(text).then((text) => {
    const html = document.createElement("html");
    html.innerHTML = text;
    return html;
  });
}

function parseGames(message) {
  return parse(message)
    .then((html) =>
      Array.from(html.getElementsByClassName("competition")).find(
        (competition) =>
          Array.from(competition.getElementsByClassName("name")).find(
            (name) => name.innerHTML === "NFL, Regular Season"
          )
      )
    )
    .then((competition) =>
      Array.from(competition.getElementsByClassName("col-md-6"))
        .filter(
          (match) =>
            match.getElementsByClassName("status")[0].innerHTML === "finished"
        )
        .map((match) => match.getElementsByTagName("a")[0].href)
    );
}

function parseLinks(message) {
  return Promise.resolve(message)
    .then(parse)
    .then((html) => html.innerHTML);
}

chrome.runtime.onMessage.addListener(receive);

chrome.runtime.sendMessage(null, receive);

function log(arg) {
  console.log(arg);
  return arg;
}
