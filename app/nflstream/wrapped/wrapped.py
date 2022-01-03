import concurrent.futures

import collections
import json
import requests

joiner = " "

league_id = 203836968

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
    with concurrent.futures.ThreadPoolExecutor(len(metrics)) as executor:
        fetched_metrics = executor.map(
            lambda metric: (metric, metric[2]()),
            metrics,
        )
    for metric in fetched_metrics:
        print(metric[0][0])
        number = metric[0][1]
        points = metric[1]
        points.sort(reverse=True)
        if number > 0:
            points = points[:number]
        if points:
            for point in points:
                print(joiner.join(map(str, point)))
        else:
            print("no points")
        print()


def metric_d(number=0):
    def d(f):
        name = f.__name__
        metrics.append((name, number, f))
        return f

    return d


def fetch(url):
    if "cache" not in g:
        with open(cache_path) as fh:
            try:
                g["cache"] = json.load(fh)
            except:
                g["cache"] = {}
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
    url = f"https://fantasy.espn.com/apis/v3/games/ffl/seasons/2021/segments/0/leagues/{league_id}?view=mScoreboard&scoringPeriodId={week}"
    data = fetch(url)
    return filter(
        lambda match: "rosterForCurrentScoringPeriod" in match["away"],
        data["schedule"],
    )


def get_team_names():
    data = fetch(
        f"https://fantasy.espn.com/apis/v3/games/ffl/seasons/2021/segments/0/leagues/{league_id}?view=mTeam"
    )
    return list(
        map(
            lambda team: f'{team["location"]} {team["nickname"]}',
            data["teams"],
        ), )


def get_points(raw_points):
    return round(raw_points, 2)


###


@metric_d()
def best_by_streaming_position():
    points = []
    team_names = get_team_names()
    for position in [Positions.QB, Positions.DST, Positions.K]:
        scores = collections.defaultdict(float)
        for week in range(1, 18):
            matches = get_matches(week)
            for match in matches:
                for team in [match["away"], match["home"]]:
                    pass
    return points


@metric_d()
def times_chosen_wrong():
    points = []
    team_names = get_team_names()
    for week in range(1, 14):
        matches = get_matches(week)
        for match in matches:
            raw_teams = sorted(
                [match["away"], match["home"]],
                key=lambda team: team["totalPoints"],
            )
            teams = []
            for team in raw_teams:
                score = get_points(team["totalPoints"])
                superscore = get_points(team["totalPoints"])
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
                    f'[{teams[0]["name"]}]',
                    "could have beaten",
                    f'[{teams[1]["name"]}]',
                    "week",
                    week,
                    "if they had started:",
                    '\t'.join(teams[0]["better_starts_strings"]),
                ])
    return points


main()
