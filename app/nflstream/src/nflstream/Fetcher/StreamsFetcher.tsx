import Fetcher, { cacheF, parse, StreamType } from ".";

const username: string = "topstreamer"; // "Weak_Spell"

class StreamsFetcher extends Fetcher<StreamType[], boolean> {
  intervalMs = 10 * 60 * 1000;
  static firstTime = true;
  getResponse() {
    //   return Promise.resolve([
    //     { url: "http://weakstreams.com/streams/10309005", name: "test2" },
    //     { url: "http://example.org", name: "example", espnId: "401437761" },
    //     { url: "http://localhost:3000/topstream.html", name: "test1" },
    //   ]);
    // }

    // real() {
    const hasExtension = this.props.payload;
    return fetchP(
      "https://reddit.nflbite.com/",
      StreamsFetcher.firstTime ? 0 : 10 * 60 * 1000
    )
      .then(parse)
      .then((html) => html.getElementsByClassName("competition"))
      .then((arr) => Array.from(arr))
      .then((competitions) =>
        competitions.filter((competition) =>
          Array.from(competition.getElementsByClassName("name")).find((name) =>
            name.innerHTML.startsWith("NFL")
          )
        )
      )
      .then((competitions) =>
        competitions.flatMap((competition) =>
          Array.from(competition.getElementsByClassName("matches")[0].children)
        )
      )
      .then((matches) =>
        matches
          .filter((match) => !match.innerHTML.includes("Redzone"))
          .map((match) => match.getElementsByTagName("a")[0].href)
      )
      .then((hrefs) =>
        hrefs.map((href) =>
          fetchP(href, 10 * 60 * 1000)
            .then((text) => ({
              text,
              name: parse(text)
                .title.split(" Live Stream")[0]
                .split(" Vs ")
                .join(" vs "),
            }))
            .then(({ text, name }) =>
              Promise.resolve()
                .then(() => {
                  const matchId = text.match(/var streamsMatchId = (\d+);/)![1];
                  const sport = text.match(/var streamsSport = "(\S+)"/)![1];
                  const origin = href.split("//")[1].split("/")[0];
                  return `https://sportscentral.io/streams-table/${matchId}/${sport}?new-ui=1&origin=${origin}`;
                })
                .then((url) => fetchP(url, 10 * 60 * 1000))
                .then(parse)
                .then((html) => html.getElementsByTagName("tr"))
                .then((arr) => Array.from(arr))
                .then((trs) =>
                  trs.find(
                    (tr) =>
                      (
                        tr.getElementsByClassName("username")[0] as HTMLElement
                      )?.innerText.trim() === username
                  )
                )
                .then((tr) => tr?.getAttribute("data-stream-link"))
                .then((url) =>
                  !url
                    ? undefined
                    : !url.startsWith("https://tinyurl")
                    ? url
                    : cacheF(url, 10 * 60 * 1000, () =>
                        fetch("https://proxy420.appspot.com/proxy", {
                          method: "POST",
                          body: JSON.stringify({
                            url,
                            maxAgeMs: 10 * 60 * 1000,
                          }),
                          headers: {
                            "Content-Type": "application/json",
                          },
                        }).then((resp) => resp.text())
                      ).then((text) => parseTinyUrl(text))
                )
                .then((raw_url) =>
                  !raw_url
                    ? undefined
                    : fetchP(raw_url!, 24 * 60 * 60 * 1000).then((message) => ({
                        name,
                        raw_url,
                        stream_id: raw_url
                          .split("?")[0]
                          .split("/")
                          .reverse()[0],
                        url: getStreamUrl(message),
                      }))
                )
            )
        )
      )
      .then((promises) => Promise.all(promises))
      .then(
        (streams) =>
          streams.filter((stream) => stream !== undefined) as StreamType[]
      )
      .then((streams) =>
        !hasExtension
          ? streams
          : fetchP("https://www.espn.com/nfl/schedule", 60 * 60 * 1000)
              .then(parse)
              .then((html) => html.getElementsByTagName("tr"))
              .then((arr) => Array.from(arr))
              .then((trs) =>
                trs.map((tr) => tr.children as unknown as HTMLElement[])
              )
              .then((trs) =>
                trs.map((tds) => ({
                  espnId: tds[2]
                    ?.getElementsByTagName("a")[0]
                    ?.href.split("=")[1],
                  awayTeam: (
                    tds[0]?.getElementsByClassName(
                      "Table__Team"
                    )[0] as HTMLElement
                  )?.innerText,
                  homeTeam: (
                    tds[1]?.getElementsByClassName(
                      "Table__Team"
                    )[0] as HTMLElement
                  )?.innerText,
                }))
              )
              .then((objs) =>
                streams.map((stream) => ({
                  espnId: objs.find(
                    (obj) =>
                      stream!.name.includes(obj.awayTeam) &&
                      stream!.name.includes(obj.homeTeam)
                  )?.espnId,
                  ...stream,
                }))
              )
      )
      .finally(() => {
        StreamsFetcher.firstTime = false;
      });
  }
}

function parseTinyUrl(message: string) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  return (
    Promise.resolve(message)
      // .then((message) => message.match(/dF\('(.+?)'\)/)![1])
      // .then(dF)
      .then(parse)
      .then(
        (html) =>
          // html.body.innerHTML.match(/href="(.*?)".*Click Here to Watch/)![1]
          html.head.innerHTML.match(/window.location.href = "(.*?)";/)![1]
      )
      .catch((err) => {
        console.error(err);
        return null;
      })
  );
}

function getStreamUrl(message: string) {
  return username === "Weak_Spell"
    ? message.match(/http:\/\/weakstreams.com\/streams\/\d+/)![0]
    : `/topstream_1.1.html?${Object.entries({
        key: /var key= '(.*)';/,
        masterkey: /var masterkey= '(.*)'/,
        masterinf: /window.masterinf = (.*);/,
      })
        .map(([k, re]) => ({ k, matched: message.match(re)![1] }))
        .map(({ k, matched }) => ({
          k,
          matched: matched.startsWith("{") ? btoa(matched) : matched,
        }))
        .map(({ k, matched }) => `${k}=${matched}`)
        .join("&")}`;
}

export function fetchP(
  url: string,
  maxAgeMs: number,
  options: any = undefined
): Promise<string> {
  return cacheF(url, maxAgeMs, () =>
    fetch("https://proxy420.appspot.com", {
      method: "POST",
      body: JSON.stringify({ maxAgeMs, url, options }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((resp) => resp.text())
  );
}

export default StreamsFetcher;
