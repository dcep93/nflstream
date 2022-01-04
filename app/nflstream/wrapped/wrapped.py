import concurrent.futures

import collections
import json
import requests

joiner = " "

league_id = 203836968

year = 2021

cache_path = "cache.json"


class Positions:
    QB = 1
    RB = 2
    WR = 3
    TE = 4
    K = 5
    DST = 16
    FLEX = -1


metrics = []  # type: ignore

g = {}


def main():
    load_cache()
    for metric in metrics:
        print(metric[0])
        points = metric[1]()
        if points:
            for point in points:
                print(joiner.join(map(str, point)))
        else:
            print("no points")
        print()


def metric_d():
    def d(f):
        name = f.__name__
        metrics.append((name, f))
        return f

    return d


def load_cache():
    if "cache" not in g:
        try:
            with open(cache_path) as fh:
                g["cache"] = json.load(fh)
        except:
            g["cache"] = {}


def fetch(url):
    cache = g["cache"]
    if url in cache:
        return cache[url]
    print("fetching", url)
    data = requests.get(url).json()
    cache[url] = data
    with open(cache_path, "w") as fh:
        json.dump(cache, fh)
    return data


def get_matches(week):
    url = f"https://fantasy.espn.com/apis/v3/games/ffl/seasons/{year}/segments/0/leagues/{league_id}?view=mScoreboard&scoringPeriodId={week}"
    data = fetch(url)
    return filter(
        lambda match: "rosterForCurrentScoringPeriod" in match["away"],
        data["schedule"],
    )


def get_team_names():
    data = fetch(
        f"https://fantasy.espn.com/apis/v3/games/ffl/seasons/{year}/segments/0/leagues/{league_id}?view=mTeam"
    )
    return list(
        map(
            lambda team: f'{team["location"]} {team["nickname"]}',
            data["teams"],
        ), )


def get_points(raw_points):
    return round(raw_points, 2)


def is_bust(points, projected_points):
    return points < projected_points / 2


def brackets(obj):
    return f'[{obj}]'


def preload_matches(weeks):
    with concurrent.futures.ThreadPoolExecutor(len(weeks)) as executor:
        executor.map(
            lambda week: get_matches(week),
            weeks,
        )


def get_play_by_play(pro_team_id, week):
    return


def get_box_score(pro_team_id, week):
    return


###


