const url = "https://nflstream.web.app";
fetch(url)
  .then((resp) => resp.text())
  .then((text) => text.replaceAll(/\/?static/g, `${url}/static`))
  .then((text) => {
    document.getElementById("iframe").srcdoc = text;
  });
