import ReactDomServer from "react-dom/server";
import { muteCommercialRef } from "../etc/Options";
import { StreamType } from "../Fetcher";
import { fetchES } from "../Fetcher/LogFetcher";
import { HOST } from "../Fetcher/StreamsFetcher";
import FunctionToScript from "./FunctionToScript";

const maxAgeMs = 10 * 60 * 1000;
const matchRegex =
  /href="(https:\/\/icrackstreams\.app\/live.*?stream.*?)" class/g;
const getRawUrl = (stream: StreamType) =>
  fetchES(`https://${HOST}/nflstreams/live`, maxAgeMs).then(
    (text) =>
      Array.from(text.matchAll(matchRegex))
        .map((m) => m[1])
        .find((m) => m.includes(stream.stream_id))!
  );
const ClapprDriver = {
  includeSpecialStreams: (
    games: {
      startTime: number;
      state: "in" | "pre" | "post";
      espnId?: number;
      teams: string[];
    }[]
  ) =>
    fetchES(`https://${HOST}/nflstreams/live`, maxAgeMs)
      .then((text) =>
        Array.from(text.matchAll(matchRegex))
          .map((m) => m[1])
          .filter(
            (matched) =>
              games.findIndex((g) =>
                g.teams
                  .map((t) => t.toLowerCase())
                  .includes(matched.split("/").reverse()[0].split("-")[0])
              ) === -1
          )
          .map((matched) => ({
            startTime: 0,
            state: "in" as "in",
            teams: ["", matched.split("/").reverse()[0]],
          }))
      )
      .then((extra) => games.concat(extra)),
  getRawUrl,
  getHostParams: (stream: StreamType, hardRefresh: boolean) =>
    getRawUrl(stream)
      .then((raw_url) => fetchES(raw_url, hardRefresh ? 0 : maxAgeMs))
      .then((text) => text.match(/<iframe.*?src="(.*?)"/)![1])
      .then((gooz_src) => fetchES(gooz_src, 0))
      .then((text) => text.match(/window\.atob\('(.*?)'\)/)![1])
      .then((encoded) => atob(encoded))
      .then(
        (gntleocen_src) =>
          ({
            source: `${gntleocen_src}////.m3u8`,
          } as Record<string, string>)
      ),
  getSrcDoc,
};
export default ClapprDriver;

