import React from "react";
import all_data from "./wrapped.json";

type WrappedType = {
  teams: string[];
  weeks: {
    number: number;
    matches: TeamType[][];
    boxscores: {
      oppTeam: ProTeam;
      passing: number;
      rushing: number;
      score: number;
    }[];
    playbyplays: { team: ProTeam; headlines: string[] }[];
  }[];
};

type TeamType = {
  teamIndex: number;
  score: number;
  lineup: string[];
  roster: { [playerId: string]: PlayerType };
};

type PlayerType = {
  name: string;
  score: number;
  position: Position;
  team: ProTeam;
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

enum ProTeam {
  FA = 0,
  ATL = 1,
  BUF = 2,
  CHI = 3,
  CIN = 4,
  CLE = 5,
  DAL = 6,
  DEN = 7,
  DET = 8,
  GB = 9,
  TEN = 10,
  IND = 11,
  KC = 12,
  LV = 13,
  LAR = 14,
  MIA = 15,
  MIN = 16,
  NE = 17,
  NO = 18,
  NYG = 19,
  NYJ = 20,
  PHI = 21,
  ARI = 22,
  PIT = 23,
  LAC = 24,
  SF = 25,
  SEA = 26,
  TB = 27,
  WSH = 28,
  CAR = 29,
  JAX = 30,
  BAL = 31,
  HOU = 32,
}

const leagueId = 203836968;

function Wrapped() {
  const data: WrappedType = all_data[leagueId];
  if (!data) return `no data found for league ${leagueId}`;
  return <div>{JSON.stringify(data)}</div>;
}

export default Wrapped;
