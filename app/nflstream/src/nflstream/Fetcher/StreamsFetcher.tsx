import Fetcher, { cacheF, parse, StreamType } from ".";

export const HOST = "topstreams.info";

class StreamsFetcher extends Fetcher<StreamType[], boolean> {
  intervalMs = 10 * 60 * 1000;

  getResponse() {
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
                  .then(
                    (text) =>
                      text.match(
                        /(?<=window\['__espnfitt__'\]=).*(?=;<\/script>)/
                      )![0]
                  )
                  .then(JSON.parse)
                  .then(
                    (o: {
                      page: {
                        content: {
                          events: {
                            [date: string]: {
                              id: string;
                              teams: { shortName: string }[];
                            }[];
                          };
                        };
                      };
                    }) =>
                      Object.values(o.page.content.events).flatMap((es) =>
                        es.map((e) => ({
                          espnId: parseInt(e.id),
                          teams: e.teams.map((t) => t.shortName.toLowerCase()),
                        }))
                      )
                  )
            ).then((objs) =>
              streams.map((stream) => ({
                espnId:
                  stream.src === HOST
                    ? objs.find((obj) => obj.teams.includes(stream.stream_id))
                        ?.espnId
                    : undefined,
                ...stream,
              }))
            )
      )
      .then((streams) => streams.concat(...getStreamsFromUrlQuery()));
  }
}

function getStream(href: string): Promise<StreamType | undefined> {
  return fetchP(href, 10 * 60 * 1000, (text) =>
    Promise.resolve(text)
      .then((text) => parse(text))
      .then((p) =>
        Array.from(p.getElementsByClassName("streamer-name") || []).find(
          (e) => (e as HTMLElement).innerText.trim() === "topstreamer"
        ) === undefined
          ? undefined
          : p.title.includes("Redzone")
          ? {
              name: "REDZONE",
              stream_id: "redzone",
              raw_url: `https://${HOST}/nfl/redzone`,
              src: HOST,
            }
          : Promise.resolve()
              .then(() => ({
                src: HOST,
                name: p.title
                  .split(" Live Stream")[0]
                  .split(" at ")
                  .join(" @ "),
              }))
              .then((o) => ({
                ...o,
                stream_id: o.name.toLowerCase().split(" @ ").reverse()[0],
              }))
              .then((o) => ({
                ...o,
                raw_url: `https://${HOST}/nfl/${o.stream_id}`,
              }))
              .then((o) => getHostParams(o.raw_url, false, "").then(() => o))
      )
  );
}

export function getHostParams(
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

function getStreamsFromUrlQuery(): StreamType[] {
  return (
    new URLSearchParams(window.location.search).get("extra")?.split(",") || []
  ).map((raw_url, i) => ({
    raw_url,
    name: `extra_${i + 1}`,
    src: "extra",
    stream_id: `extra_${i + 1}`,
  }));
}

function fetchP<T>(
  url: string,
  maxAgeMs: number,
  textToCache: (text: string) => Promise<T>
): Promise<T> {
  return cacheF(url, maxAgeMs, () =>
    fetch("https://proxy420.appspot.com", {
      method: "POST",
      body: JSON.stringify({ maxAgeMs, url }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((resp) => resp.text())
      .then((text) => textToCache(text))
  );
}

export default StreamsFetcher;
