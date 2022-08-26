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
    .then(log)
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
          .then(fetchSC)
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
          .catch((e) => {
            console.log("failed promise");
            console.log(e);
            return null;
          })
      )
    )
    .then((promises) => Promise.all(promises))
    .then((logs) => logs.filter(Boolean));
}

const allScData = {};
const maxAge = 24 * 60 * 60 * 1000;
function fetchSC(url) {
  const scData = allScData[url] || {};
  if (Date.now() - allScData.date < maxAge) return Promise.resolve(scData.text);
  return fetch(url)
    .then((resp) => resp.text())
    .then((text) => {
      scData[url] = { date: Date.now(), text };
      return text;
    });
}

function getLogs(tabId) {
  return fetch("https://www.espn.com/nfl/schedule")
    .then((resp) => resp.text())
    .then((message) => sendMessage(tabId, { type: "parseSchedule", message }))
    .then((ids) =>
      ids.map((id) =>
        fetch(`https://www.espn.com${id}`)
          .then((resp) => resp.text())
          .then((message) => {
            const match = message.match(/espn\.gamepackage\.data =(.*?)\n/);
            if (!match) return null;
            const json = match[1].slice(0, -1);
            const obj = JSON.parse(json);
            const name = obj.boxscore.teams
              .map((team) => team.team.displayName)
              .reverse()
              .join(" vs ");
            if (obj.drives === undefined) {
              return { id, name };
            }
            const playByPlay = [obj.drives.current]
              .concat(obj.drives.previous.reverse())
              .filter((drive) => drive.team)
              .map((drive) => ({
                team: drive.team.shortDisplayName,
                result: drive.displayResult,
                plays: drive.plays.reverse().map((p) => ({
                  down: p.start.downDistanceText,
                  text: p.text,
                  clock: `Q${p.period.number} ${p.clock.displayValue}`,
                })),
                description: drive.description,
                score: `${drive.plays[0].awayScore} - ${drive.plays[0].homeScore}`,
              }));
            const timestamp = obj.drives.current.plays[0].modified;
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
            return { id, name, timestamp, playByPlay, boxScore };
          })
          .catch((e) => log(e) && false)
      )
    )
    .then((promises) => Promise.all(promises))
    .then((logs) => logs.filter(Boolean));
}

function log(arg) {
  console.log(arg);
  return arg;
}
