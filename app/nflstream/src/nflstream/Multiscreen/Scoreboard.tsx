import { useState } from "react";
import Fetcher from "../Fetcher";
import { fetchE } from "../Fetcher/LogFetcher";
import { getLogDelayMs } from "../Log";
import AutoScroller from "../Log/Autoscroller";

export const SCOREBOARD_SRC = "scoreboard";

type scoresType = { teamName: string; score: number; projected: number }[][];

export default function Scoreboard() {
  const [scores, updateScores] = useState<scoresType | null>(null);
  var timeout: NodeJS.Timeout;
  return (
    <div
      style={{ height: "100%", width: "100%" }}
      onClick={() => {
        ScoreFetcher.staticGetResponse(10_000)
          .then((_scores) => {
            clearTimeout(timeout);
            return _scores;
          })
          .then(updateScores);
      }}
    >
      <ScoreFetcher
        payload={null}
        handleResponse={(_scores) => {
          timeout = setTimeout(() => updateScores(_scores), getLogDelayMs());
        }}
      />
      {scores === null ? (
        <div>loading...</div>
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
            {scores.map((teams, i) => (
              <div
                key={i}
                style={{
                  border: "2px solid grey",
                  borderRadius: "10px",
                  margin: "1em",
                  padding: "0.5em",
                  backgroundColor: "lightgrey",
                }}
              >
                {teams
                  .sort((a, b) => b.projected - a.projected)
                  .map((t, j) => (
                    <div key={j} style={{ maxWidth: "13em" }}>
                      {t.score} ({t.projected.toFixed(2)}) {t.teamName}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </AutoScroller>
      )}
    </div>
  );
}

type matchupTeam = {
  teamId: number;
  totalPointsLive: number;
  totalProjectedPointsLive: number;
};
class ScoreFetcher extends Fetcher<scoresType, null> {
  intervalMs = 20_000;
  static leagueId = 203836968;
  static year = 2024;

  getResponse<T extends typeof ScoreFetcher>() {
    return (this.constructor as T).staticGetResponse(this.intervalMs);
  }

  static staticGetResponse(intervalMs: number) {
    return Promise.resolve()
      .then(() =>
        fetchE(
          `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${ScoreFetcher.year}/segments/0/leagues/${ScoreFetcher.leagueId}?view=mMatchup&view=mMatchupScore&view=mRoster&view=mScoreboard&view=mSettings&view=mStatus&view=mTeam&view=modular&view=mNav`,
          30_000,
          undefined,
          (response) =>
            Promise.resolve(response)
              .then(JSON.parse)
              .then(
                (response: {
                  teams: { id: number; name: string }[];
                  scoringPeriodId: number;
                  schedule: {
                    matchupPeriodId: number;
                    away: matchupTeam;
                    home: matchupTeam;
                  }[];
                }) =>
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
                      }))
                    )
              )
              .then(JSON.stringify)
        )
      )
      .then((response) => JSON.parse(response));
  }
}
