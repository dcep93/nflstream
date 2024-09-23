import ReactDomServer from "react-dom/server";

export default function TopstreamSrcDoc(params: { [key: string]: string }) {
  function FunctionToScript<T>(props: { t: T; f: (t: T) => void }) {
    return (
      <script
        dangerouslySetInnerHTML={{
          __html: `\n(${props.f.toString()})(${JSON.stringify(props.t)})\n`,
        }}
      ></script>
    );
  }
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
          t={undefined}
          f={() => {
            const _console = Object.assign({}, console);
            Object.assign(window, { _console });
            console.log = console.time = console.timeEnd = () => null;
          }}
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/flowplayer/7.2.7/skin/skin.css"
        />
        <script
          type="text/javascript"
          src="https://code.jquery.com/jquery-2.1.1.min.js"
        ></script>
        <script src="https://topstreams.info/js/hls.forcaster2.js?ver=1.4.5"></script>
        <script src="https://topstreams.info/js/flowplayer.min.js"></script>
        <script src="https://topstreams.info/js/p1.js"></script>

        <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/0.100.1/js/materialize.min.js"></script>
        <script src="https://topstreams.info/js/moment.js"></script>

        <link
          rel="stylesheet"
          href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css"
        />
        <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>
        <script src="https://topstreams.info/js/jquery-input-file-text.js"></script>

        <script src="https://cdnjs.cloudflare.com/ajax/libs/ScrollMagic/2.0.5/ScrollMagic.min.js"></script>
        <FunctionToScript
          t={params}
          f={(params: { [key: string]: string }) => {
            var key = params.key;
            if (!key) {
              alert("invalid params");
              return;
            }

            const _flowplayer = Object.assign(window).flowplayer;
            var _flowapi: any;

            const resources: { [key: string]: any } = {};

            Object.assign(window, {
              resources,
              router: null,
              routermode: 1, //1=resolution ,2=cacheproxy ,3=passthru
              routercountry: "us",
              masterinf: JSON.parse(atob(params.masterinf)),
            });

            setInterval(function () {
              var records = window.performance.getEntriesByType("resource");
              for (var i = 0; i < records.length; i++) {
                var record: any = records[i];
                resources[record.name] = record.responseEnd;
              }
              window.performance.clearResourceTimings();
            }, 200);

            window.onload = function () {
              // var reloadCount = 0;
              // var reloadStart = true;
              // var isplaying = false;

              // var cloudindex = 0;
              // var edges = {};

              var masterkey = params.masterkey;
              //var hlsurl='https://tstreams.info/1/'+key;
              //var hlsurl='https://proxy.tstreams.info/master/nfl/us/'+masterkey;
              var hlsurl = "https://tstreams.info/" + masterkey + ".m3u8";

              // var timer;
              _flowplayer.conf = {
                fullscreen: true,
                // iOS allows only native fullscreen from within iframes
                native_fullscreen: true,
              };
              fetch("https://topstreams.info/tv/testurl-" + masterkey + ".txt")
                .then((resp) => resp.text())
                .then((text) => {
                  Object.assign(window, { testurl: text });
                })
                .then(() => initPlayer(hlsurl));
            };

            function initPlayer(hlsurl: string) {
              _flowapi = _flowplayer("#hlsjslive", {
                splash: true,
                preload: "auto",
                // autoplay: false,
                muted: true,
                ratio: 9 / 16,

                // stream only available via https:
                // force loading of Flash HLS via https
                swfHls:
                  "https://releases.flowplayer.org/7.0.4/flowplayerhls.swf",

                clip: {
                  // enable hlsjs in desktop Safari for manual quality selection
                  // CAVEAT: may cause decoding problems with some streams!
                  hlsjs: {
                    safari: true,
                    recoverNetworkError: true,
                    listeners: [
                      "hlsFragLoaded",
                      "hlsLevelLoading",
                      "hlsLevelLoaded",
                    ],
                  },
                  live: true,
                  dvr: true,
                  sources: [{ type: "application/x-mpegurl", src: hlsurl }],
                },
              });
              Object.assign(window, {
                flowapi: _flowapi,
              });
              customInit();
            }

            function customInit() {
              Array.from(document.getElementsByTagName("a")).find((a) =>
                a.href.endsWith("/hello/?from=player")
              )!.style.opacity = "0";

              (
                document.getElementsByClassName("fp-ui")[0] as HTMLElement
              ).click();

              const video = document.getElementsByTagName("video")[0];
              var subscreen_muted = true;
              function update_muted() {
                video.muted = subscreen_muted;
              }
              update_muted();

              window.addEventListener("message", (event) => {
                if (event.data.source !== "nflstream") return;
                subscreen_muted =
                  event.data.mute !== null ? event.data.mute : !subscreen_muted;
                update_muted();
              });

              function muteLoop() {
                setInterval(() => {
                  if (subscreen_muted) return;
                  function get_is_commercial(raw_data: Uint8ClampedArray) {
                    const num_channels = 4;
                    const data = Array.from(
                      new Array(raw_data.length / num_channels)
                    )
                      .map((_, i) =>
                        Array.from(
                          raw_data.slice(
                            i * num_channels,
                            (i + 1) * num_channels
                          )
                        )
                      )
                      .map((channels) => ({
                        channels: channels.slice(0, 3),
                        alpha: channels[3],
                      }))
                      .map((o) => ({
                        ...o,
                        avg:
                          o.channels.reduce((a, b) => a + b, 0) /
                          o.channels.length,
                      }))
                      .map((o) => ({
                        ...o,
                        diff: o.channels
                          .map((c) => Math.abs(c - o.avg))
                          .reduce((a, b) => a + b, 0),
                      }));
                    const filtered = {
                      greys: data.filter((d) => d.alpha === 0 && d.diff <= 5)
                        .length,
                      whites: data.filter((d) => d.alpha === 255 && d.diff <= 5)
                        .length,
                      blues: data.filter(
                        (d) =>
                          d.channels[2] - d.channels[0] - d.channels[1] > 20
                      ).length,
                    };
                    const is_commercial =
                      filtered.greys >= 876600 &&
                      filtered.whites + filtered.blues >= 44000 &&
                      filtered.blues >= 25;
                    return is_commercial;
                  }
                  if (video.videoWidth === 0) {
                    return;
                  }
                  const canvas = document.getElementById(
                    "canvas"
                  ) as HTMLCanvasElement;
                  if (!canvas) {
                    return;
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

                  const data = ctx.getImageData(
                    0,
                    0,
                    video.videoWidth,
                    video.videoHeight
                  ).data;
                  const is_commercial = get_is_commercial(data);
                  const should_be_muted = is_commercial || subscreen_muted;
                  if (should_be_muted !== video.muted) {
                    video.muted = should_be_muted;
                  }
                }, 1000);
              }

              function catchUp(firstTime: boolean) {
                var currentTime = 0;
                var triggered = false;
                return new Promise<void>((resolve) => {
                  const accelerateInterval = setInterval(() => {
                    if (!video.paused) {
                      const behind = _flowapi.video.buffer - video.currentTime;
                      if (behind > (firstTime ? 5 : 20)) {
                        triggered = true;
                      } else if (behind < 5) {
                        triggered = false;
                      }
                      video.playbackRate = triggered ? 3 : 1;
                    }
                    if (firstTime) {
                      if (_flowapi.video.buffer < 60) {
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
                if (_flowapi.video.buffer > 0) {
                  clearInterval(loadedInterval);
                  update_muted();
                  window.parent.postMessage(
                    {
                      source: "topstream.html",
                      action: "loaded",
                      iFrameTitle: params.iFrameTitle,
                    },
                    "*"
                  );

                  muteLoop();

                  video.currentTime = _flowapi.video.buffer - 5;
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
                              source: "topstream.html",
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
          }}
        />
      </head>

      <body>
        <div
          id="hlsjslive"
          className="fp-slim"
          style={{ display: "block", outline: "none" }}
        ></div>
        <canvas id="canvas" hidden />
      </body>
    </html>
  );
}