# @metric_d()
def games_determined_by_discrete_scoring():
    weeks = range(1, 18)
    preload_matches(weeks)
    points = []
    team_names = get_team_names()
    for week in weeks:
        matches = get_matches(week)
        for match in matches:
            teams = []
            for team in sorted(
                [match["away"], match["home"]],
                    key=lambda team: team["totalPoints"],
            ):
                score = get_points(team["totalPoints"])
                superscore = score
                differences = []
                # DST
                started_dst = list(
                    filter(
                        lambda player: player["playerPoolEntry"]["player"][
                            "defaultPositionId"] == Positions.DST,
                        team["rosterForMatchupPeriod"]["entries"],
                    ))[0]
                pro_team_id = started_dst['playerPoolEntry']['player'][
                    'proTeamId']
                box_score = get_box_score(
                    pro_team_id,
                    week,
                )
                offense = [
                    team for team in box_score if team["id"] != pro_team_id
                ][0]
                yards = offense["passing"]["total"] + offense["rushing"][
                    "total"]
                continuous_points = 0
                discrete_points = 0
                if yards >= 550:
                    continuous_points += -6 - 1 * ((yards - 500) / 50)
                    discrete_points += -7
                elif yards >= 500:
                    continuous_points += -6 - 1 * ((yards - 500) / 50)
                    discrete_points += -6
                elif yards >= 450:
                    continuous_points += -5 - 1 * ((yards - 450) / 50)
                    discrete_points += -5
                elif yards >= 400:
                    continuous_points += -3 - 2 * ((yards - 400) / 50)
                    discrete_points += -3
                elif yards >= 350:
                    continuous_points += -1 - 2 * ((yards - 350) / 50)
                    discrete_points += -1
                elif yards >= 300:
                    continuous_points += 0 - 1 * ((yards - 300) / 50)
                    discrete_points += 0
                elif yards >= 200:
                    continuous_points += 2 - 2 * ((yards - 200) / 100)
                    discrete_points += 2
                elif yards >= 100:
                    continuous_points += 3 - 1 * ((yards - 100) / 100)
                    discrete_points += 3
                else:
                    continuous_points += 5 - 2 * ((yards) / 100)
                    discrete_points += 5
                score = offense["score"]
                if score >= 46:
                    continuous_points += -3 - 2 * ((score - 35) / 11)
                    discrete_points += -5
                elif score >= 35:
                    continuous_points += -3 - 2 * ((score - 35) / 11)
                    discrete_points += -3
                elif score >= 28:
                    continuous_points += -1 - 2 * ((score - 28) / 7)
                    discrete_points += -1
                elif score >= 14:
                    continuous_points += 1 - 2 * ((score - 14) / 14)
                    discrete_points += 1
                elif score >= 7:
                    continuous_points += 3 - 2 * ((score - 7) / 7)
                    discrete_points += 3
                elif score >= 1:
                    continuous_points += 4 - ((score - 1) / 6)
                    discrete_points += 4
                else:
                    continuous_points += 5
                    discrete_points += 5
                diff = continuous_points - discrete_points
                superscore += diff
                differences.append(
                    f'{started_kicker["playerPoolEntry"]["player"]["fullName"]} {diff}'
                )
                # K
                started_kicker = list(
                    filter(
                        lambda player: player["playerPoolEntry"]["player"][
                            "defaultPositionId"] == Positions.K,
                        team["rosterForMatchupPeriod"]["entries"],
                    ))[0]
                pro_team_id = started_kicker['playerPoolEntry']['player'][
                    'proTeamId']
                play_by_play = get_play_by_play(
                    pro_team_id,
                    week,
                )
                for drive in play_by_play:
                    if drive["outcome"] == "FIELD GOAL":
                        if drive["team"] == pro_team_id:
                            play = drive["plays"][-1]["message"]
                            prefix = play.split("Yd Field Goal")[0]
                            yards = int(prefix.split(" ")[-1])
                            continuous_points = yards / 10.
                            if yards >= 60:
                                discrete_points = 6
                            elif yards >= 50:
                                discrete_points = 5
                            elif yards >= 40:
                                discrete_points = 4
                            else:
                                discrete_points = 3
                            diff = continuous_points - discrete_points
                            superscore += diff
                            differences.append(
                                f'{started_kicker["playerPoolEntry"]["player"]["fullName"]} {diff}'
                            )
                #
                teams.append({
                    "name":
                    f'{team_names[team["teamId"] - 1]}: {score} ss {superscore}',
                    "differences": differences,
                    "score": score,
                    "superscore": superscore,
                })
            if teams[0]["superscore"] > teams[1]["superscore"]:
                points.append([
                    brackets(teams[0]["name"]),
                    "would have beaten",
                    brackets(teams[1]["name"]),
                    "week",
                    week,
                    "if K and DST used continuous scoring:",
                    '\t'.join(teams[0]["differences"]),
                    'vs',
                    '\t'.join(teams[1]["differences"]),
                ])
    return points


@metric_d()
def best_by_streaming_position():
    weeks = range(1, 18)
    preload_matches(weeks)
    points = []
    team_names = get_team_names()
    position_to_name = {
        Positions.QB: "QB",
        Positions.DST: "DST",
        Positions.K: "K"
    }
    for position in [Positions.QB, Positions.DST, Positions.K]:
        scores = collections.defaultdict(float)
        for week in weeks:
            matches = get_matches(week)
            for match in matches:
                for team in [match["away"], match["home"]]:
                    started_player = list(
                        filter(
                            lambda player: player["playerPoolEntry"]["player"][
                                "defaultPositionId"] == position,
                            team["rosterForMatchupPeriod"]["entries"],
                        ))[0]
                    scores[team["teamId"]] += started_player[
                        "playerPoolEntry"]["appliedStatTotal"]
        best_team_ids = sorted(
            scores.keys(),
            key=lambda team_id: -scores[team_id],
        )
        for team_id in best_team_ids:
            points.append([
                get_points(scores[team_id]),
                team_names[team_id - 1],
                position_to_name[position],
            ])
    return points


