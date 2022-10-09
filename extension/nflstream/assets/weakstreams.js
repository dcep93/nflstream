function muteUnmute(event) {
  if (event.data.source !== "nflstream") return;
  const video = document.getElementsByTagName("video")[0];
  console.log(event.data, "muteUnmute", video);
  if (video) video.muted = event.data.mute;
}

function gethlsUrl(UrlID, serverid, cid) {
  $.ajax({
    type: "GET",
    url: "http://weakstreams.com/gethls",
    dataType: "json",
    data: { idgstream: UrlID, serverid: serverid, cid: cid },
    contentType: "application/json",
    error: function (err) {
      window.alert(`Server preparing, try again in a few seconds ${err}`);
    },
    success: function (data) {
      var rawUrl = data.rawUrl;
      var playerElement = document.getElementById("video-player");
      var player = new Clappr.Player({
        source: rawUrl,
        height: "100%",
        width: "100%",
        autoPlay: false,
        //  poster: '',
        plugins: [CDNByeClapprPlugin, LevelSelector],
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

function main() {
  window.addEventListener("message", muteUnmute);

  const params = new URLSearchParams(window.location.search);
  const vidgstream = params.get("vidgstream");
  window.token = params.get("token");

  window.addEventListener("load", function () {
    if (!vidgstream || !token) return alert("invalid params");
    gethlsUrl(vidgstream);
  });

  document.body.style = "margin: 0";
}

main();
