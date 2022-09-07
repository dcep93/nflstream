function getLogs(tabId) {
  return fetch("https://www.espn.com/nfl/schedule")
    .then((resp) => resp.text())
    .then((message) => sendMessage(tabId, { type: "parseSchedule", message }))
    .then((ids) =>
      ids.map((id) =>
        fetch(`https://www.espn.com${id}`)
          .then((resp) => resp.text())
          .then((message) => {
            const match = message.match(/espn\.gamepackage\.data =(.*?)\n/);
            if (!match) return null;
            const json = match[1].slice(0, -1);
            const obj = JSON.parse(json);
            const name = obj.boxscore.teams
              .map((team) => team.team.displayName)
              .reverse()
              .join(" vs ");
            if (obj.drives === undefined) {
              return { id, name };
            }
            const playByPlay = [obj.drives.current]
              .concat(obj.drives.previous.reverse())
              .filter((drive) => drive.team)
              .map((drive) => ({
                team: drive.team.shortDisplayName,
                result: drive.displayResult,
                plays: drive.plays.reverse().map((p) => ({
                  down: p.start.downDistanceText,
                  text: p.text,
                  clock: `Q${p.period.number} ${p.clock.displayValue}`,
                })),
                description: drive.description,
                score: `${drive.plays[0].awayScore} - ${drive.plays[0].homeScore}`,
              }));
            const timestamp = obj.drives.current.plays[0].modified;
            const boxScore = ["passing", "rushing", "receiving"].map((key) => ({
              key,
              labels: obj.boxscore.players[0].statistics.find(
                (s) => s.name === key
              ).labels,
              players: []
                .concat(
                  ...obj.boxscore.players
                    .map((team) => team.statistics.find((s) => s.name === key))

                    .map((t) => t.athletes)
                )
                .map((a) => ({
                  name: a.athlete.displayName,
                  stats: a.stats,
                })),
            }));
            return { id, name, timestamp, playByPlay, boxScore };
          })
          .catch((e) => console.log(e) && false)
      )
    )
    .then((promises) => Promise.all(promises))
    .then((logs) => logs.filter(Boolean));
}
