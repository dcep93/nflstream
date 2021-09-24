console.log("fetch_and_save");

fetch("https://google.com")
  .then((r) => r.text())
  .then((t) => console.log(t));
