import Fetcher, { fetchP, parse, StreamType } from ".";

const VM_ADDR = "35.224.149.167";

class StreamsFetcher extends Fetcher<StreamType[]> {
  intervalMs = 10 * 60 * 1000;
  getResponse() {
    return fetchP("https://reddit.nflbite.com/")
      .then((resp) => resp.text())
      .then(parse)
      .then((html) => html.getElementsByClassName("competition"))
      .then((arr) => Array.from(arr))
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
      .then((arr) => Array.from(arr))
      .then((matches) =>
        matches.map((match) => match.getElementsByTagName("a")[0].href)
      )
      .then((hrefs) =>
        hrefs.map((href) =>
          fetchP(href)
            .then((resp) => resp.text())
            .then((text) => {
              const matchId = text.match(/var streamsMatchId = (\d+);/)![1];
              const sport = text.match(/var streamsSport = "(\S+)"/)![1];
              const origin = href.split("//")[1].split("/")[0];
              return `https://sportscentral.io/streams-table/${matchId}/${sport}?new-ui=1&origin=${origin}`;
            })
            .then(fetchCache)
            .then(parse)
            .then((html) => html.getElementsByTagName("tr"))
            .then((arr) => Array.from(arr))
            .then((trs) =>
              trs.find(
                (tr) =>
                  (
                    tr.getElementsByClassName("username")[0] as HTMLElement
                  )?.innerText.trim() === "Weak_Spell"
              )
            )
            .then((tr) => tr?.getAttribute("data-stream-link"))
            .then((url) =>
              !url
                ? undefined
                : fetchP(VM_ADDR, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      url,
                    }),
                  })
                    .then((resp) => resp.text())
                    .then(parseTinyUrl)
                    .then(({ name, href }) =>
                      fetchP(href)
                        .then((resp) => resp.text())
                        .then((message) => ({
                          name,
                          url: message.match(
                            /http:\/\/weakstreams.com\/streams\/\d+/
                          )![0],
                        }))
                    )
            )
        )
      )
      .then((promises) => Promise.all(promises))
      .then((streams) => streams.filter(Boolean))
      .then((streams) =>
        fetchCache("https://www.espn.com/nfl/schedule")
          .then(parse)
          .then((html) => html.getElementsByTagName("tr"))
          .then((arr) => Array.from(arr))
          .then((trs) =>
            trs.map((tr) => ({
              espnId: "",
              awayTeam: (tr.children[0] as HTMLElement).innerText,
            }))
          )
          .then((objs) =>
            streams.map((stream) => ({
              espnId: objs.find((obj) => stream!.name.includes(obj.awayTeam))
                ?.espnId,
              ...stream,
            }))
          )
      )
      .then((streams) => streams as StreamType[]);
  }
}

const allData: { [url: string]: { date: number; text: string } } = {};
const maxAge = 24 * 60 * 60 * 1000;
function fetchCache(url: string): Promise<string> {
  const scData = allData[url] || {};
  if (Date.now() - scData.date < maxAge) return Promise.resolve(scData.text);
  return fetchP(url)
    .then((resp) => resp.text())
    .then((text) => {
      allData[url] = { date: Date.now(), text };
      return text;
    });
}

function parseTinyUrl(message: string) {
  function dF(s: string) {
    var s1 = unescape(s.substr(0, s.length - 1));
    var t = "";
    for (let i = 0; i < s1.length; i++) {
      t += String.fromCharCode(
        s1.charCodeAt(i) - parseInt(s.substr(s.length - 1, 1))
      );
    }
    const rval = unescape(t);
    return rval;
  }
  return Promise.resolve(message)
    .then((message) => message.match(/dF\('(.+?)'\)/)![1])
    .then(dF)
    .then(parse)
    .then((html) => ({
      name: html
        .getElementsByTagName("title")[0]
        .innerText.split(" - WeakStreams.com - ")[0],
      href: html.body.innerHTML.match(/window\.location\.href = "(.*)";/)![1],
    }));
}

export default StreamsFetcher;
