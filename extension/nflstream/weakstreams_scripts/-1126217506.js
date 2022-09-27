var player = null;
function gethlsUrl(UrlID, serverid, cid) {
  fetch("https://proxy420.appspot.com", {
    method: "POST",
    body: JSON.stringify({
      url: "http://weakstreams.com/gethls",
      options: {
        data: { idgstream: UrlID, serverid: serverid, cid: cid },
      },
    }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((data) => {
      var rawUrl = data.rawUrl;
      var playerElement = document.getElementById("video-player");
      player = new Clappr.Player({
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
              token: "U3LnNgNWg",
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
    })
    .catch((err) => {
      window.alert("Server preparing, try again in a few seconds");
    });
}
var vidgstream = document
  .getElementById("meta-vidgstream")
  .getAttribute("data-vidgstream");
gethlsUrl(vidgstream);

(function (open) {
  XMLHttpRequest.prototype.open = function (method, url, async, user, pass) {
    this.args = { method, url, async, user, pass };
    return open.call(this, method, url, async, user, pass);
  };
})(XMLHttpRequest.prototype.open);

(function (send) {
  XMLHttpRequest.prototype.send = function (body) {
    fetch("https://proxy420.appspot.com", {
      method: "POST",
      body: JSON.stringify({
        url: this.args.url,
        options: { method: this.args.method },
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((resp) => resp.text())
      .then((text) => {
        this.readyState == XMLHttpRequest.DONE;
        this.status = 200;
        this.responseText = text;
        this.onreadystatechange({ currentTarget: this });
      });
  };
})(XMLHttpRequest.prototype.send);
