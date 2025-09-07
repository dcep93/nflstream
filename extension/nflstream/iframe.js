(({ source, muteCommercial }) => {
  if (!source) {
    alert("invalid params");
    return;
  }
  const extension_id = "jbdpjafpomdbklfifcclbkflmnnjefdc"; // local
  function getPayload(__meta) {
    const url = __meta.url;
    if (url.includes(".ts?token=")) {
      return Promise.resolve(undefined);
    }
    return new Promise((resolve) =>
      window.chrome.runtime.sendMessage(
        extension_id,
        {
          url,
        },
        (response) => resolve(response)
      )
    );
  }
  const OrigXHR = window.XMLHttpRequest;
  function InterceptedXHR() {
    const xhr = new OrigXHR();
    xhr.__meta = {};
    const origOpen = xhr.open;
    xhr.open = function (...args) {
      var _method$toUpperCase;
      const [method, url] = args;
      xhr.__meta.method =
        (method === null || method === void 0
          ? void 0
          : (_method$toUpperCase = method.toUpperCase) === null ||
            _method$toUpperCase === void 0
          ? void 0
          : _method$toUpperCase.call(method)) || "GET";
      xhr.__meta.url = url;
      return origOpen.apply(xhr, args);
    };
    const origSend = xhr.send;
    xhr.send = function (body) {
      getPayload(xhr.__meta).then((payload) => {
        console.log({
          ...xhr.__meta,
          body,
          payload,
        });
        if (xhr.__meta.url.includes(".ts?token=")) {
          return origSend.call(xhr, body);
        }
        Object.defineProperty(xhr, "readyState", {
          value: 4,
        });
        Object.defineProperty(xhr, "status", {
          value: 200,
        });
        Object.defineProperty(xhr, "statusText", {
          value: "OK",
        });
        Object.defineProperty(xhr, "responseText", {
          value: payload,
        });
        Object.defineProperty(xhr, "response", {
          value: payload,
        });
        xhr.dispatchEvent(new Event("readystatechange"));
        xhr.dispatchEvent(new Event("load"));
        xhr.dispatchEvent(new Event("loadend"));
      });
    };
    return xhr;
  }
  InterceptedXHR.prototype = OrigXHR.prototype;
  for (const k of Object.getOwnPropertyNames(OrigXHR)) {
    try {
      InterceptedXHR[k] = OrigXHR[k];
    } catch {}
  }
  window.XMLHttpRequest = InterceptedXHR;
  const player = new window.Clappr.Player({
    parentId: "#player",
    source,
    autoPlay: true,
    mute: true,
    height: "100%",
    width: "100%",
    playback: {
      crossOrigin: "anonymous",
      hlsjsConfig: {
        lowLatencyMode: true,
        backBufferLength: 90,
      },
    },
    plugins: [window.HlsjsPlayback],
  });
  function isLoaded() {
    // video.buffer > 45
    return true;
  }
  function isBrief() {
    // _flowapi.video.buffer < 60
    return true;
  }
  function fastForward() {
    // video.currentTime = _flowapi.video.buffer - 5;
  }
  function getLag() {
    // _flowapi.video.buffer - video.currentTime;
    return 0;
  }
  function customInit() {
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
    function muteCommercialLoop() {
      if (!muteCommercial) return;
      const muteCommercialLoopPeriodMs = 1000;
      function get_data() {
        if (subscreen_muted) return Promise.resolve([]);
        if (video.videoWidth === 0) {
          return Promise.resolve([]);
        }
        const canvas = document.getElementById("canvas");
        if (!canvas) {
          return Promise.resolve([]);
        }
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, video.videoWidth, video.videoHeight);
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const raw_data = ctx.getImageData(
          0,
          0,
          video.videoWidth,
          video.videoHeight
        ).data;
        const num_channels = 4;
        const num_segments = 40;
        const segment_size = raw_data.length / num_channels / num_segments;
        if (segment_size % 1 !== 0) return Promise.resolve([]);
        const segments = [];
        function helper(segment_index) {
          if (subscreen_muted) return Promise.resolve([]);
          if (segment_index === num_segments)
            return Promise.resolve(segments.flatMap((s) => s));
          segments.push(
            Array.from(new Array(segment_size))
              .map((_, i) => i + segment_index * segment_size)
              .map((i) =>
                Array.from(
                  raw_data.slice(i * num_channels, (i + 1) * num_channels)
                )
              )
              .map((channels) => ({
                channels: channels.slice(0, 3),
                alpha: channels[3],
              }))
              .map((o) => ({
                channels: o.channels,
                alpha: o.alpha,
                avg: o.channels.reduce((a, b) => a + b, 0) / o.channels.length,
              }))
              .map((o) => ({
                channels: o.channels,
                alpha: o.alpha,
                avg: o.avg,
                diff: o.channels
                  .map((c) => Math.abs(c - o.avg))
                  .reduce((a, b) => a + b, 0),
              }))
          );
          return new Promise((resolve) =>
            setTimeout(resolve, muteCommercialLoopPeriodMs / (num_segments + 1))
          ).then(() => helper(segment_index + 1));
        }
        return helper(0);
      }
      function get_is_commercial(data) {
        const filtered = {
          greys: data.filter((d) => d.alpha === 0 && d.diff <= 5).length,
          whites: data.filter((d) => d.alpha === 255 && d.diff <= 5).length,
          blues: data.filter(
            (d) => d.channels[2] - d.channels[0] - d.channels[1] > 20
          ).length,
        };
        const is_commercial =
          filtered.greys >= 876600 &&
          filtered.whites + filtered.blues >= 44000 &&
          filtered.blues >= 20;
        return is_commercial;
      }
      function mute_if_commercial() {
        const start_time = Date.now();
        Promise.resolve()
          .then(() => get_data())
          .catch(() => [])
          .then((sliced_data) => {
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
    function catchUp(firstTime) {
      var currentTime = 0;
      var triggered = false;
      return new Promise((resolve) => {
        const accelerateInterval = setInterval(() => {
          if (!video.paused) {
            const lag = getLag();
            if (lag > (firstTime ? 5 : 20)) {
              triggered = true;
            } else if (lag < 5) {
              triggered = false;
            }
            video.playbackRate = triggered ? 3 : 1;
          }
          if (firstTime) {
            if (isBrief()) {
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
      if (isLoaded()) {
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
        fastForward();
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
  player.on(window.Clappr.Events.PLAYER_PLAY, customInit);
})({ muteCommercial: true });
