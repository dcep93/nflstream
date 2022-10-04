console.log("content_script", "nflstream", location.href);

function init() {
  window.addEventListener("message", muteUnmute);
  removePaddingBottom();
}

function muteUnmute(event) {
  if (event.data.source !== "nflstream") return;
  const video = document.getElementsByTagName("video")[0];
  console.log(event.data, "muteUnmute", video);
  if (video) video.muted = event.data.mute;
}

function removePaddingBottom() {
  const div = document.getElementsByClassName("embed-responsive")[0];
  if (div) div.style.paddingBottom = 0;
}

init();
