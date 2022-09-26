import Fetcher, { fetchP, LogType } from ".";

class LogFetcher extends Fetcher<LogType | null, string> {
  intervalMs = 10 * 1000;
  getResponse() {
    const gameId = this.props.payload;
    return fetchP(
      `https://www.espn.com/nfl/playbyplay/_/gameId/${gameId}`,
      5 * 1000
    ).then((message) => {
      const match = message.match(/espn\.gamepackage\.data =(.*?);\n/);
      if (!match) return null;
      const obj = JSON.parse(match[1]);
      console.log(gameId, obj);
      if (!obj.drives) return null;
      const drives = [obj.drives.current]
        .concat(
          obj.drives.previous
            .reverse()
            .filter(
              (drive: { id: string }) => drive.id !== obj.drives.current?.id
            )
        )
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
      const timestamp = obj.drives.current.plays[0].modified;
      const boxScore = ["passing", "rushing", "receiving"].map((key) => ({
        key,
        labels: obj.boxscore.players[0].statistics.find(
          (s: any) => s.name === key
        ).labels,
        players: []
          .concat(
            ...obj.boxscore.players
              .map((team: any) =>
                team.statistics.find((s: any) => s.name === key)
              )
              .map((t: any) => t.athletes)
          )
          .map((a: any) => ({
            name: a.athlete.displayName,
            stats: a.stats,
            rank: parseInt(a.stats[0].split("/")[0]),
          }))
          .sort((a, b) => b.rank - a.rank),
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
