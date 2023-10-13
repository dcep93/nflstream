import Fetcher, { cacheF, parse, StreamType } from ".";

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
      "https://nflbite.com/",
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
          // .filter((match) => !match.innerHTML.includes("Redzone"))
          .map((match) => match.getElementsByTagName("a")[0].href)
      )
      .then(() => [
        "https://www.nflbite.com/nfl/live/denver-broncos-at-kansas-city-chiefs-3-live-stream",
      ])
      .then((hrefs) => hrefs.map(getStream))
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
                  espnId: parseInt(
                    tds[2]?.getElementsByTagName("a")[0]?.href.split("=")[1]
                  ),
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

function getStream(href: string): Promise<StreamType | undefined> {
  return fetchP(href, 10 * 60 * 1000)
    .then((text) => parse(text))
    .then((p) =>
      Array.from(
        p.getElementById("streams")?.getElementsByClassName("username") || []
      ).find((e) => (e as HTMLElement).innerText.trim() === "topstreamer") ===
      undefined
        ? undefined
        : Promise.resolve({
            name: p.title.includes("Redzone")
              ? "REDZONE"
              : p.title
                  .split(" Live Stream")[0]
                  .split(" Vs ")
                  .reverse()
                  .join(" vs "),
          })
            .then((o) => ({
              ...o,
              stream_id: o.name
                .toLowerCase()
                .split(" vs ")
                .reverse()[0]
                .split(" ")
                .reverse()[0],
            }))
            .then((o) =>
              getTopstreamsUrl(o.stream_id).then((raw_url) => ({
                ...o,
                raw_url,
              }))
            )
            .then((o) =>
              fetchP(
                o.raw_url,
                StreamsFetcher.firstTime ? 0 : 10 * 60 * 1000
              ).then((text) => ({
                ...o,
                url: getStreamUrl(text),
              }))
            )
    );
}

function getTopstreamsUrl(stream_id: string): Promise<string> {
  return Promise.resolve().then(
    () => `https://topstreams.info/nfl/${stream_id}`
  );
}

function getStreamUrl(message: string) {
  return `/topstream_1.2.html?${Object.entries({
    key: /var key= '(.*)';/,
    masterkey: /var masterkey= '(.*)'/,
    masterinf: /window.masterinf = (.*);/,
  })
    .map(([k, re]) => ({ k, matched: (message.match(re) || [])[1] }))
    .map(({ k, matched }) => ({
      k,
      matched: matched?.startsWith("{") ? btoa(matched) : matched,
    }))
    .map(({ k, matched }) => `${k}=${matched}`)
    .join("&")}`;
}

export function parseTinyUrl(message: string) {
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
