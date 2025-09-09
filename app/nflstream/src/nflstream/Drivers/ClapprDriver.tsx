import ReactDomServer from "react-dom/server";
import { muteCommercialRef } from "../etc/Options";
import { StreamType } from "../Fetcher";
import { fetchES } from "../Fetcher/LogFetcher";
import { HOST } from "../Fetcher/StreamsFetcher";
import FunctionToScript from "./FunctionToScript";

const maxAgeMs = 10 * 60 * 1000;
const ClapprDriver = {
  getRawUrl: (stream_id: string) => `https://${HOST}/nflstreams/live`,
  getHostParams: (stream: StreamType, hardRefresh: boolean) =>
    fetchES(`https://${HOST}/nflstreams/live`, maxAgeMs)
      .then(
        (text) =>
          Array.from(text.matchAll(/href="(.*?-live-streaming-.*?)" class/g))
            .map((m) => m[1])
            .find((m) => m.includes(stream.stream_id))!
      )
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
              console.log({ __meta });
              if (__meta.url.includes("caxi"))
                return Promise.resolve(undefined);
              if (__meta.url.includes(".ts?"))
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
                  console.log({ __meta, body, payload });
                  if (!payload) {
                    return origSend.call(xhr, body as any);
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
                type Data = {
                  channels: number[];
                  alpha: number;
                  avg: number;
                };
                function get_data(): Promise<Data[]> {
                  if (subscreen_muted) return Promise.resolve([]);
                  if (video.videoWidth === 0) {
                    return Promise.resolve([]);
                  }
                  const canvas = document.getElementById(
                    "canvas"
                  ) as HTMLCanvasElement;
                  if (!canvas) {
                    return Promise.resolve([]);
                  }
                  const ctx = canvas.getContext("2d")!;
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
                  return Promise.resolve(
                    Array.from(new Array(video.videoWidth * video.videoHeight))
                      .map((_, i) =>
                        Array.from(raw_data.slice(i * 4, i * 4 + 4))
                      )
                      .map((channels) => ({
                        channels: channels.slice(0, 3),
                        alpha: channels[3],
                      }))
                      .map((o) => ({
                        channels: o.channels,
                        alpha: o.alpha,
                        avg:
                          o.channels.reduce((a, b) => a + b, 0) /
                          o.channels.length,
                      }))
                  );
                }
                function get_is_commercial(data: Data[]) {
                  const filtered = {
                    zeros: data.filter((d) => d.alpha === 0 && d.avg === 0)
                      .length,
                    nonzeros: data.filter((d) => d.avg !== 0).length,
                    alphas: data.filter((d) => d.alpha === 255).length,
                    blues: data.filter(
                      (d) => d.channels[2] - d.channels[0] - d.channels[1] > 20
                    ).length,
                  };
                  console.log(filtered);
                  return false;
                }
                function mute_if_commercial() {
                  const start_time = Date.now();
                  Promise.resolve()
                    .then(() => get_data())
                    .catch(() => [])
                    .then((sliced_data) => {
                      (window as any).comm_data = sliced_data;
                      const is_commercial = get_is_commercial(sliced_data);
                      const should_mute = subscreen_muted || is_commercial;
                      if (should_mute !== video.muted) {
                        video.muted = should_mute;
                      }
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