@metric_d()
def times_chosen_wrong():
    weeks = range(1, 14)
    preload_matches(weeks)
    points = []
    team_names = get_team_names()
    for week in weeks:
        matches = get_matches(week)
        for match in matches:
            raw_teams = sorted(
                [match["away"], match["home"]],
                key=lambda team: team["totalPoints"],
            )
            teams = []
            for team in raw_teams:
                score = team["totalPoints"]
                superscore = score
                better_starts = []
                better_starts_strings = []
                for choices in [
                    {
                        Positions.QB: 1
                    },
                    {
                        Positions.DST: 1
                    },
                    {
                        Positions.K: 1
                    },
                    {
                        Positions.RB: 2,
                        Positions.WR: 2,
                        Positions.TE: 1,
                        Positions.FLEX: 1,
                    },
                ]:
                    started_players = filter(
                        lambda player: player["playerPoolEntry"]["player"][
                            "defaultPositionId"] in choices,
                        team["rosterForMatchupPeriod"]["entries"],
                    )
                    started_ids = {
                        player["playerId"]:
                        player["playerPoolEntry"]["player"]["fullName"]
                        for player in started_players
                    }
                    best_players = sorted(
                        filter(
                            lambda player: player["playerPoolEntry"]["player"][
                                "defaultPositionId"] in choices,
                            team["rosterForCurrentScoringPeriod"]["entries"],
                        ),
                        key=lambda player: -player["playerPoolEntry"][
                            "appliedStatTotal"],
                    )
                    best_ids = {}
                    for position in choices:
                        if position == Positions.FLEX:
                            continue  # handle flex later
                        for _ in range(choices[position]):
                            best_id = list(
                                filter(
                                    lambda player: player["playerId"] not in
                                    best_ids and player["playerPoolEntry"][
                                        "player"]["defaultPositionId"
                                                  ] == position,
                                    best_players,
                                ))[0]["playerId"]
                            best_ids[best_id] = True
                    for _ in range(choices.get(Positions.FLEX, 0)):
                        best_flex_id = list(
                            filter(
                                lambda player_id: player_id not in best_ids,
                                map(
                                    lambda player: player["playerId"],
                                    best_players,
                                ),
                            ))[0]
                        best_ids[best_flex_id] = True
                    for id in list(started_ids.keys()):
                        if id in best_ids:
                            del best_ids[id]
                            del started_ids[id]
                    if best_ids:
                        players_by_id = {
                            player["playerId"]: player["playerPoolEntry"]
                            for player in best_players
                        }
                        best_starts = []
                        for id in best_ids:
                            best_player = players_by_id[id]
                            player_score = get_points(
                                best_player["appliedStatTotal"])
                            superscore += player_score
                            best_starts.append(
                                f'{best_player["player"]["fullName"]} {player_score}'
                            )
                        started_starts = []
                        for id in started_ids:
                            started_player = players_by_id[id]
                            player_score = get_points(
                                started_player["appliedStatTotal"])
                            superscore -= player_score
                            started_starts.append(
                                f'{started_player["player"]["fullName"]} {player_score}'
                            )
                        best_started_starts = [best_starts, started_starts]
                        better_starts.append(best_started_starts)
                        better_starts_strings.append(' / '.join(
                            map(
                                lambda starts: ",".join(starts),
                                best_started_starts,
                            ), ))
                score = get_points(score)
                superscore = get_points(superscore)
                teams.append({
                    "name":
                    f'{team_names[team["teamId"] - 1]}: {score} ss {superscore}',
                    "better_starts": better_starts,
                    "better_starts_strings": better_starts_strings,
                    "score": score,
                    "superscore": superscore,
                })
            if teams[0]["superscore"] > teams[1]["score"]:
                points.append([
                    get_points(teams[0]["superscore"] - teams[0]["score"]),
                    brackets(teams[0]["name"]),
                    "could have beaten",
                    brackets(teams[1]["name"]),
                    "week",
                    week,
                    "if they had started:",
                    '\t'.join(teams[0]["better_starts_strings"]),
                ])
    points.sort(reverse=True)
    return points


main()
