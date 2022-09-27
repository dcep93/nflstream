console.log("content_script", "nflstream", location.href);

function init() {
  window.addEventListener("message", muteUnmute);
}

function muteUnmute(event) {
  if (event.data.source !== "nflstream") return;
  const video = document.getElementsByTagName("video")[0];
  console.log(event.data, "muteUnmute", video);
  video.muted = event.data.mute;
}

init();
