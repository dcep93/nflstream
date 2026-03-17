import Fetcher, { cacheF, LogType, PlayType, StreamType } from ".";
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
      console.log("getBasketballLog raw summary", payload.name, obj);
      const teamsById = Object.fromEntries(
        [
          ...(obj.header?.competitions?.[0]?.competitors || []).map(
            (competitor: any) => [
              competitor.team.id,
              competitor.team.shortDisplayName ||
                competitor.team.displayName ||
                competitor.team.name ||
                "",
            ]
          ),
          ...(obj.boxscore?.teams || []).map((teamObj: any) => [
            teamObj.team.id,
            teamObj.team.shortDisplayName ||
              teamObj.team.displayName ||
              teamObj.team.name ||
              "",
          ]),
        ]
      );
      const plays = (obj.plays || []).slice();
      if (plays.length === 0) return null;
      const playByPlay = buildBasketballPlayByPlay(plays, teamsById);
      const timestamp =
        Date.parse(
          obj.meta?.lastPlayWallClock ||
            plays[plays.length - 1]?.wallclock ||
            obj.header?.competitions?.[0]?.date ||
            ""
        ) ||
        Date.now();
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
        boxScore: buildBasketballBoxScore(obj.boxscore?.players || [], config.boxScoreKeys),
      };
      console.log("getBasketballLog normalized log", payload.name, log);
      return maybeAddFantasyLog(log, payload.leagueName);
  });
}

function buildBasketballPlayByPlay(
  plays: any[],
  teamsById: Record<string, string>
) {
  const normalizedPlays = plays.map((play) => normalizeBasketballPlay(play, teamsById));
  type BasketballPlayType = (typeof normalizedPlays)[number];
  const groups: {
    team: string;
    result?: string;
    plays: PlayType[];
    description: string;
    score: string;
    yardsToEndzone: number;
  }[] = [];
  let currentGroup:
    | {
        plays: BasketballPlayType[];
      }
    | null = null;
  let index = 0;

  const pushCurrentGroup = () => {
    if (!currentGroup || currentGroup.plays.length === 0) return;
    groups.push(buildBasketballGroup(currentGroup.plays));
    currentGroup = null;
  };

  while (index < normalizedPlays.length) {
    const play = normalizedPlays[index];
    if (isFreeThrowPlay(play)) {
      pushCurrentGroup();
      const freeThrowPlays = [play];
      const freeThrowClock = play.clock;
      index += 1;
      while (
        index < normalizedPlays.length &&
        (isFreeThrowPlay(normalizedPlays[index]) ||
          normalizedPlays[index].clock === freeThrowClock)
      ) {
        freeThrowPlays.push(normalizedPlays[index]);
        index += 1;
      }
      groups.push(buildBasketballGroup(freeThrowPlays));
      continue;
    }

    if (!currentGroup) {
      currentGroup = {
        plays: [],
      };
    }
    currentGroup.plays.push(play);
    if (play.result === "SCORE") pushCurrentGroup();
    index += 1;
  }

  pushCurrentGroup();
  return groups;
}

function buildBasketballGroup(
  plays: {
    team: string;
    result?: string;
    down: string;
    text: string;
    clock: string;
    distance: number;
    score: string;
    period?: number;
    clockSecondsRemaining?: number;
  }[]
) {
  const visiblePlays = filterBasketballGroupPlays(plays);
  const renderedOrderPlays = visiblePlays.slice().reverse();
  const summaryPlay =
    renderedOrderPlays.find((play) => isPrimaryBasketballSummaryPlay(play.down)) ||
    renderedOrderPlays[0] ||
    visiblePlays[visiblePlays.length - 1];
  const latestPlay =
    renderedOrderPlays[0] || visiblePlays[0] || plays[plays.length - 1];
  return {
    team: summaryPlay.team || latestPlay.team,
    result: plays.find((play) => play.result === "SCORE") ? "SCORE" : undefined,
    plays: visiblePlays.map((play) => ({
      down: play.down,
      text: play.text,
      clock: play.clock,
      distance: play.distance,
    })),
    description: summaryPlay.text,
    score: latestPlay.score,
    yardsToEndzone: 100,
  };
}

