function muteUnmute(event) {
  if (event.data.source !== "nflstream") return;
  const video = document.getElementsByTagName("video")[0];
  console.log(event.data, "muteUnmute", video);
  if (video) video.muted = event.data.mute;
}

window.addEventListener("message", muteUnmute);

const params = new URLSearchParams(window.location.search);
const vidgstream = params.get("vidgstream");
const token = params.get("token");

var player = null;
function gethlsUrl(UrlID, serverid, cid) {
  $.ajax({
    type: "GET",
    url: "http://weakstreams.com/gethls",
    dataType: "json",
    data: { idgstream: UrlID, serverid: serverid, cid: cid },
    contentType: "application/json",
    error: function (err) {
      window.alert("Server preparing, try again in a few seconds");
    },
    success: function (data) {
      var rawUrl = data.rawUrl;
      var playerElement = document.getElementById("video-player");
      player = new Clappr.Player({
        source: rawUrl,
        height: "100%",
        width: "100%",
        autoPlay: false,
        //  poster: '',
        plugins: [CDNByeClapprPlugin, LevelSelector, ChromecastPlugin],
        playback: {
          hlsjsConfig: {
            maxBufferSize: 0,
            maxBufferLength: 10,
            liveSyncDurationCount: 10,
            p2pConfig: {
              live: true,
              token,
              wsSignalerAddr: "wss://signal.p2pengine.net:8089",
              //	announce: "https://tracker.p2pengine.net:7067/v1",
            },
          },
        },
        chromecast: {
          appId: "9DFB77C0", // clappr app id
          contentType: "video/mp4",
          media: {
            type: ChromecastPlugin.Movie,
            title: "NFL Stream",
            subtitle: "",
          },
          // customData: {
          //   licenseURL: "http://widevine/yourLicenseServer",
          // },
        },
        mediacontrol: { buttons: "#EE0000" },
        mimeType: "application/x-mpegURL",
      });
      player.attachTo(playerElement);
      function resizePlayer() {
        var aspectRatio = 9 / 16,
          newWidth =
            document.getElementById("video-player").parentElement.offsetWidth,
          newHeight = 2 * Math.round((newWidth * aspectRatio) / 2);
        player.resize({ width: newWidth, height: newHeight });
      }
      resizePlayer();
      window.onresize = resizePlayer;
    },
  });
}

window.addEventListener("load", function () {
  if (!vidgstream || !token) return alert("invalid params");
  gethlsUrl(vidgstream);
});
