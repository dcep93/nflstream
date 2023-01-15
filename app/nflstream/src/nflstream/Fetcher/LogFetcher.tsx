import Fetcher, { cacheF, LogType } from ".";
import { extension_id } from "..";

class LogFetcher extends Fetcher<LogType | null, number> {
  intervalMs = 10 * 1000;
  getResponse() {
    const gameId = this.props.payload;
    return fetchE(
      `https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/summary?region=us&lang=en&contentorigin=espn&event=${gameId}`,
      5 * 1000
    )
      .then((resp) => JSON.parse(resp))
      .then((obj) => {
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
          labels:
            obj.boxscore.players[0].statistics.find((s: any) => s.name === key)
              ?.labels || [],
          players: []
            .concat(
              ...obj.boxscore.players
                .map((team: any) =>
                  team.statistics.find((s: any) => s.name === key)
                )
                .filter(Boolean)
                .map((t: any) => t.athletes)
            )
            .map((a: any) => ({
              name: a.athlete.displayName,
              stats: a.stats,
              rank: parseInt(a.stats[0].split("/")[0]),
            }))
            .sort((a, b) => b.rank - a.rank),
        }));
        const log = {
          gameId,
          timestamp,
          playByPlay,
          boxScore,
          fantasy: [],
        };
        return log;
      });
  }
}

function fetchE(
  url: string,
  maxAgeMs: number,
  options: any = undefined
): Promise<string> {
  return cacheF(
    url,
    maxAgeMs,
    () =>
      new Promise((resolve) =>
        window.chrome.runtime.sendMessage(
          extension_id,
          { url, options },
          (response: any) => resolve(response)
        )
      )
  );
}
export default LogFetcher;
