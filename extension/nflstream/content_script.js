console.log("content_script");

function receive(payload, sender, sendResponse) {
  console.log("receive", payload);
  Promise.resolve(payload.message)
    .then({ main, parseGames, parseLinks, parseTinyUrl }[payload.type])
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
    .then((html) => html.getElementsByClassName("competition"))
    .then(Array.from)
    .then((competitions) =>
      competitions.find((competition) =>
        Array.from(competition.getElementsByClassName("name")).find(
          (name) => name.innerHTML === "NFL, Regular Season"
        )
      )
    )
    .then((competition) => competition.getElementsByClassName("col-md-6"))
    .then(Array.from)
    .then((matches) =>
      matches.filter((match) =>
        match
          .getElementsByClassName("status")[0]
          .classList.contains("live-indicator")
      )
    )
    .then((matches) =>
      matches.map((match) => match.getElementsByTagName("a")[0].href)
    );
}

function parseLinks(message) {
  return Promise.resolve(message)
    .then(parse)
    .then((html) => html.getElementsByTagName("tr"))
    .then(Array.from)
    .then((trs) =>
      trs.find(
        (tr) =>
          tr.getElementsByClassName("username")[0]?.innerText.trim() ===
          "Weak_Spell"
      )
    )
    .then((tr) => tr?.getAttribute("data-stream-link"));
}

function parseTinyUrl(message) {
  return Promise.resolve(message)
    .then(parse)
    .then((html) => ({
      title: html
        .getElementsByTagName("title")[0]
        .innerText.split(" - WeakStreams.com - ")[0],
      href: Promise.resolve(html.getElementsByTagName("a"))
        .then(Array.from)
        .then((links) => links.find((l) => l.id === "skip-btn"))
        .then((link) => link.href),
    }))
    .then(({ title, href }) => Promise.all([title, href]))
    .then(([title, href]) => ({ title, href }));
}

chrome.runtime.onMessage.addListener(receive);

chrome.runtime.sendMessage(null);

function log(arg) {
  console.log(arg);
  return arg;
}
