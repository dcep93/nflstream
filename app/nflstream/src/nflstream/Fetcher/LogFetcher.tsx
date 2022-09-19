import Fetcher, { fetchP, LogType } from ".";

class LogFetcher extends Fetcher<LogType | null, string> {
  intervalMs = 10 * 1000;
  getResponse() {
    return fetchP(
      `https://fcast.espncdn.com/FastcastService/pubsub/profiles/12000/topic/gp-football-nfl-${this.props.payload}/message/341/checkpoint`,
      5 * 1000
    ).then((message) => {
      const obj = JSON.parse(message);
      console.log(this.props.payload, obj);
      if (obj.drives === undefined) return null;
      const playByPlay = [obj.drives.current]
        .concat(obj.drives.previous.reverse())
        .filter((drive) => drive.team)
        .map((drive) => ({
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
          })),
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
