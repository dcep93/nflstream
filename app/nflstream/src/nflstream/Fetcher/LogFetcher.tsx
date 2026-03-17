import Fetcher, { cacheF, LogType, StreamType } from ".";
import { extension_id } from "..";
import { ScoreboardDataType, ScoreFetcher } from "../Multiscreen/Scoreboard";

const leagueConfigs = {
  nflstreams: {
    sport: "football",
    espnLeague: "nfl",
    playType: "football",
    boxScoreKeys: ["passing", "receiving", "rushing"],
  },
  cfbstreams: {
    sport: "football",
    espnLeague: "college-football",
    playType: "football",
    boxScoreKeys: ["passing", "receiving", "rushing"],
  },
  ncaabstreams: {
    sport: "basketball",
    espnLeague: "mens-college-basketball",
    playType: "basketball",
    boxScoreKeys: ["points", "rebounds", "assists"],
  },
} as const;

class LogFetcher extends Fetcher<LogType | null, StreamType> {
  intervalMs = 3 * 1000;

  getResponse() {
    const config =
      leagueConfigs[
        this.props.payload.leagueName as keyof typeof leagueConfigs
      ];
    if (!config || !this.props.payload.espnId) {
      return Promise.resolve(null);
    }
    if (config.playType === "football") {
      return getFootballLog(this.props.payload, config);
    }
    return getBasketballLog(this.props.payload, config);
  }
}

function getFootballLog(
  payload: StreamType,
  config: (typeof leagueConfigs)["nflstreams" | "cfbstreams"]
) {
  return Promise.resolve()
    .then(() => [
      fetchC(
        `https://site.web.api.espn.com/apis/site/v2/sports/${config.sport}/${config.espnLeague}/summary?region=us&lang=en&contentorigin=espn&event=${payload.espnId!}`,
        10 * 1000
      ),
      fetchES(
        `https://sports.core.api.espn.com/v2/sports/${config.sport}/leagues/${config.espnLeague}/events/${payload.espnId!}/competitions/${payload.espnId!}/drives?limit=1000`,
        10 * 1000
      ),
    ])
    .then((ps) => Promise.all(ps))
    .then((resps) => (resps as string[]).map((resp) => JSON.parse(resp)))
    .then(([obj, coreObj]) =>
      Promise.resolve()
        .then(() => coreObj.items.slice().reverse())
        .then((coreItems: { $ref: string; id: string }[]) =>
          coreItems
            .filter((coreItem) => coreItem !== undefined)
            .map((coreItem, index) =>
              Promise.resolve()
                .then(() => coreItem.$ref)
                .then((driveUrl) =>
                  fetchES(driveUrl, index === 0 ? 2 * 1000 : 5 * 60 * 1000)
                )
                .then((driveResp) => JSON.parse(driveResp))
                .then((driveObj) =>
                  fetchES(driveObj.team.$ref, 24 * 60 * 60 * 1000)
                    .then((teamResp) => JSON.parse(teamResp))
                    .then((teamObj) => ({
                      ...coreItem,
                      team: teamObj,
                      plays: driveObj.plays.items,
                    }))
                )
            )
        )
        .then((drivePromises) => Promise.all(drivePromises))
        .then((driveObjs) =>
          driveObjs.filter((driveObj) => driveObj.plays?.length > 0)
        )
        .then((driveObjs) => {
          if (driveObjs.length > 0) {
            obj.drives.current = driveObjs[0];
            obj.drives.previous = driveObjs.slice(1).reverse();
          }
        })
        .then(() => obj)
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
      const log = {
        gameId: payload.espnId!,
        timestamp,
        teams: (obj.boxscore?.teams || []).map((t: any) => ({
          name: t.team.name,
          statistics: Object.fromEntries(
            (t.statistics || []).map((s: any) => [s.name, s.displayValue])
          ),
        })),
        playByPlay,
        boxScore: buildBoxScore(obj.boxscore?.players || [], config.boxScoreKeys),
      };
      return maybeAddFantasyLog(log, payload.leagueName);
    });
}

function getBasketballLog(
  payload: StreamType,
  config: (typeof leagueConfigs)["ncaabstreams"]
) {
  return fetchC(
    `https://site.web.api.espn.com/apis/site/v2/sports/${config.sport}/${config.espnLeague}/summary?region=us&lang=en&contentorigin=espn&event=${payload.espnId!}`,
    10 * 1000
  )
    .then((resp) => JSON.parse(resp))
    .then((obj) => {
      const plays = (obj.plays || []).slice().reverse();
      if (plays.length === 0) return null;
      const playByPlay = plays.map((play: any) => ({
        team:
          play.team?.shortDisplayName ||
          play.team?.displayName ||
          play.team?.abbreviation ||
          "",
        result: play.scoringPlay ? "SCORE" : undefined,
        plays: [
          {
            down: play.type?.text || "",
            text: play.text || play.shortText || "",
            clock: `P${play.period?.number || ""} ${play.clock?.displayValue || ""}`.trim(),
            distance: parseInt(play.scoreValue || "0"),
          },
        ],
        description: play.text || play.shortText || "",
        score: `${play.awayScore ?? ""} - ${play.homeScore ?? ""}`,
        yardsToEndzone: 100,
      }));
      const timestamp =
        Date.parse(obj.header?.competitions?.[0]?.date || "") || Date.now();
      const log = {
        gameId: payload.espnId!,
        timestamp,
        teams: (obj.boxscore?.teams || []).map((t: any) => ({
          name: t.team.name,
          statistics: Object.fromEntries(
            (t.statistics || []).map((s: any) => [s.name, s.displayValue])
          ),
        })),
        playByPlay,
        boxScore: buildBoxScore(obj.boxscore?.players || [], config.boxScoreKeys),
      };
      return maybeAddFantasyLog(log, payload.leagueName);
    });
}

function buildBoxScore(players: any[], keys: readonly string[]) {
  return keys.map((key) => ({
    key,
    labels:
      players?.[0]?.statistics?.find((s: any) => s.name === key)?.labels || [],
    players: []
      .concat(
        ...(players || [])
          .map((team: any) => team.statistics?.find((s: any) => s.name === key))
          .filter(Boolean)
          .map((t: any) => t.athletes || [])
      )
      .map((a: any) => ({
        name: a.athlete.displayName,
        stats: a.stats,
        rank:
          a.stats
            ?.map((stat: string) => parseFloat(String(stat).split("/")[0]))
            .find((stat: number) => !Number.isNaN(stat)) || 0,
      }))
      .sort((a, b) => b.rank - a.rank),
  }));
}

export function fetchC(url: string, maxAgeMs: number) {
  return cacheF(url, maxAgeMs, () => fetch(url).then((resp) => resp.text()));
}

function addFantasyLog(log: LogType): Promise<LogType> {
  return fetchFantasyLog()
    .then((fantasyLog) => ({ ...log, fantasyLog }))
    .catch(() => log);
}

function maybeAddFantasyLog(log: LogType, leagueName: StreamType["leagueName"]) {
  return leagueName === "nflstreams" ? addFantasyLog(log) : Promise.resolve(log);
}

function fetchFantasyLog(): Promise<ScoreboardDataType | null> {
  return ScoreFetcher.staticGetResponse(1000);
}

export function fetchE<T>(
  url: string,
  maxAgeMs: number,
  options: any = undefined,
  f: (response: string) => Promise<T> = (response) =>
    Promise.resolve(response as T)
): Promise<T> {
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
export const fetchES = fetchE<string>;

export default LogFetcher;
