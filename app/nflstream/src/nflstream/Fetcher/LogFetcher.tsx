import Fetcher, { cacheF, LogType } from ".";
import { extension_id } from "..";

class LogFetcher extends Fetcher<LogType | null, number> {
  intervalMs = 3 * 1000;
  getResponse() {
    const gameId = this.props.payload;
    return Promise.resolve()
      .then(() => [
        fetchE(
          `https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/summary?region=us&lang=en&contentorigin=espn&event=${gameId}`,
          10 * 1000
        ),
        fetchE(
          `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/${gameId}/competitions/${gameId}/drives?limit=1000`,
          10 * 1000
        ),
      ])
      .then((ps) => Promise.all(ps))
      .then((resps) => (resps as string[]).map((resp) => JSON.parse(resp)))
      .then(([obj, coreObj]) =>
        Promise.resolve()
          .then(() => coreObj.items.slice().reverse()[0])
          .then((coreItem) =>
            coreItem === undefined
              ? obj
              : Promise.resolve()
                  .then(() => coreItem["$ref"])
                  .then((driveUrl) => fetchE(driveUrl, 2 * 1000))
                  .then((driveResp) => JSON.parse(driveResp))
                  .then((driveObj) =>
                    fetchE(driveObj.team["$ref"], 24 * 60 * 60 * 1000)
                      .then((teamResp) => JSON.parse(teamResp))
                      .then((teamObj) => {
                        driveObj.team = teamObj;
                        driveObj.plays = driveObj.plays.items;
                        obj.drives.current = driveObj;
                        return obj;
                      })
                  )
          )
      )
      .then((obj) => {
        if (!obj.drives) return null;
        const drives = [obj.drives.current]
          .concat(
            obj.drives.previous
              .reverse()
              .filter(
                (drive: { id: string }) => drive.id !== obj.drives.current?.id
              )
          )
          .filter((drive) => drive?.team);
        const playByPlay = drives.map((drive) => ({
          team: drive.team.shortDisplayName,
          result: drive.displayResult,
          plays: drive.plays
            .reverse()
            .filter((p: any) => p.participants)
            .map((p: any) => ({
              down: p.start.downDistanceText,
              text: p.text,
              clock: `Q${p.period.number} ${p.clock.displayValue}`,
              distance: p.statYardage,
            })),
          description: drive.description,
          score: `${drive.plays[0].awayScore} - ${drive.plays[0].homeScore}`,
          yardsToEndzone: drive.plays[0].end.yardsToEndzone,
        }));
        const timestamp = (obj.drives.current.plays as { wallclock?: number }[])
          .map((p) => p.wallclock)
          .find((w) => w)!;
        const boxScore = ["passing", "receiving", "rushing"].map((key) => ({
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
              rank: parseInt(a.stats[1].split("/")[0]),
            }))
            .sort((a, b) => b.rank - a.rank),
        }));
        const log = {
          gameId,
          timestamp,
          playByPlay,
          boxScore,
        };
        return log;
      });
  }
}

export function fetchE(
  url: string,
  maxAgeMs: number,
  options: any = undefined,
  f: (response: string) => Promise<string> = (response) =>
    Promise.resolve(response)
): Promise<string> {
  return cacheF(url, maxAgeMs, () =>
    new Promise<string>((resolve) =>
      window.chrome.runtime.sendMessage(
        extension_id,
        { url, options },
        (response: any) => resolve(response)
      )
    ).then((response) => f(response))
  );
}

export default LogFetcher;
