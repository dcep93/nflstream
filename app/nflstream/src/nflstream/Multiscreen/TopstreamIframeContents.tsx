function CustomScript(params: { [key: string]: string }): string {
  var flowapi: any;
  var flowplayer: any;
  function f(params: { [key: string]: string }) {
    // var key = params.key;

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
      flowplayer.conf = {
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
      flowapi = flowplayer("#hlsjslive", {
        splash: true,
        preload: "auto",
        autoplay: false,
        ratio: 9 / 16,

        // stream only available via https:
        // force loading of Flash HLS via https
        swfHls: "https://releases.flowplayer.org/7.0.4/flowplayerhls.swf",

        clip: {
          // enable hlsjs in desktop Safari for manual quality selection
          // CAVEAT: may cause decoding problems with some streams!
          hlsjs: {
            safari: true,
            recoverNetworkError: true,
            listeners: ["hlsFragLoaded", "hlsLevelLoading", "hlsLevelLoaded"],
          },
          live: true,
          dvr: true,
          sources: [{ type: "application/x-mpegurl", src: hlsurl }],
        },
      });
      customInit();
    }

    function customInit() {
      Array.from(document.getElementsByTagName("a")).find((a) =>
        a.href.endsWith("/hello/?from=player")
      )!.style.opacity = "0";

      (document.getElementsByClassName("fp-ui")[0] as HTMLElement).click();

      const video = document.getElementsByTagName("video")[0];
      var topstream_muted = true;
      function update_muted() {
        video.muted = topstream_muted;
      }
      update_muted();

      window.addEventListener("message", (event) => {
        if (event.data.source !== "nflstream") return;
        topstream_muted =
          event.data.mute !== null ? event.data.mute : !topstream_muted;
        update_muted();
      });

      const loadedInterval = setInterval(() => {
        if (flowapi.video.buffer > 0) {
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

          video.currentTime = flowapi.video.buffer - 5;

          const accelerateInterval = setInterval(() => {
            const behind = flowapi.video.buffer - video.currentTime;
            if (!video.paused && behind > 5) {
              video.playbackRate = behind > 5 ? 3 : 1;
            } else if (video.paused || flowapi.video.buffer > 60) {
              clearInterval(accelerateInterval);
              video.playbackRate = 1;

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
            }
          }, 100);
        }
      }, 10);
    }
  }
  return `
  ${f
    .toString()
    .split("\n")
    .map((i) => i.split("// ")[0].trim())
    .join("\n")};
  ${f.name}(params);
`;
}

export default function TopstreamIframeContents(params: {
  [key: string]: string;
}) {
  return `
  <!DOCTYPE html>
<html
  xmlns="https://www.w3.org/1999/xhtml"
  lang="en"
  class="hl-en not-logged-in no-touch"
>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="referrer" content="no-referrer" />
    <meta charset="utf-8" />
    <style>
      * {
        overflow: hidden;
      }
    </style>
    <script>
      const _console = Object.assign({}, console);
      console.log = console.time = console.timeEnd = () => null;
    </script>
    <!-- skin -->
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

    <!-- Compiled and minified CSS -->

    <!-- Compiled and minified JavaScript -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/0.100.1/js/materialize.min.js"></script>
    <script src="https://topstreams.info/js/moment.js"></script>

    <link
      rel="stylesheet"
      href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css"
    />
    <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>
    <script src="https://topstreams.info/js/jquery-input-file-text.js"></script>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/ScrollMagic/2.0.5/ScrollMagic.min.js"></script>
    <script>
      var params = ${JSON.stringify(params)};
      ${CustomScript(params)}
    </script>
  </head>

  <body>
    <div
      id="hlsjslive"
      class="fp-slim"
      style="display: block; outline: none"
    ></div>
  </body>
</html>
`;
}
