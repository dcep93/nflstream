import React from "react";
import all_data from "./wrapped.json";

type WrappedType = {
  teams: string[];
  weeks: {
    number: number;
    matches: TeamType[][];
    boxscores: {
      name: string;
      passing: number;
      rushing: number;
      score: number;
    }[];
    playbyplays: string[];
  }[];
};

type TeamType = {
  teamIndex: number;
  score: number;
  lineup: string[];
  roster: { [playerId: string]: PlayerType };
};

type PlayerType = { name: string; score: number };

const leagueId = 203836968;

function Wrapped() {
  const data: WrappedType = all_data[leagueId];
  if (!data) return `no data found for league ${leagueId}`;
  return <div>{JSON.stringify(data)}</div>;
}

export default Wrapped;
