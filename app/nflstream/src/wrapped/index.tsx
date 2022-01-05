import React from "react";
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
  document.title = "Fantasy Wrapped";
  const data = all_data[leagueId];
  if (!data) return <div>no data found for league {leagueId}</div>;
  return (
    <div>
      {weekWinnersAndLosers(data)}
      {squeezesAndStomps(data)}
      {bestByStreamingPosition(data)}
      {timesChosenWrong(data)}
      {gamesDeterminedByDiscreteScoring(data)}
    </div>
  );
}

function gamesDeterminedByDiscreteScoring(data: WrappedType) {
  function calculateDSTDifference(
    team: TeamType,
    boxscores: BoxscoreType[],
    differences: string[]
  ): number {
    const started = team.roster.find(
      (player) =>
        player.position === Position.DST && team.lineup.includes(player.id)
    )!;
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
    playbyplays: PlaybyplayType[],
    differences: string[]
  ): number {
    const started = team.roster.find(
      (player) =>
        player.position === Position.K && team.lineup.includes(player.id)
    )!;
    const playbyplay = playbyplays.find(
      (playbyplay) => playbyplay.team === started.team
    )!;
    const superscore = playbyplay.headlines
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
      <div className={[css.bubble, css.grey].join(" ")}>
        <h1>Games Determined By Discrete Scoring</h1>
        {data.weeks
          .filter((week) => week.number <= 13)
          .flatMap((week) => week.matches.map((match) => ({ week, match })))
          .map((match) => {
            if (match.match[1].score - match.match[0].score > 10) return null;
            const mapped = match.match.map((team) => {
              const differences: string[] = [];
              const superscore = (
                team.score +
                calculateDSTDifference(
                  team,
                  match.week.boxscores,
                  differences
                ) +
                calculateKDifference(team, match.week.playbyplays, differences)
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
    </div>
  );
}

function timesChosenWrong(data: WrappedType) {
  return (
    <div>
      <div className={[css.bubble, css.grey].join(" ")}>
        <h1>Times Chosen Wrong</h1>
        {data.weeks
          .filter((week) => week.number <= 13)
          .map((week) =>
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
                      const bestIds: number[] = [];
                      const filteredRoster = sortByKey(
                        team.roster.filter(
                          (player) => choices[player.position]
                        ),
                        (player) => -player.score
                      );
                      Object.keys(choices)
                        .map((position) => parseInt(position) as Position)
                        .filter((position) => position !== Position.FLEX)
                        .forEach((position) => {
                          const subFilteredRoster = filteredRoster.filter(
                            (player) => player.position === position
                          );
                          Array.from(new Array(choices[position])).forEach(
                            () => {
                              const bestId = subFilteredRoster.find(
                                (player) => !bestIds.includes(player.id)
                              )!.id;
                              bestIds.push(bestId);
                            }
                          );
                        });
                      Array.from(
                        new Array(choices[Position.FLEX] || 0)
                      ).forEach(() => {
                        const bestId = filteredRoster.find(
                          (player) => !bestIds.includes(player.id)
                        )!.id;
                        bestIds.push(bestId);
                      });
                      const betterStartIds = bestIds.filter(
                        (playerId) => !team.lineup.includes(playerId)
                      );
                      if (betterStartIds.length === 0) return null;
                      const bestStarts = betterStartIds.map((id) => {
                        const player = team.roster.find(
                          (player) => player.id === id
                        )!;
                        superscore += player.score;
                        return `${player.name} ${player.score}`;
                      });
                      const startedStarts = team.lineup
                        .filter(
                          (playerId) =>
                            choices[
                              team.roster.find(
                                (player) => player.id === playerId
                              )!.position
                            ]
                        )
                        .filter((playerId) => !bestIds.includes(playerId))
                        .map((id) => {
                          const player = team.roster.find(
                            (player) => player.id === id
                          )!;
                          superscore -= player.score;
                          return `${player.name} ${player.score.toFixed(2)}`;
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
              .map((teams, i) => (
                <div key={i}>
                  <div className={css.bubble}>
                    <div>week {week.number}:</div>
                    <b>{teams[0].name}</b> {teams[0].score} (ss{" "}
                    {teams[0].superscore.toFixed(2)})
                    <div>could have beaten</div>
                    <div>
                      <b>{teams[1].name}</b> {teams[1].score} (ss{" "}
                      {teams[1].superscore.toFixed(2)})
                    </div>
                    <div>if they had started</div>
                    <div className={css.bubble}>
                      {teams[0].betterStarts.map((betterStart, j) => (
                        <div key={j}>{betterStart}</div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
          )}
      </div>
    </div>
  );
}

function bestByStreamingPosition(data: WrappedType) {
  return (
    <div>
      <div className={[css.bubble, css.grey].join(" ")}>
        <h1>Best By Streaming Position</h1>
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
                ({i + 1}) {obj.score.toFixed(2)} <b>{obj.teamName}</b>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function squeezesAndStomps(data: WrappedType) {
  const num = 5;
  const rawPoints = sortByKey(
    data.weeks
      .filter((week) => week.number <= 13)
      .flatMap((week) =>
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
      <div className={[css.bubble, css.grey].join(" ")}>
        <h1>Squeezes and Stomps</h1>
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
    </div>
  );
}

function weekWinnersAndLosers(data: WrappedType) {
  const counts = Array.from(new Array(data.teamNames.length)).map((_, i) => ({
    tops: [] as number[],
    bottoms: [] as number[],
  }));
  const vals = data.weeks
    .filter((week) => week.number <= 13)
    .map((week, i) => {
      const sortedTeams = sortByKey(
        week.matches.flatMap((match) =>
          match.flatMap((team) => ({
            ...team,
            trueScore: team.roster
              .filter((player) => team.lineup.includes(player.id))
              .map((player) => player.score)
              .reduce((a, b) => a + b, 0),
          }))
        ),
        (team) => team.trueScore
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
      <div className={[css.bubble, css.grey].join(" ")}>
        <h1>Week Winners And Losers</h1>
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
                  week {week.number}: top score{" "}
                  {week.winner.trueScore.toFixed(2)}:{" "}
                  <b>{data.teamNames[week.winner.teamIndex]}</b>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className={css.bubble}>
              {vals.map((week, i) => (
                <div key={i}>
                  week {week.number}: bottom score{" "}
                  {week.loser.trueScore.toFixed(2)}{" "}
                  <b>{data.teamNames[week.loser.teamIndex]}</b>
                </div>
              ))}
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
  boxscores: BoxscoreType[];
  playbyplays: PlaybyplayType[];
};

type BoxscoreType = {
  oppTeam: string;
  passing: number;
  rushing: number;
  score: number;
};

type PlaybyplayType = { team: string; headlines: string[] };

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
