console.log("fetch_and_save");

fetch("https://google.com")
  .then((r) => r.text())
  .then((t) => console.log(t));

export type NFLStreamType = { updated: string; streams?: StreamType[] };

export type StreamType = { url: string; name: string };