function getSrcDoc(params: { [key: string]: string }) {
  return ReactDomServer.renderToStaticMarkup(
    <html lang="en" className="hl-en not-logged-in no-touch">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="referrer" content="no-referrer" />
        <meta charSet="utf-8" />
        <style>
          {`
        * {
          overflow: hidden;
        }
        `}
        </style>
        <FunctionToScript
          t={params}
          f={(params) => {
            const promises: { [key: string]: (response: string) => void } = {};
            window.addEventListener("message", (event) => {
              if (event.data.source !== "nflstream") return;
              if (event.data.response === undefined) return;
              const p = promises[event.data.key];
              delete promises[event.data.key];
              p(event.data.response);
            });
            function getPayload(
              __meta: Record<string, string>
            ): Promise<string | undefined> {
              if (!__meta.url.includes("////"))
                return Promise.resolve(undefined);
              const key = crypto.randomUUID();
              return new Promise<string>((resolve) => {
                promises[key] = resolve;
                window.parent.postMessage(
                  {
                    source: "nflstream.html",
                    action: "proxy",
                    key,
                    url: __meta.url.split("////")[0],
                    iFrameTitle: params.iFrameTitle,
                  },
                  "*"
                );
              });
            }

            const OrigXHR = window.XMLHttpRequest;

            function InterceptedXHR(this: XMLHttpRequest) {
              const xhr = new OrigXHR() as XMLHttpRequest & { __meta?: any };
              xhr.__meta = {};

              const origOpen = xhr.open;
              xhr.open = function (
                ...args: [
                  method: string,
                  url: string,
                  async?: boolean,
                  user?: string,
                  password?: string
                ]
              ) {
                const [method, url] = args;
                xhr.__meta.method = method?.toUpperCase?.() || "GET";
                xhr.__meta.url = url;
                return origOpen.apply(xhr, args as any);
              };

              const origSend = xhr.send;
              xhr.send = function (body?: Document | BodyInit | null) {
                const __meta = xhr.__meta;
                getPayload(__meta).then((payload) => {
                  if (!payload) {
                    return origSend.call(xhr, body as any);
                  }

                  if (__meta.url.endsWith(".txt")) {
                    const bin = atob(payload.replace(/\s+/g, ""));
                    const out = new Uint8Array(bin.length);
                    for (let i = 0; i < bin.length; i++)
                      out[i] = bin.charCodeAt(i);
                    payload = out as any;
                  }

                  Object.defineProperty(xhr, "readyState", { value: 4 });
                  Object.defineProperty(xhr, "status", { value: 200 });
                  Object.defineProperty(xhr, "statusText", { value: "OK" });
                  Object.defineProperty(xhr, "responseText", {
                    value: payload,
                  });
                  Object.defineProperty(xhr, "response", { value: payload });

                  xhr.dispatchEvent(new Event("readystatechange"));
                  xhr.dispatchEvent(new Event("load"));
                  xhr.dispatchEvent(new Event("loadend"));
                });
              };

              return xhr;
            }
            (InterceptedXHR as any).prototype = OrigXHR.prototype;
            Object.getOwnPropertyNames(OrigXHR).forEach((k) => {
              try {
                (InterceptedXHR as any)[k] = (OrigXHR as any)[k];
              } catch {}
            });
            window.XMLHttpRequest = InterceptedXHR as any;
          }}
        />
        <script src="https://cdn.jsdelivr.net/npm/clappr@latest/dist/clappr.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/@clappr/hlsjs-playback@1.8.3/dist/hlsjs-playback.min.js"></script>
      </head>

      <body>
        <div id="wrap">
          <div id="player" style={{ height: "100vH", width: "100vW" }}></div>
        </div>
        <canvas id="canvas" hidden />

        <FunctionToScript
          t={{
            params,
            muteCommercial: muteCommercialRef.current?.checked,
          }}
          f={({ params, muteCommercial }) => {
            const source = params.source;
            if (!source) {
              alert("invalid params");
              return;
            }

            const player = new (window as any).Clappr.Player({
              parentId: "#player",
              source,
              autoPlay: true,
              mute: true,
              height: "100%",
              width: "100%",
              playback: {
                crossOrigin: "anonymous",
                hlsjsConfig: {
                  enableWorker: true,
                  lowLatencyMode: true,
                  backBufferLength: 90,
                },
              },
              plugins: [(window as any).HlsjsPlayback],
            });

            var initialized = false;
            function customInit() {
              if (initialized) return;
              initialized = true;
              const video = document.getElementsByTagName("video")[0];
              video.play();
              var subscreen_muted = true;
              function update_muted() {
                video.muted = subscreen_muted;
              }
              update_muted();

              window.addEventListener("message", (event) => {
                if (event.data.source !== "nflstream") return;
                if (event.data.mute === undefined) return;
                subscreen_muted =
                  event.data.mute !== null ? event.data.mute : !subscreen_muted;
                update_muted();
              });

              function muteCommercialLoop() {
                if (!muteCommercial) return;
                const muteCommercialLoopPeriodMs = 1000;
                type ImageDataArray = Uint8ClampedArray;
                function get_data(): ImageDataArray | null {
                  if (subscreen_muted) return null;
                  if (video.videoWidth === 0) {
                    return null;
                  }
                  const canvas = document.getElementById(
                    "canvas"
                  ) as HTMLCanvasElement;
                  if (!canvas) {
                    return null;
                  }

                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  const ctx = canvas.getContext("2d", {
                    willReadFrequently: true,
                  })!;
                  ctx.clearRect(0, 0, video.videoWidth, video.videoHeight);
                  ctx.drawImage(
                    video,
                    0,
                    0,
                    video.videoWidth,
                    video.videoHeight
                  );

                  const raw_data = ctx.getImageData(
                    0,
                    0,
                    video.videoWidth,
                    video.videoHeight
                  ).data;
                  return raw_data;
                }
                const all_kernels = [
                  {
                    name: "blue",
                    scale: 4,
                    baseDiffAllowed: 2,
                    totalDiffAllowed: 500,
                    widthStart: Math.floor(video.videoWidth * (229 / 2135)),
                    widthSize: Math.floor(video.videoWidth * (1582 / 2135)),
                    heightStart: Math.floor(video.videoHeight * (472 / 1211)),
                    heightSize: Math.floor(video.videoHeight * (279 / 1211)),
                    kernels: Object.entries({
                      darkblue: {
                        needed: 16000 / 156420,
                        kernels: [
                          [13, 38, 114, 255],
                          [15, 42, 120, 255],
                          [22, 59, 158, 255],
                          [30, 76, 189, 255],
                          [33, 81, 197, 255],
                        ],
                      },
                      blue: {
                        needed: 30000 / 156420,
                        kernels: [
                          [50, 116, 221, 255],
                          [54, 126, 255, 255],
                          [57, 125, 255, 255],
                          [61, 132, 255, 255],
                        ],
                      },
                      white: {
                        needed: 20000 / 156420,
                        kernels: [
                          [190, 186, 206, 255],
                          [206, 200, 222, 255],
                          [212, 205, 227, 255],
                          [229, 223, 247, 255],
                          [255, 255, 255, 255],
                        ],
                      },
                    }).map((o) => ({ k: o[0], v: o[1] })),
                  },
                  {
                    name: "white",
                    scale: 4,
                    baseDiffAllowed: 0,
                    totalDiffAllowed: 27,
                    widthStart: Math.floor(video.videoWidth * (435 / 1120)),
                    widthSize: Math.floor(video.videoWidth * (250 / 1120)),
                    heightStart: Math.floor(video.videoHeight * (270 / 634)),
                    heightSize: Math.floor(video.videoHeight * (75 / 634)),
                    kernels: Object.entries({
                      white: {
                        needed: 350 / 1491,
                        kernels: [
                          [234, 235, 235, 255],
                          [246, 235, 235, 255],
                        ],
                      },
                    }).map((o) => ({ k: o[0], v: o[1] })),
                  },
                ];
                function get_is_commercial(raw_data: ImageDataArray) {
                  return (
                    all_kernels.find((kernels) => {
                      const data = Array.from(
                        new Array(
                          Math.floor(kernels.heightSize / kernels.scale)
                        )
                      )
                        .map((_, y) => Math.floor(y * kernels.scale))
                        .flatMap((y) =>
                          Array.from(
                            new Array(
                              Math.floor(kernels.widthSize / kernels.scale)
                            )
                          )
                            .map((_, x) => Math.floor(x * kernels.scale))
                            .map(
                              (x) =>
                                video.videoWidth * (kernels.heightStart + y) +
                                kernels.widthStart +
                                x
                            )
                        )
                        .map((i) =>
                          Array.from(raw_data.slice(i * 4, i * 4 + 4))
                        );
                      const counts = Object.fromEntries(
                        kernels.kernels.map(({ k }) => [k, 0])
                      );
                      const other: Record<string, number> = {};
                      data.forEach((d) => {
                        const found = kernels.kernels.find((o) => {
                          const v = o.v.kernels;
                          if (v[0][0] - d[0] > kernels.baseDiffAllowed)
                            return false;
                          if (
                            d[0] - v[v.length - 1][0] >
                            kernels.baseDiffAllowed
                          )
                            return false;
                          const distance = d
                            .slice(1)
                            .map((_, i) => ({
                              x: d[0] - v[0][0],
                              X: v[v.length - 1][0] - v[0][0],
                              y: d[i + 1] - v[0][i + 1],
                              Y: v[v.length - 1][i + 1] - v[0][i + 1],
                            }))
                            .map((o) => (o.x / o.X) * o.Y - o.y)
                            .map((distance) => Math.pow(distance, 2))
                            .reduce((a, b) => a + b, 0);
                          if (distance > kernels.totalDiffAllowed) return false;
                          return true;
                        });
                        if (found !== undefined) {
                          counts[found.k]++;
                          return;
                        }
                        other[d.toString()] = (other[d.toString()] ?? 0) + 1;
                      });
                      const rval =
                        kernels.kernels.find(
                          (o) => counts[o.k] / data.length < o.v.needed
                        ) === undefined;
                      const common = Object.entries(other)
                        .map((o) => ({ k: o[0], v: o[1] }))
                        .sort((a, b) => b.v - a.v)
                        .slice(0, 10);
                      console.log(
                        JSON.stringify({
                          name: kernels.name,
                          rval,
                          counts,
                          length: data.length,
                          common,
                        })
                      );
                      return rval;
                    }) !== undefined
                  );
                }
                function mute_if_commercial() {
                  const start_time = Date.now();
                  Promise.resolve()
                    .then(() => get_data())
                    .catch(() => null)
                    .then((sliced_data) => {
                      if (sliced_data === null) return;
                      const is_commercial = get_is_commercial(sliced_data);
                      const should_mute = subscreen_muted || is_commercial;
                      if (should_mute !== video.muted) {
                        video.muted = should_mute;
                      }
                    })
                    .then(() => {
                      const mute_duration = Date.now() - start_time;
                      // console.log({ mute_duration });
                      setTimeout(
                        () => mute_if_commercial(),
                        Math.max(0, muteCommercialLoopPeriodMs - mute_duration)
                      );
                    });
                }
                mute_if_commercial();
              }

              function catchUp(firstTime: boolean) {
                var currentTime = 0;
                var triggered = false;
                return new Promise<void>((resolve) => {
                  const accelerateInterval = setInterval(() => {
                    if (!video.paused) {
                      const lag = video.duration - video.currentTime;
                      if (lag > (firstTime ? 30 : 50)) {
                        triggered = true;
                      } else if (lag < 20) {
                        triggered = false;
                      }
                      video.playbackRate = triggered ? 3 : 1;
                    }
                    if (firstTime) {
                      if (video.duration < 60) {
                        return;
                      }
                    } else {
                      if (currentTime <= video.currentTime) {
                        currentTime = video.currentTime;
                        return;
                      }
                    }
                    video.playbackRate = 1;
                    clearInterval(accelerateInterval);
                    resolve();
                  }, 100);
                });
              }

              const loadedInterval = setInterval(() => {
                if (video.duration >= 45) {
                  clearInterval(loadedInterval);
                  update_muted();
                  window.parent.postMessage(
                    {
                      source: "nflstream.html",
                      action: "loaded",
                      iFrameTitle: params.iFrameTitle,
                    },
                    "*"
                  );

                  muteCommercialLoop();

                  video.currentTime = video.duration - 15;
                  catchUp(true).then(() => {
                    catchUp(false);
                    var recentTimestamp = 0;
                    var stalledTime = 0;
                    const refreshInterval = setInterval(() => {
                      if (video.paused) return;
                      const now = Date.now();
                      if (recentTimestamp === video.currentTime) {
                        if (now - stalledTime >= 5000) {
                          window.parent.postMessage(
                            {
                              source: "nflstream.html",
                              action: "refresh",
                              iFrameTitle: params.iFrameTitle,
                            },
                            "*"
                          );
                          clearInterval(refreshInterval);
                        }
                      } else {
                        recentTimestamp = video.currentTime;
                        stalledTime = now;
                      }
                    }, 100);
                  });
                }
              }, 10);
            }

            player.on((window as any).Clappr.Events.PLAYER_PLAY, customInit);
          }}
        />
      </body>
    </html>
  );
}
