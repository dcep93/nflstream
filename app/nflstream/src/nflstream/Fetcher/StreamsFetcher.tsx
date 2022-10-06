import Fetcher, { cacheF, parse, StreamType } from ".";

class StreamsFetcher extends Fetcher<StreamType[], boolean> {
  intervalMs = 10 * 60 * 1000;
  getResponse() {
    //   return Promise.resolve([
    //     { url: "http://weakstreams.com/streams/10309005", name: "test2" },
    //     { url: "http://example.org", name: "example", espnId: "401437761" },
    //   ]);
    // }

    // real() {
    const hasExtension = this.props.payload;
    return fetchP("https://reddit.nflbite.com/", 10 * 60 * 1000)
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
          fetchP(href, 10 * 60 * 1000)
            .then((text) => {
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
                  )?.innerText.trim() === "Weak_Spell"
              )
            )
            .then((tr) => tr?.getAttribute("data-stream-link"))
            .then((url) =>
              !url
                ? undefined
                : cacheF(url, 10 * 60 * 1000, () =>
                    fetch("https://proxy420.appspot.com/proxy", {
                      method: "POST",
                      body: JSON.stringify({ url, maxAgeMs: 10 * 60 * 1000 }),
                      headers: {
                        "Content-Type": "application/json",
                      },
                    })
                  )
                    .then((resp) => resp.text())
                    .then(parseTinyUrl)
                    .then((href) =>
                      !href
                        ? undefined
                        : fetchP(href!, 24 * 60 * 60 * 1000).then(
                            (message) => ({
                              name: parse(message).title.split(
                                " - WeakStreams.com - "
                              )[0],
                              url: getStreamUrlFromWeakStreamsHTML(
                                message,
                                hasExtension
                              ),
                            })
                          )
                    )
            )
        )
      )
      .then((promises) => Promise.all(promises))
      .then((streams) => streams.filter(Boolean) as StreamType[])
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
                    .getElementsByTagName("a")[0]
                    ?.href.split("=")[1],
                  awayTeam: (
                    tds[0].getElementsByClassName(
                      "Table__Team"
                    )[0] as HTMLElement
                  )?.innerText,
                  homeTeam: (
                    tds[1].getElementsByClassName(
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
      .then((streams) => streams as StreamType[]);
  }
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
    .then(
      (html) =>
        html.body.innerHTML.match(/href="(.*?)".*Click Here to Watch/)![1]
    )
    .catch((err) => {
      console.error(err);
      return null;
    });
}

function getStreamUrlFromWeakStreamsHTML(
  message: string,
  hasExtension: boolean
) {
  if (hasExtension) {
    const vidgstream = encodeURIComponent(
      message.match(/var vidgstream = "(.+?)";/)![1]
    );
    const token = message.match(/token: '(.+?)',/)![1];
    return `http://weakstreams.com/favicon.ico?token=${token}&vidgstream=${vidgstream}`;
  } else {
    return message.match(/http:\/\/weakstreams.com\/streams\/\d+/)![0];
  }
}

function fetchP(
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
