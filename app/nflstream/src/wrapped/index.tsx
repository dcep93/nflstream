import React from "react";
import all_data from "./wrapped.json";

const leagueId = 203836968;

function Wrapped() {
  const data: WrappedType = all_data[leagueId];
  if (!data) return <div>no data found for league {leagueId}</div>;
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

type WrappedType = {
  teamNames: string[];
  weeks: WeekType[];
};

type WeekType = {
  number: number;
  matches: TeamType[][];
  boxscores: {
    oppTeam: string;
    passing: number;
    rushing: number;
    score: number;
  }[];
  playbyplays: { team: string; headlines: string[] }[];
};

type TeamType = {
  teamIndex: number;
  score: number;
  lineup: number[];
  roster: PlayerType[];
};

type PlayerType = {
  id: number;
  name: string;
  score: number;
  position: Position;
  team: string;
};

enum Position {
  QB = 1,
  RB = 2,
  WR = 3,
  TE = 4,
  K = 5,
  DST = 16,
  FLEX = -1,
}

export default Wrapped;
