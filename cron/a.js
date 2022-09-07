// export type NFLStreamType = {
//   other?: StreamType[];
//   streams?: StreamType[];
//   version: string;
// };

// export type StreamType = {
//   url: string;
//   name: string;
// };

// export type LogType = {
//   id: string;
//   name: string;
//   timestamp: string;
//   playByPlay?: DriveType[];
//   boxScore?: BoxScoreType[];
// };

// export type DriveType = {
//   team: string;
//   description: string;
//   score: string;
//   result?: string;
//   plays?: { down: string; text: string; clock: string }[];
// };

// export type BoxScoreType = {
//   key: string;
//   labels: string[];
//   players?: { name: string; stats: string[] }[];
// };

function parseGames(message) {
  return parse(message)
    .then((html) => html.getElementsByClassName("competition"))
    .then(Array.from)
    .then((competitions) =>
      competitions.find((competition) =>
        Array.from(competition.getElementsByClassName("name")).find((name) =>
          name.innerHTML.startsWith("NFL")
        )
      )
    )
    .then(
      (competition) => competition?.getElementsByClassName("col-md-6") || []
    )
    .then(Array.from)
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
  function dF(s) {
    var s1 = unescape(s.substr(0, s.length - 1));
    var t = "";
    for (i = 0; i < s1.length; i++) {
      t += String.fromCharCode(s1.charCodeAt(i) - s.substr(s.length - 1, 1));
    }
    const rval = unescape(t);
    return rval;
  }
  return Promise.resolve(message)
    .then((message) => message.match(/dF\('(.+?)'\)/)[1])
    .then(dF)
    .then(parse)
    .then((html) => ({
      name: html
        .getElementsByTagName("title")[0]
        .innerText.split(" - WeakStreams.com - ")[0],
      href: html.innerHTML.match(/window\.location\.href = "(.*)";/)[1],
    }));
}

function parseSchedule(message) {
  return Promise.resolve(message)
    .then(parse)
    .then((html) => html.getElementsByTagName("a"))
    .then(Array.from)
    .then((as) =>
      as.filter((a) => {
        if (a.innerText === "LIVE") return true;
        const dataDate = a.getAttribute("data-date");
        if (dataDate) {
          const d = Date.parse(dataDate);
          if (Date.now() > d) return true;
        }
        return false;
      })
    )
    .then((as) => as.map((a) => a.getAttribute("href")));
}
