var version;
fetch(chrome.runtime.getURL("manifest.json"))
  .then((response) => response.json())
  .then((json) => json.version)
  .then((_version) => (version = _version))
  .then(() => console.log("version", version));

function sendMessage(tabId, payload) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, payload, resolve);
  });
}

const url = "https://nflstream.web.app/";
chrome.action.onClicked.addListener((tab) =>
  tab.url === url
    ? main("click", tab.id).then((message) =>
        sendMessage(tab.id, { type: "main", message })
      )
    : chrome.tabs.create({ url }, function (tab_) {})
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "version":
      sendResponse(version);
      break;
    default:
      main("visit", sender.tab.id).then((message) =>
        sendMessage(sender.tab.id, { type: "main", message })
      );
  }
  return true;
});

function main(src, tabId) {
  console.log("main", src);
  const nameToLog = {};
  return fetch("https://reddit.nflbite.com/")
    .then((resp) => resp.text())
    .then((message) => sendMessage(tabId, { type: "parseGames", message }))
    .then((hrefs) =>
      hrefs.map((href) =>
        fetch(href)
          .then((resp) => resp.text())
          .then((text) => {
            const matchId = text.match(/var streamsMatchId = (\d+);/)[1];
            const sport = text.match(/var streamsSport = "(\S+)"/)[1];
            const origin = href.split("//")[1].split("/")[0];
            return `https://sportscentral.io/streams-table/${matchId}/${sport}?new-ui=1&origin=${origin}`;
          })
          .then((url) =>
            fetch("https://api.aworldofstruggle.com/proxy", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url,
                params: {
                  headers: { Referer: "https://reddit.nflbite.com/" },
                },
              }),
            })
          )
          .then((resp) => resp.text())
          .then((message) =>
            sendMessage(tabId, { type: "parseLinks", message })
          )
          .then(
            (link) =>
              link &&
              Promise.resolve(link)
                .then(fetch)
                .then((resp) => resp.text())
                .then((message) =>
                  sendMessage(tabId, { type: "parseTinyUrl", message })
                )
                .then(({ name, href }) =>
                  fetch(href)
                    .then((resp) => resp.text())
                    .then((message) => ({
                      name,
                      url: message.match(
                        /http:\/\/weakstreams.com\/streams\/\d+/
                      )[0],
                    }))
                )
          )
      )
    )
    .then((promises) => promises.concat(getLogsPromise(nameToLog, tabId)))
    .then((promises) => Promise.all(promises))
    .then((messages) => messages.filter(Boolean))
    .then((streams) =>
      streams.map((stream) =>
        Object.assign(stream, { log: nameToLog[stream.name] || null })
      )
    )
    .then((streams) => ({ version, streams }))
    .then(log);
}

function getLogsPromise(nameToLog, tabId) {
  return fetch("https://www.espn.com/nfl/schedule")
    .then((resp) => resp.text())
    .then((message) => sendMessage(tabId, { type: "parseSchedule", message }))
    .then((hrefs) =>
      hrefs.map((href) =>
        fetch(`https://www.espn.com${href}`)
          .then((resp) => resp.text())
          .then((message) =>
            message.match(/espn\.gamepackage\.data =(.*?)\n/)[1].slice(0, -1)
          )
          .then((json) => JSON.parse(json))
          .then((obj) => {
            const name = obj.boxscore.teams
              .map((team) => team.team.displayName)
              .reverse()
              .join(" vs ");
            if (obj.drives === undefined) {
              nameToLog[name] = { id: href };
              return;
            }
            const playByPlay = [obj.drives.current]
              .concat(obj.drives.previous)
              .map((drive) => ({
                team: drive.team.shortDisplayName,
                result: drive.displayResult,
                plays: drive.plays.map((p) => ({
                  down: p.start.downDistanceText,
                  text: p.text,
                  clock: `Q${p.period.number} ${p.clock.displayValue}`,
                })),
                description: drive.description,
              }));
            const boxScore = ["passing", "rushing", "receiving"].map((key) => ({
              key,
              labels: obj.boxscore.players[0].statistics.find(
                (s) => s.name === key
              ).labels,
              players: []
                .concat(
                  ...obj.boxscore.players
                    .map((team) => team.statistics.find((s) => s.name === key))

                    .map((t) => t.athletes)
                )
                .map((a) => ({
                  name: a.athlete.displayName,
                  stats: a.stats,
                })),
            }));
            nameToLog[name] = { id: href, playByPlay, boxScore };
          })
      )
    )
    .then((promises) => Promise.all(promises))
    .catch((e) => console.log(e))
    .then(() => false);
}

function log(arg) {
  console.log(arg);
  return arg;
}
