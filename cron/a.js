function parseSchedule(message) {
  return Promise.resolve(message)
    .then(parse)
    .then((html) => html.getElementsByTagName("a"))
    .then(Array.from)
    .then((as) =>
      as.filter((a) => {
        if (a.innerText === "LIVE") return true;
        const dataDate = a.getAttribute("data-date");
        if (dataDate) {
          const d = Date.parse(dataDate);
          if (Date.now() > d) return true;
        }
        return false;
      })
    )
    .then((as) => as.map((a) => a.getAttribute("href")));
}
