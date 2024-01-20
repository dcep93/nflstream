import Fetcher, { cacheF, parse, StreamType } from ".";

class StreamsFetcher extends Fetcher<StreamType[], boolean> {
  intervalMs = 10 * 60 * 1000;
  getResponse() {
    //   return Promise.resolve([
    //     { url: "http://weakstreams.com/streams/10309005", name: "test2" },
    //     { url: "http://example.org", name: "example", espnId: "401437761" },
    //     { url: "http://localhost:3000/topstream.html", name: "test1" },
    //   ]);
    // }

    // real() {
    const hasExtension = this.props.payload;
    return fetchP("https://nflbite.com/", 10 * 60 * 1000, (text) =>
      Promise.resolve(text)
        .then(parse)
        .then((html) => html.getElementsByClassName("page-content"))
        .then((elements) => Array.from(elements))
        .then((elements) =>
          elements.flatMap((e) => Array.from(e.getElementsByTagName("a")))
        )
        .then((elements) => elements.map((e) => e.getAttribute("href")!))
        .then((hrefs) => hrefs.filter((href) => href.startsWith("/nfl")))
        .then((hrefs) => hrefs.map((href) => `https://nflbite.com/${href}`))
    )
      .then((hrefs) => hrefs.map(getStream))
      .then((promises) => Promise.all(promises))
      .then(
        (streams) =>
          streams.filter((stream) => stream !== undefined) as StreamType[]
      )
      .then((streams) =>
        !hasExtension
          ? streams
          : fetchP(
              "https://www.espn.com/nfl/schedule",
              60 * 60 * 1000,
              (text) =>
                Promise.resolve(text)
                  .then(parse)
                  .then((html) => html.getElementsByTagName("tr"))
                  .then((arr) => Array.from(arr))
                  .then((trs) =>
                    trs.map((tr) => tr.children as unknown as HTMLElement[])
                  )
                  .then((trs) =>
                    trs.map((tds) => ({
                      espnId: parseInt(
                        tds[2]
                          ?.getElementsByTagName("a")[0]
                          ?.href.split("gameId/")[1]
                          ?.split("/")[0]
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
            ).then((objs) =>
              streams.map((stream) => ({
                espnId: objs.find(
                  (obj) =>
                    stream!.name.includes(obj.awayTeam) &&
                    stream!.name.includes(obj.homeTeam)
                )?.espnId,
                ...stream,
              }))
            )
      );
  }
}

function getStream(href: string): Promise<StreamType | undefined> {
  return fetchP(href, 10 * 60 * 1000, (text) =>
    Promise.resolve(text)
      .then((text) => parse(text))
      .then((p) =>
        Array.from(p.getElementsByClassName("username") || []).find(
          (e) => (e as HTMLElement).innerText.trim() === "topstreamer"
        ) === undefined
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
              .then((o) => ({
                ...o,
                raw_url: `https://topstreams.info/nfl/${o.stream_id}`,
              }))
              .then((o) =>
                getTopstreamsParams(o.raw_url, false, "").then(() => o)
              )
      )
  );
}

export function getTopstreamsParams(
  url: string,
  hardRefresh: boolean,
  iFrameTitle: string
): Promise<{ [key: string]: string }> {
  return fetchP(url, hardRefresh ? 0 : 10 * 60 * 1000, (text) =>
    Promise.resolve().then(() =>
      Object.fromEntries(
        Object.entries({
          key: /var key= '(.*)';/,
          masterkey: /var masterkey= '(.*)'/,
          masterinf: /window.masterinf = (.*);/,
        })
          .map(([k, re]) => ({ k, matched: (text.match(re) || [])[1] }))
          .map(({ k, matched }) => [
            k,
            matched?.startsWith("{") ? btoa(matched) : matched,
          ])
      )
    )
  ).then((params) => ({ ...params, iFrameTitle }));
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

function fetchP<T>(
  url: string,
  maxAgeMs: number,
  textToCache: (text: string) => Promise<T>,
  options: any = undefined
): Promise<T> {
  return cacheF(url, maxAgeMs, () =>
    fetch("https://proxy420.appspot.com", {
      method: "POST",
      body: JSON.stringify({ maxAgeMs, url, options }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((resp) => resp.text())
      .then((text) => textToCache(text))
  );
}

export default StreamsFetcher;
