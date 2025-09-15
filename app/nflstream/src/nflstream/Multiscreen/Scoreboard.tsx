import { useState } from "react";
import Fetcher from "../Fetcher";
import { fetchE } from "../Fetcher/LogFetcher";
import { getLogDelayMs } from "../Log";
import AutoScroller from "../Log/Autoscroller";
import { probNormalMinAll } from "./guillotine";

export const SCOREBOARD_SRC = "scoreboard";

type ScoreboardPlayersType = {
  name: string;
  score: number;
  projected: number;
  isStarting: boolean;
}[];

type ScoreboardDataType = {
  leagueId: number;
  isGuillotine: boolean;
  scores: {
    teamName: string;
    score: number;
    projected: number;
    players: ScoreboardPlayersType;
  }[][];
};

export default function Scoreboard() {
  const [scoreboardData, updatescoreboardData] =
    useState<ScoreboardDataType | null>(null);
  var timeout: NodeJS.Timeout;
  return (
    <div
      style={{ height: "100%", width: "100%" }}
      onClick={() =>
        ScoreFetcher.staticGetResponse(100)
          .then((_scoreboardData) => {
            clearTimeout(timeout);
            return _scoreboardData;
          })
          .then(updatescoreboardData)
      }
    >
      <ScoreFetcher
        payload={null}
        handleResponse={(_scoreboardData) => {
          timeout = setTimeout(
            () => updatescoreboardData(_scoreboardData),
            !_scoreboardData ? 0 : getLogDelayMs()
          );
        }}
      />
      {scoreboardData === null ? (
        <h2 style={{ color: "#AAAAAA" }}>
          open your fantasy page on a separate tab
        </h2>
      ) : (
        <AutoScroller speed={0.03}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {scoreboardData.isGuillotine ? (
              <Guillotine scoreboardData={scoreboardData} />
            ) : (
              <Standard scoreboardData={scoreboardData} />
            )}
          </div>
        </AutoScroller>
      )}
    </div>
  );
}

function Standard(props: { scoreboardData: ScoreboardDataType }) {
  return (
    <>
      {props.scoreboardData.scores
        .map((teams) => teams.sort((a, b) => b.projected - a.projected))
        .map((teams) => ({
          teams,
          diff: teams[0].projected - teams[1].projected,
          upcoming: teams
            .map((t) => t.projected - t.score)
            .map((tDiff) => tDiff + Math.min(tDiff, 5))
            .reduce((a, b) => a + b, 0),
        }))
        .map((o) => ({
          ...o,
          stddev: o.upcoming / 4,
        }))
        .map((o) => ({
          ...o,
          zScore: o.diff / o.stddev,
        }))
        .map((o) => ({
          ...o,
          zScore: Math.pow(o.zScore, 1.5),
        }))
        .map((o) => ({
          ...o,
          zScore: o.zScore * Math.pow(2, Math.abs(o.zScore)),
        }))
        .map((o) => ({
          ...o,
          probability: 0.5 + Math.atan(o.zScore) / Math.PI,
        }))
        .sort((a, b) => a.probability - b.probability)
        .map((o, i) => (
          <div
            key={i}
            style={{
              border: "2px solid grey",
              borderRadius: "10px",
              padding: "0.2em",
              backgroundColor: "lightgrey",
            }}
          >
            <div>probability: {(100 * o.probability).toFixed(2)}%</div>
            <div>
              {o.teams.map((t, j) => (
                <div
                  key={j}
                  style={{ maxWidth: "13em" }}
                  title={getTitle(t.players)}
                >
                  {t.score} ({t.projected.toFixed(2)}) {t.teamName}
                </div>
              ))}
            </div>
          </div>
        ))}
    </>
  );
}