function normalizeBasketballPlay(play: any, teamsById: Record<string, string>) {
  const period = parseInt(String(play.period?.number || "0")) || 0;
  const displayClock = play.clock?.displayValue || "";
  return {
    team:
      teamsById[play.team?.id] ||
      play.team?.shortDisplayName ||
      play.team?.displayName ||
      play.team?.abbreviation ||
      "",
    result: play.scoringPlay ? "SCORE" : undefined,
    down: play.type?.text || "",
    text: play.text || play.shortText || "",
    clock: `P${period || ""} ${displayClock}`.trim(),
    distance: parseInt(play.scoreValue || "0"),
    score: `${play.awayScore ?? ""} - ${play.homeScore ?? ""}`,
  };
}

function isFreeThrowPlay(play: { down: string; text: string }) {
  const down = play.down.toLowerCase();
  const text = play.text.toLowerCase();
  return down.includes("freethrow") || text.includes("free throw");
}

function filterBasketballGroupPlays(
  plays: {
    down: string;
    text: string;
    clock: string;
    distance: number;
    score: string;
    team: string;
    result?: string;
  }[]
) {
  const meaningfulPlays = plays.filter(
    (play) => !isAdministrativeBasketballPlay(play.down)
  );
  return meaningfulPlays.length > 0 ? meaningfulPlays : plays;
}

function isPrimaryBasketballSummaryPlay(down: string) {
  const normalized = down.toLowerCase();
  return !isAdministrativeBasketballPlay(normalized);
}

function isAdministrativeBasketballPlay(down: string) {
  const normalized = down.toLowerCase();
  return [
    "substitution",
    "officialtvtimeout",
    "shorttimeout",
    "timeout",
    "dead ball rebound",
    "deadballteamrebound",
  ].includes(normalized);
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

function buildBasketballBoxScore(players: any[], keys: readonly string[]) {
  const statConfig: Record<
    string,
    { rankKey: string; columns: readonly string[] }
  > = {
    points: {
      rankKey: "points",
      columns: [
        "minutes",
        "points",
        "fieldGoalsMade-fieldGoalsAttempted",
        "threePointFieldGoalsMade-threePointFieldGoalsAttempted",
        "freeThrowsMade-freeThrowsAttempted",
      ],
    },
    rebounds: {
      rankKey: "rebounds",
      columns: ["minutes", "rebounds", "offensiveRebounds", "defensiveRebounds"],
    },
    assists: {
      rankKey: "assists",
      columns: ["minutes", "assists", "turnovers"],
    },
  };
  return keys.map((key) => {
    const config = statConfig[key];
    const athletes = (players || []).flatMap((team: any) => {
      const statBlock = team.statistics?.[0];
      if (!statBlock) return [];
      const blockKeys = statBlock.keys || [];
      const labels = config.columns.map((columnKey) => {
        const columnIndex = blockKeys.findIndex((k: string) => k === columnKey);
        return statBlock.labels?.[columnIndex] || columnKey;
      });
      const rankIndex = blockKeys.findIndex((k: string) => k === config.rankKey);
      const columnIndexes = config.columns.map((columnKey) =>
        blockKeys.findIndex((k: string) => k === columnKey)
      );
      return (statBlock.athletes || [])
        .filter((athlete: any) => (athlete.stats || []).length > 0 && rankIndex >= 0)
        .map((athlete: any) => ({
          name: athlete.athlete.displayName,
          stats: columnIndexes.map((index) =>
            index >= 0 ? athlete.stats[index] || "" : ""
          ),
          rank: parseFloat(athlete.stats[rankIndex] || "0") || 0,
          labels,
        }));
    });
    return {
      key,
      labels: athletes[0]?.labels || [],
      players: athletes
        .sort((a, b) => b.rank - a.rank)
        .map(({ name, stats }) => ({ name, stats })),
    };
  });
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
