import { useState } from "react";
import Fetcher from "../Fetcher";
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
        {JSON.stringify(scores)}
      </div>
    </>
  );
}

class ScoreFetcher extends Fetcher<scoresType, null> {
  intervalMs = 1000;
  static maxAgeMs = 0;
  getResponse() {
    return Promise.resolve([]).then((scores) => {
      ScoreFetcher.maxAgeMs = getLogDelayMs();
      return scores;
    });
  }
}