function Guillotine(props: { scoreboardData: ScoreboardDataType }) {
  const teams = props.scoreboardData.scores
    .flatMap((teams) => teams)
    .filter((o) => o.projected > 0)
    .map((o) => ({
      ...o,
      tDiff: o.projected - o.score,
    }))
    .map((o) => ({ ...o, upcoming: o.tDiff + Math.min(o.tDiff, 5) }))
    .map((o) => ({
      ...o,
      stddev: o.upcoming / 4,
    }))
    .map((o) => ({
      ...o,
      stddev: Math.max(Math.abs(o.stddev), 0.01),
    }));
  const probabilities = probNormalMinAll(
    teams.map((t) => t.projected),
    teams.map((t) => t.stddev)
  );
  return (
    <>
      {teams
        .map((o, i) => ({ ...o, probability: probabilities[i] }))
        .sort((a, b) => b.probability - a.probability)
        .map((o, i) => (
          <div
            key={i}
            style={{
              border: "2px solid grey",
              borderRadius: "10px",
              padding: "0.2em",
              backgroundColor: "lightgrey",
            }}
          >
            <div>probability: {(100 * o.probability).toFixed(2)}%</div>
            <div>
              <div style={{ maxWidth: "13em" }} title={getTitle(o.players)}>
                {o.score} ({o.projected.toFixed(2)}) {o.teamName}
              </div>
            </div>
          </div>
        ))}
    </>
  );
}

function getTitle(players: ScoreboardPlayersType): string {
  return players
    .sort((a, b) => b.projected - a.projected)
    .sort((a, b) => b.score - a.score)
    .sort((a, b) => (b.isStarting ? 1 : -1 - (a.isStarting ? 1 : -1)))
    .map((p) => `${p.name} / ${p.score} / ${p.projected}`)
    .join("\n");
}

type matchupTeam = {
  teamId: number;
  totalPointsLive: number;
  totalProjectedPointsLive: number;
};
export class ScoreFetcher extends Fetcher<ScoreboardDataType, null> {
  intervalMs = 20_000;
  static year = 2025;

  getResponse<T extends typeof ScoreFetcher>() {
    return (this.constructor as T).staticGetResponse(this.intervalMs);
  }

  static staticGetResponse(intervalMs: number): Promise<ScoreboardDataType> {
    return Promise.resolve().then(() =>
      fetchE(
        `/content_script`,
        intervalMs,
        { type: "scoreboard", year: ScoreFetcher.year },
        (response) =>
          Promise.resolve(response)
            .then(JSON.parse)
            .then(
              (response: {
                id: number;
                teams: {
                  id: number;
                  name: string;
                  roster: {
                    entries: {
                      lineupSlotId: number;
                      playerPoolEntry: {
                        player: {
                          fullName: string;
                          stats: {
                            appliedTotal: number;
                            statSourceId: number;
                            statSplitTypeId: number;
                            scoringPeriodId: number;
                          }[];
                        };
                      };
                    }[];
                  };
                }[];
                scoringPeriodId: number;
                schedule: {
                  matchupPeriodId: number;
                  away: matchupTeam;
                  home: matchupTeam;
                }[];
              }) =>
                Promise.resolve()
                  .then(() =>
                    response.schedule
                      .filter(
                        (m) => m.matchupPeriodId === response.scoringPeriodId
                      )
                      .map((m) =>
                        [m.away, m.home].map((t) => ({
                          teamName: response.teams.find(
                            (rt) => rt.id === t.teamId
                          )!.name,
                          score: t.totalPointsLive,
                          projected: t.totalProjectedPointsLive,
                          players: response.teams
                            .find((rt) => rt.id === t.teamId)!
                            .roster.entries.map((e) => ({
                              name: e.playerPoolEntry.player.fullName,
                              score:
                                e.playerPoolEntry.player.stats.find(
                                  (s) =>
                                    s.statSourceId === 0 &&
                                    s.statSplitTypeId === 1 &&
                                    s.scoringPeriodId ===
                                      response.scoringPeriodId
                                )?.appliedTotal || Number.POSITIVE_INFINITY,
                              projected:
                                e.playerPoolEntry.player.stats.find(
                                  (s) =>
                                    s.statSourceId === 1 &&
                                    s.statSplitTypeId === 1 &&
                                    s.scoringPeriodId ===
                                      response.scoringPeriodId
                                )?.appliedTotal || Number.POSITIVE_INFINITY,
                              isStarting: ![
                                20, // bench
                                21, // IR
                              ].includes(e.lineupSlotId),
                            }))
                            .concat({
                              name: "<BENCH>",
                              score: Number.POSITIVE_INFINITY,
                              projected: Number.POSITIVE_INFINITY,
                              isStarting: false,
                            }),
                        }))
                      )
                  )
                  .then((scores) => ({
                    scores,
                    isGuillotine: [367176096].includes(response.id),
                    leagueId: response.id,
                  }))
            )
      )
    );
  }
}
