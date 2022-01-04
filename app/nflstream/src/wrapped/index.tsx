import React from "react";
import style from "../nflstream/index.module.css";
import all_data from "./wrapped.json";

const leagueId = 203836968;

function Wrapped() {
  const data = all_data[leagueId];
  if (!data) return <div>no data found for league {leagueId}</div>;
  return (
    <div>
      {/* {games_determined_by_discrete_scoring(data)} */}
      {/* {best_by_streaming_position(data)} */}
      {squeezesAndStomps(data)}
      {/* {times_chosen_wrong(data)} */}
      {/* {weekWinnersAndLosers(data)} */}
    </div>
  );
}

function games_determined_by_discrete_scoring(data: WrappedType) {
  return <div className={style.bubble}>{JSON.stringify(data)}</div>;
}

function best_by_streaming_position(data: WrappedType) {
  return <div className={style.bubble}>{JSON.stringify(data)}</div>;
}

function squeezesAndStomps(data: WrappedType) {
  const rawPoints = data.weeks.map((week) => week.matches);
  return (
    <div>
      <div className={style.bubble}>
        {rawPoints.map((point, i) => (
          <div key={i}>{point.teams[1]}</div>
        ))}
      </div>
    </div>
  );
}

function times_chosen_wrong(data: WrappedType) {
  return <div className={style.bubble}>{JSON.stringify(data)}</div>;
}

function weekWinnersAndLosers(data: WrappedType) {
  const counts = Array.from(new Array(data.teamNames.length)).map((_, i) => ({
    wins: [] as number[],
    losses: [] as number[],
  }));
  const vals = data.weeks.map((week, i) => {
    const sortedTeams = sortByKey(
      week.matches.flatMap((match) => match.flatMap((team) => team)),
      (team) => team.score
    );
    const winnerAndLoser = {
      loser: sortedTeams[0],
      winner: sortedTeams[sortedTeams.length - 1],
      number: week.number,
    };
    counts[winnerAndLoser.winner.teamIndex].wins.push(week.number);
    counts[winnerAndLoser.loser.teamIndex].losses.push(week.number);
    return winnerAndLoser;
  });
  return (
    <div>
      <div className={style.bubble}>
        <h1>Week Winners And Losers</h1>
        <div>
          <div className={style.bubble}>
            {vals.map((week, i) => (
              <div key={i}>
                week {week.number} top score {week.winner.score}{" "}
                {data.teamNames[week.winner.teamIndex]}{" "}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className={style.bubble}>
            {vals.map((week, i) => (
              <div key={i}>
                week {week.number} bottom score {week.loser.score}{" "}
                {data.teamNames[week.loser.teamIndex]}{" "}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className={style.bubble}>
            {counts.map((count, i) => (
              <div key={i}>
                wins: ({count.wins.join(",")}) losses: ({count.losses.join(",")}
                ) - {data.teamNames[i]}{" "}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function sortByKey<T>(arr: T[], f: (t: T) => number): T[] {
  return arr
    .map((obj) => ({ obj, v: f(obj) }))
    .sort((a, b) => a.v - b.v)
    .map((w) => w.obj);
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
