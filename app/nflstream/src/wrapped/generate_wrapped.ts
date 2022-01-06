import { PlayerType, TeamType, WeekType, WrappedType } from ".";

function generateWrapped() {
  const year = 2021;
  const leagueIds = ["67201591", "203836968"];
  const numWeeks = 17;
  /* */
  function getWrapped(
    id: string
  ): Promise<{ id: string; wrapped: WrappedType }> {
    return getTeamNames(id)
      .then((teamNames) => {
        const players = {};
        return getWeeks(id, players).then((weeks) => ({
          teamNames,
          weeks,
          players,
        }));
      })
      .then((wrapped) => ({ id, wrapped }));
  }
  function sortByKey<T>(arr: T[], f: (t: T) => number): T[] {
    return arr
      .map((obj) => ({ obj, v: f(obj) }))
      .sort((a, b) => a.v - b.v)
      .map((w) => w.obj);
  }
  function getTeamNames(id: string): Promise<string[]> {
    return fetch(
      `https://fantasy.espn.com/apis/v3/games/ffl/seasons/${year}/segments/0/leagues/${id}?view=mTeam`
    )
      .then((resp) => resp.json() as any)
      .then((resp) =>
        resp.teams.map((team: any) => `${team.location} ${team.nickname}`)
      );
  }
  function getWeeks(
    id: string,
    players: { [playerId: string]: PlayerType }
  ): Promise<WeekType[]> {
    function getTeam(rawTeam: any): TeamType {
      const proTeams: { [proTeamId: number]: string } = {
        0: "FA",
        1: "Atl",
        2: "Buf",
        3: "Chi",
        4: "Cin",
        5: "Cle",
        6: "Dal",
        7: "Den",
        8: "Det",
        9: "GB",
        10: "Ten",
        11: "Ind",
        12: "KC",
        13: "LV",
        14: "LAR",
        15: "Mia",
        16: "Min",
        17: "NE",
        18: "NO",
        19: "NYG",
        20: "NYJ",
        21: "Phi",
        22: "Ari",
        23: "Pit",
        24: "LAC",
        25: "SF",
        26: "Sea",
        27: "TB",
        28: "Wsh",
        29: "Car",
        30: "Jax",
        33: "Bal",
        34: "Hou",
      };
      const lineupInts: number[] = rawTeam.rosterForMatchupPeriod.entries
        .map((p: any) => p.playerId)
        .filter(
          (playerId: number) =>
            ![undefined, 20, 21].includes(
              rawTeam.rosterForCurrentScoringPeriod.entries.find(
                (p: any) => p.playerId === playerId
              )?.lineupSlotId
            )
        );
      const fullRoster = rawTeam.rosterForCurrentScoringPeriod.entries
        .map((rawPlayer: any) => ({
          rawPlayer,
          player: rawPlayer.playerPoolEntry.player,
        }))
        .map((obj: any) => ({
          id: obj.player.id,
          name: obj.player.fullName,
          score: obj.rawPlayer.playerPoolEntry.appliedStatTotal,
          position: obj.player.defaultPositionId,
          team: proTeams[obj.player.proTeamId].toUpperCase(),
        }));
      fullRoster.forEach((obj: any) => {
        players[obj.id] = {
          name: obj.name,
          position: obj.position,
          team: obj.team,
        };
      });
      const score = fullRoster
        .filter((p: any) => lineupInts.includes(p.id))
        .map((p: any) => p.score)
        .reduce((a: any, b: any) => a + b, 0);
      return {
        teamIndex: rawTeam.teamId - 1,
        score: score,
        lineup: lineupInts.map((i) => i.toString()),
        roster: Object.fromEntries(fullRoster.map((p: any) => [p.id, p.score])),
      };
    }
    const promises = Array.from(new Array(numWeeks)).map((_, number) =>
      fetch(
        `https://fantasy.espn.com/apis/v3/games/ffl/seasons/${year}/segments/0/leagues/${id}?view=mScoreboard&scoringPeriodId=${number}`
      )
        .then((resp) => resp.json())
        .then((resp) =>
          resp.schedule
            .filter(
              (rawMatch: any) => rawMatch.away.rosterForCurrentScoringPeriod
            )
            .map((rawMatch: any) =>
              sortByKey(
                [rawMatch.away, rawMatch.home].map(getTeam),
                (team) => team.score
              )
            )
        )
        .then((matches) => ({ matches, number, boxscores: [], fieldgoals: [] }))
    );
    return Promise.all(promises);
  }
  Promise.all(leagueIds.map(getWrapped))
    .then((objs) => objs.map((obj) => [obj.id, obj.wrapped]))
    .then(Object.fromEntries)
    .then((allWrapped) => console.log(JSON.stringify(allWrapped)));
}

export default generateWrapped;
