import Fetcher, { fetchP, parse, StreamType } from ".";

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
            .then(fetchSC)
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
            .then((tr) => tr?.getAttribute("data-stream-link") || undefined)
            .then((link) =>
              !link
                ? undefined
                : fetchP(link)
                    .then((resp) => resp.text())
                    .then(parseTinyUrl)
                    .then(({ name, href }) =>
                      fetch(href)
                        .then((resp) => resp.text())
                        .then((message) => ({
                          name,
                          url: message.match(
                            /http:\/\/weakstreams.com\/streams\/\d+/
                          )![0],
                        }))
                    )
                    .then(({ name, ...s }) => ({ name, espnId: "", ...s }))
            )
            .catch((e) => {
              console.log("failed promise");
              console.log(e);
              return null;
            })
        )
      )
      .then((promises) => Promise.all(promises))
      .then((links) => links.filter(Boolean) as StreamType[]);
  }
}

const allScData: { [url: string]: { date: number; text: string } } = {};
const maxAge = 24 * 60 * 60 * 1000;
function fetchSC(url: string): Promise<string> {
  const scData = allScData[url] || {};
  if (Date.now() - scData.date < maxAge) return Promise.resolve(scData.text);
  return fetchP(url)
    .then((resp) => resp.text())
    .then(
      (text) =>
        Object.assign(allScData, { url: { date: Date.now(), text } })[url].text
    );
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
