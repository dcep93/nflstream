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
          .map((url) => fetchP(url, 5 * 1000))
      )
      .then((promises) => Promise.all(promises))
      .then(([boxscoreResp, playbyplayResp]) => {
        console.log(this.props.payload, boxscoreResp, playbyplayResp);
        const drives = JSON.parse(playbyplayResp);
        const boxscore = JSON.parse(boxscoreResp);
        const drivesArr = [drives.current]
          .concat(drives.previous.reverse())
          .filter((drive) => drive.team);
        const playByPlay = drivesArr.map((drive) => ({
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
          drivesArr
            .flatMap((drive) => drive.plays)
            .map((play) => play.participants)
            .map(({ athlete }) => [athlete.fullName, parseInt(athlete.jersey)])
        );
        alert(JSON.stringify(jerseys));
        return null;
        const timestamp = drives.current.plays[0].modified;
        const boxScore = ["passing", "rushing", "receiving"].map((key) => ({
          key,
          labels: boxscore.players[0].statistics.find(
            (s: any) => s.name === key
          ).labels,
          players: []
            .concat(
              ...boxscore.players
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
