import { useState } from "react";
import Fetcher from "../Fetcher";
import { fetchE } from "../Fetcher/LogFetcher";
import { getLogDelayMs } from "../Log";

export const SCOREBOARD = "scoreboard";

type scoresType = { teamName: string; score: number; projected: number }[][];

export default function Scoreboard() {
  const [scores, updateScores] = useState<scoresType | null>(null);
  return (
    <>
      <ScoreFetcher
        payload={null}
        handleResponse={(_scores) => updateScores(_scores)}
      />
      <div
        style={{
          height: "100%",
          width: "98%",
          color: "white",
        }}
        onClick={() => {
          ScoreFetcher.maxAgeMs = 0;
        }}
      >
        {scores === null ? "loading..." : JSON.stringify(scores)}
      </div>
    </>
  );
}

type matchupTeam = {
  teamId: number;
  totalPointsLive: number;
  totalProjectedPointsLive: number;
};
class ScoreFetcher extends Fetcher<scoresType, null> {
  intervalMs = 1000;
  static maxAgeMs = 0;
  static leagueId = 203836968;
  static year = 2024;
  getResponse() {
    return Promise.resolve()
      .then(() =>
        fetchE(
          `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${ScoreFetcher.year}/segments/0/leagues/${ScoreFetcher.leagueId}?view=mMatchup&view=mMatchupScore&view=mRoster&view=mScoreboard&view=mSettings&view=mStatus&view=mTeam&view=modular&view=mNav`,
          ScoreFetcher.maxAgeMs,
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
      .then((response) => JSON.parse(response))
      .then((scores) => {
        ScoreFetcher.maxAgeMs = getLogDelayMs();
        return scores;
      });
  }
}
