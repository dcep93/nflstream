import Fetcher, { fetchP, LogType } from ".";

class LogFetcher extends Fetcher<LogType | null, string> {
  intervalMs = 10 * 1000;
  getResponse() {
    return Promise.resolve()
      .then(() =>
        ["boxscore", "playbyplay"]
          .map(
            (key) =>
              `https://www.espn.com/nfl/${key}/_/gameId/${this.props.payload}`
          )
          .map((url) =>
            fetchP(url, 5 * 1000).then((resp) => {
              try {
                return JSON.parse(resp);
              } catch {
                console.log(url, resp);
                return null;
              }
            })
          )
      )
      .then((promises) => Promise.all(promises))
      .then(([rawBoxscore, rawDrives]) => {
        console.log(this.props.payload, rawBoxscore, rawDrives);
        if (!rawBoxscore || !rawDrives) return null;
        const drives = [rawDrives.current]
          .concat(rawDrives.previous.reverse())
          .filter((drive) => drive.team);
        const playByPlay = drives.map((drive) => ({
          team: drive.team.shortDisplayName,
          result: drive.displayResult,
          plays: drive.plays.reverse().map((p: any) => ({
            down: p.start.downDistanceText,
            text: p.text,
            clock: `Q${p.period.number} ${p.clock.displayValue}`,
          })),
          description: drive.description,
          score: `${drive.plays[0].awayScore} - ${drive.plays[0].homeScore}`,
        }));
        const jerseys = Object.fromEntries(
          drives
            .flatMap((drive) => drive.plays)
            .map((play) => play.participants)
            .map(({ athlete }) => [athlete.fullName, parseInt(athlete.jersey)])
        );
        alert(JSON.stringify(jerseys));
        return null;
        const timestamp = rawDrives.current.plays[0].modified;
        const boxScore = ["passing", "rushing", "receiving"].map((key) => ({
          key,
          labels: rawBoxscore.players[0].statistics.find(
            (s: any) => s.name === key
          ).labels,
          players: []
            .concat(
              ...rawBoxscore.players
                .map((team: any) =>
                  team.statistics.find((s: any) => s.name === key)
                )
                .map((t: any) => t.athletes)
            )
            .map((a: any) => ({
              name: a.athlete.displayName,
              stats: a.stats,
            }))
            .map((a) => ({ jersey: jerseys[a.name], ...a })),
        }));
        return {
          timestamp,
          playByPlay,
          boxScore,
        };
      });
  }
}

export default LogFetcher;
