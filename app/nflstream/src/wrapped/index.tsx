import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import generateWrapped from "./generate_wrapped";
import css from "./index.module.css";
import all_data from "./wrapped.json";

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
  document.title = "Fantasy Wrapped";
  console.log(`(${generateWrapped.toString().replaceAll("\n", "")})()`);
  const [toRenderKey, update] = useState("");
  const [searchParams] = useSearchParams();
  const leagueId = searchParams.get("league_id") || 203836968;
  const data: WrappedType | undefined = (all_data as any)[leagueId];
  if (!data) return <>no data found for league {leagueId}</>;
  const toRender: { [key: string]: any } = {
    "Week Tops and Bottoms": WeekWinnersAndLosers(data),
    "Squeezes and Stomps": SqueezesAndStomps(data),
    "Best By Position": BestByStreamingPosition(data),
    "Determined By Discrete Scoring": GamesDeterminedByDiscreteScoring(data),
    "Chosen Wrong": TimesChosenWrong(data),
    "raw_data.json": JSON.stringify(data),
  };
  const defaultToRenderKey = Object.keys(toRender)[0]!;
  if (toRenderKey === "") update(defaultToRenderKey);
  return (
    <div>
      <div className={[css.flex, css.grey].join(" ")}>
        {Object.keys(toRender).map((key, i) => (
          <div key={i} className={css.bubble} onClick={() => update(key)}>
            {key}
          </div>
        ))}
      </div>
      <div>
        <h1 className={css.bubble}>
          {toRenderKey} - league {leagueId}
        </h1>
        <div>{toRender[toRenderKey]}</div>
      </div>
    </div>
  );
}

function GamesDeterminedByDiscreteScoring(data: WrappedType) {
  function calculateDSTDifference(
    team: TeamType,
    boxscores: BoxscoreType[],
    differences: string[]
  ): number {
    const started =
      data.players[
        team.lineup.find(
          (playerId) => data.players[playerId].position === Position.DST
        )!
      ];
    const offense = boxscores.find(
      (boxscore) => boxscore.oppTeam === started.team
    )!;
    const yards = offense.passing + offense.rushing;
    var superscore = 0;
    if (yards >= 550) {
      superscore += -6 - 1 * ((yards - 500) / 50);
      superscore -= -7;
    } else if (yards >= 500) {
      superscore += -6 - 1 * ((yards - 500) / 50);
      superscore -= -6;
    } else if (yards >= 450) {
      superscore += -5 - 1 * ((yards - 450) / 50);
      superscore -= -5;
    } else if (yards >= 400) {
      superscore += -3 - 2 * ((yards - 400) / 50);
      superscore -= -3;
    } else if (yards >= 350) {
      superscore += -1 - 2 * ((yards - 350) / 50);
      superscore -= -1;
    } else if (yards >= 300) {
      superscore += 0 - 1 * ((yards - 300) / 50);
      superscore -= 0;
    } else if (yards >= 200) {
      superscore += 2 - 2 * ((yards - 200) / 100);
      superscore -= 2;
    } else if (yards >= 100) {
      superscore += 3 - 1 * ((yards - 100) / 100);
      superscore -= 3;
    } else {
      superscore += 5 - 2 * (yards / 100);
      superscore -= 5;
    }
    if (offense.score >= 46) {
      superscore += -3 - 2 * ((offense.score - 35) / 11);
      superscore -= -5;
    } else if (offense.score >= 35) {
      superscore += -3 - 2 * ((offense.score - 35) / 11);
      superscore -= -3;
    } else if (offense.score >= 28) {
      superscore += -1 - 2 * ((offense.score - 28) / 7);
      superscore -= -1;
    } else if (offense.score >= 14) {
      superscore += 1 - 2 * ((offense.score - 14) / 14);
      superscore -= 1;
    } else if (offense.score >= 7) {
      superscore += 3 - 2 * ((offense.score - 7) / 7);
      superscore -= 3;
    } else if (offense.score >= 1) {
      superscore += 4 - 1 * ((offense.score - 1) / 6);
      superscore -= 4;
    } else {
      superscore += 5 - (1 * (offense.score - 0)) / 1;
      superscore -= 5;
    }
    differences.push(`${started.name} ${superscore.toFixed(2)}`);
    return superscore;
  }
  function calculateKDifference(
    team: TeamType,
    fieldgoals: FieldGoalType[],
    differences: string[]
  ): number {
    const started =
      data.players[
        team.lineup.find(
          (playerId) => data.players[playerId].position === Position.K
        )!
      ];
    const headlines = fieldgoals.find(
      (fieldgoal) => fieldgoal.team === started.team
    )!.fieldgoals;
    const superscore = headlines
      .map((headline) => {
        if (headline.indexOf(started.name) !== 0) return 0;
        const yards = parseInt(
          headline.split(" Yd Field Goal")[0].split(" ").reverse()[0]
        );
        var points = yards / 10;
        if (yards >= 60) {
          points -= 6;
        } else if (yards >= 50) {
          points -= 5;
        } else if (yards >= 40) {
          points -= 4;
        } else {
          points -= 3;
        }
        return points;
      })
      .reduce((a, b) => a + b, 0);
    differences.push(`${started.name} ${superscore.toFixed(2)}`);
    return superscore;
  }
  return (
    <div>
      {data.weeks
        .flatMap((week) => week.matches.map((match) => ({ week, match })))
        .map((match) => {
          if (match.match[1].score - match.match[0].score > 10) return null;
          const mapped = match.match.map((team) => {
            const differences: string[] = [];
            const superscore = (
              team.score +
              calculateDSTDifference(team, match.week.boxscores, differences) +
              calculateKDifference(team, match.week.fieldgoals, differences)
            ).toFixed(2);
            return {
              name: data.teamNames[team.teamIndex],
              score: team.score,
              differences,
              superscore,
            };
          });
          return { week: match.week, loser: mapped[0], winner: mapped[1] };
        })
        .filter(
          (match) =>
            match !== null && match.loser.superscore > match.winner.superscore
        )
        .map(
          (match, i) =>
            match && (
              <div key={i}>
                <div className={css.bubble}>
                  <div>week {match.week.number}:</div>
                  <div>
                    <b>{match.loser.name}</b> {match.loser.score} (ss{" "}
                    {match.loser.superscore})
                  </div>
                  <div>would have beaten</div>
                  <div>
                    <b>{match.winner.name}</b> {match.winner.score} (ss{" "}
                    {match.winner.superscore})
                  </div>
                  <div>if K and DST used continuous scoring:</div>
                  <div className={css.bubble}>
                    <div>{match.loser.differences.join(" ")}</div>
                    <div>{match.winner.differences.join(" ")}</div>
                  </div>
                </div>
              </div>
            )
        )}
    </div>
  );
}

