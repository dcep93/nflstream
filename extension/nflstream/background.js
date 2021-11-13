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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  ({
    getVersion,
    getStreams,
    getLogs,
  }
    [message.action](sender.tab.id)
    .then(sendResponse));
  return true;
});

function getVersion(tabId) {
  return Promise.resolve(version);
}

function getStreams(tabId) {
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
    .then((promises) => Promise.all(promises));
}

function getLogs(tabId) {
  return fetch("https://www.espn.com/nfl/schedule")
    .then((resp) => resp.text())
    .then((message) => sendMessage(tabId, { type: "parseSchedule", message }))
    .then((ids) =>
      ids.map((id) =>
        fetch(`https://www.espn.com${id}`)
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
              return { id, name };
            }
            const playByPlay = [obj.drives.current]
              .concat(obj.drives.previous.reverse())
              .map((drive) => ({
                team: drive.team.shortDisplayName,
                result: drive.displayResult,
                plays: drive.plays.reverse().map((p) => ({
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
            return { id, name, playByPlay, boxScore };
          })
      )
    )
    .then((promises) => Promise.all(promises));
}

function log(arg) {
  console.log(arg);
  return arg;
}
