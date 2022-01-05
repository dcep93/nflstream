import React from "react";
import style from "../nflstream/index.module.css";
import css from "./index.module.css";
import all_data from "./wrapped.json";

const leagueId = 203836968;

enum Position {
  QB = 1,
  RB = 2,
  WR = 3,
  TE = 4,
  K = 5,
  DST = 16,
  FLEX = -1,
}

function Wrapped() {
  const data = all_data[leagueId];
  if (!data) return <div>no data found for league {leagueId}</div>;
  return (
    <div>
      {/* {games_determined_by_discrete_scoring(data)} */}
      {/* {times_chosen_wrong(data)} */}
      {bestByStreamingPosition(data)}
      {squeezesAndStomps(data)}
      {weekWinnersAndLosers(data)}
    </div>
  );
}

function games_determined_by_discrete_scoring(data: WrappedType) {
  return <div className={style.bubble}>{JSON.stringify(data)}</div>;
}

function times_chosen_wrong(data: WrappedType) {
  return <div className={style.bubble}>{JSON.stringify(data)}</div>;
}

function bestByStreamingPosition(data: WrappedType) {
  return (
    <div>
      <div className={style.bubble}>
        <h1>Best By Streaming Position</h1>
        {[Position.QB, Position.DST, Position.K].map((position, i) => (
          <div key={i} className={style.bubble}>
            <h3>{Position[position]}</h3>
            {sortByKey(
              data.teamNames.map((teamName, index) => ({
                teamName,
                score: data.weeks
                  .flatMap((week) => week.matches)
                  .flatMap((teams) => teams)
                  .filter((team) => team.teamIndex === index)
                  .flatMap((team) =>
                    team.roster.filter((player) =>
                      team.lineup.includes(player.id)
                    )
                  )
                  .filter((player) => player.position === position)
                  .map((player) => player.score)
                  .reduce((a, b) => a + b, 0),
              })),
              (obj) => -obj.score
            ).map((obj, i) => (
              <div key={i}>
                ({i + 1}) {obj.score.toFixed(2)} [{obj.teamName}]
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function squeezesAndStomps(data: WrappedType) {
  const num = 3;
  const rawPoints = sortByKey(
    data.weeks.flatMap((week) =>
      week.matches.map((teams) => ({
        week: week.number,
        diff: teams[1].score - teams[0].score,
        winner: teams[1].teamIndex,
        loser: teams[0].teamIndex,
      }))
    ),
    (match) => match.diff
  );
  return (
    <div>
      <div className={style.bubble}>
        <h1>Squeezes and Stomps</h1>
        <div>
          <div className={style.bubble}>
            {rawPoints.slice(0, num).map((point, i) => (
              <div key={i}>
                {point.diff.toFixed(2)} point squeeze during week {point.week} [
                {data.teamNames[point.winner]}] beat [
                {data.teamNames[point.loser]}]
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className={style.bubble}>
            {rawPoints
              .slice(-num)
              .reverse()
              .map((point, i) => (
                <div key={i}>
                  {point.diff.toFixed(2)} point stomp during week {point.week} [
                  {data.teamNames[point.winner]}] beat [
                  {data.teamNames[point.loser]}]
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function weekWinnersAndLosers(data: WrappedType) {
  const counts = Array.from(new Array(data.teamNames.length)).map((_, i) => ({
    tops: [] as number[],
    bottoms: [] as number[],
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
    counts[winnerAndLoser.winner.teamIndex].tops.push(week.number);
    counts[winnerAndLoser.loser.teamIndex].bottoms.push(week.number);
    return winnerAndLoser;
  });
  return (
    <div>
      <div className={style.bubble}>
        <h1>Week Winners And Losers</h1>
        <div className={css.flex}>
          <div className={style.bubble}>
            {counts.map((count, i) => (
              <div key={i}>
                tops: ({count.tops.join(",")}) bottoms: (
                {count.bottoms.join(",")}) - {data.teamNames[i]}{" "}
              </div>
            ))}
          </div>
          <div className={style.bubble}>
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

export default Wrapped;