function TimesChosenWrong(data: WrappedType) {
  const wrongChoices = data.weeks.flatMap((week) =>
    week.matches
      .map((teams) =>
        teams.map((team) => {
          var superscore = team.score;
          const betterStarts = [
            {
              [Position.QB]: 1,
            },
            {
              [Position.DST]: 1,
            },
            {
              [Position.K]: 1,
            },
            {
              [Position.RB]: 2,
              [Position.WR]: 2,
              [Position.TE]: 1,
              [Position.FLEX]: 1,
            },
          ]
            .map((choices) => {
              const bestIds: string[] = [];
              const filteredRoster = sortByKey(
                Object.keys(team.roster).filter(
                  (playerId) => choices[data.players[playerId].position]
                ),
                (playerId) => -team.roster[playerId]
              );
              Object.keys(choices)
                .map((position) => parseInt(position) as Position)
                .filter((position) => position !== Position.FLEX)
                .forEach((position) => {
                  const subFilteredRoster = filteredRoster.filter(
                    (playerId) => data.players[playerId].position === position
                  );
                  Array.from(new Array(choices[position])).forEach(() => {
                    const bestId = subFilteredRoster.find(
                      (playerId) => !bestIds.includes(playerId)
                    )!;
                    bestIds.push(bestId);
                  });
                });
              Array.from(new Array(choices[Position.FLEX] || 0)).forEach(() => {
                const bestId = filteredRoster.find(
                  (playerId) => !bestIds.includes(playerId)
                )!;
                bestIds.push(bestId);
              });
              const betterStartIds = bestIds.filter(
                (playerId) => !team.lineup.includes(playerId)
              );
              if (betterStartIds.length === 0) return null;
              const bestStarts = betterStartIds.map((id) => {
                const score = team.roster[id];
                superscore += score;
                return `${data.players[id].name} ${score}`;
              });
              const startedStarts = team.lineup
                .filter((playerId) => choices[data.players[playerId].position])
                .filter((playerId) => !bestIds.includes(playerId))
                .map((id) => {
                  const score = team.roster[id];
                  superscore -= score;
                  return `${data.players[id].name} ${score}`;
                });
              return [bestStarts, startedStarts]
                .map((s) => s.join(","))
                .join(" / ");
            })
            .filter((i) => i);

          const teamData = {
            name: data.teamNames[team.teamIndex],
            teamIndex: team.teamIndex,
            superscore,
            betterStarts,
            score: team.score,
          };
          return teamData;
        })
      )
      .filter((teams) => teams[0].superscore > teams[1].score)
      .map((teams) => ({ teams, week: week.number }))
  );
  const [filterTeam, update] = useState(-1);
  return (
    <div>
      <div>
        <div className={css.bubble}>
          {data.teamNames
            .map((teamName, index) => ({
              teamName,
              index,
              wrong: wrongChoices
                .filter((choice) => choice.teams[0].teamIndex === index)
                .map((choice) => choice.week),
            }))
            .map((obj, i) => (
              <div key={i}>
                <b
                  className={[
                    css.hover,
                    filterTeam === obj.index && css.grey,
                  ].join(" ")}
                  onClick={() =>
                    update(filterTeam === obj.index ? -1 : obj.index)
                  }
                >
                  {obj.teamName}
                </b>{" "}
                chose wrong weeks ({obj.wrong.join(",")})
              </div>
            ))}
        </div>
      </div>
      {wrongChoices
        .filter(
          (choice) =>
            filterTeam === -1 ||
            choice.teams.map((team) => team.teamIndex).includes(filterTeam)
        )
        .map((choice, i) => (
          <div key={i}>
            <div className={css.bubble}>
              <div>week {choice.week}:</div>
              <b>{choice.teams[0].name}</b> {choice.teams[0].score} (ss{" "}
              {choice.teams[0].superscore.toFixed(2)})
              <div>could have beaten</div>
              <div>
                <b>{choice.teams[1].name}</b> {choice.teams[1].score} (ss{" "}
                {choice.teams[1].superscore.toFixed(2)})
              </div>
              <div>if they had started</div>
              <div className={css.bubble}>
                {choice.teams[0].betterStarts.map((betterStart, j) => (
                  <div key={j}>{betterStart}</div>
                ))}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}

function BestByStreamingPosition(data: WrappedType) {
  return (
    <div>
      {[Position.QB, Position.DST, Position.K].map((position, i) => (
        <div key={i} className={css.bubble}>
          <h3>{Position[position]}</h3>
          {sortByKey(
            data.teamNames.map((teamName, index) => ({
              teamName,
              score: data.weeks
                .flatMap((week) => week.matches)
                .flatMap((teams) => teams)
                .filter((team) => team.teamIndex === index)
                .flatMap((team) =>
                  team.lineup
                    .filter(
                      (playerId) => data.players[playerId].position === position
                    )
                    .map((playerId) => team.roster[playerId])
                )
                .reduce((a, b) => a + b, 0),
            })),
            (obj) => -obj.score
          ).map((obj, i) => (
            <div key={i}>
              ({i + 1}) {obj.score.toFixed(2)} <b>{obj.teamName}</b>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function SqueezesAndStomps(data: WrappedType) {
  const num = 5;
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
      <div>
        <div className={css.bubble}>
          {rawPoints.slice(0, num).map((point, i) => (
            <div key={i}>
              week {point.week}: {point.diff.toFixed(2)} point squeeze /{" "}
              <b>{data.teamNames[point.winner]}</b> beat{" "}
              <b>{data.teamNames[point.loser]}</b>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className={css.bubble}>
          {rawPoints
            .slice(-num)
            .reverse()
            .map((point, i) => (
              <div key={i}>
                week {point.week}: {point.diff.toFixed(2)} point stomp /{" "}
                <b>{data.teamNames[point.winner]}</b> beat{" "}
                <b>{data.teamNames[point.loser]}</b>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function WeekWinnersAndLosers(data: WrappedType) {
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
      <div className={css.flexx}>
        <div className={css.bubble}>
          {counts.map((count, i) => (
            <div key={i}>
              <b>{data.teamNames[i]}</b> / tops: ({count.tops.join(",")}) /
              bottoms: ({count.bottoms.join(",")})
            </div>
          ))}
        </div>
        <div>
          <div className={css.bubble}>
            {vals.map((week, i) => (
              <div key={i}>
                week {week.number}: top score {week.winner.score.toFixed(2)}:{" "}
                <b>{data.teamNames[week.winner.teamIndex]}</b>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className={css.bubble}>
            {vals.map((week, i) => (
              <div key={i}>
                week {week.number}: bottom score {week.loser.score.toFixed(2)}{" "}
                <b>{data.teamNames[week.loser.teamIndex]}</b>
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

export type WrappedType = {
  teamNames: string[];
  weeks: WeekType[];
  players: { [playerId: string]: PlayerType };
};

export type WeekType = {
  number: number;
  matches: TeamType[][];
  boxscores: BoxscoreType[];
  fieldgoals: FieldGoalType[];
};

export type BoxscoreType = {
  oppTeam: string;
  passing: number;
  rushing: number;
  score: number;
};

export type FieldGoalType = { team: string; fieldgoals: string[] };

export type TeamType = {
  teamIndex: number;
  score: number;
  lineup: string[];
  roster: { [playerId: string]: number };
};

export type PlayerType = {
  name: string;
  position: Position;
  team: string;
};

export default Wrapped;
