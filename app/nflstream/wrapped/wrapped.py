import concurrent.futures

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


metrics = []

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


def metric_d(name, number=0):
    def d(f):
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
        lambda i: "rosterForCurrentScoringPeriod" in i["away"],
        data["schedule"],
    )


def get_team_names():
    data = fetch(
        f"https://fantasy.espn.com/apis/v3/games/ffl/seasons/2021/segments/0/leagues/{league_id}?view=mTeam"
    )
    return [f'{i["location"]} {i["nickname"]}' for i in data["teams"]]


def get_points(raw_points):
    return round(raw_points, 2)


###


@metric_d("times chosen wrong")
def times_chosen_wrong():
    points = []
    team_names = get_team_names()
    for week in range(1, 14):
        matches = get_matches(week)
        for match in matches:
            raw_teams = sorted(
                [match["away"], match["home"]],
                key=lambda i: i["totalPoints"],
            )
            teams = []
            for i in raw_teams:
                score = get_points(i["totalPoints"])
                superscore = get_points(i["totalPoints"])
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
                        lambda j: j["playerPoolEntry"]["player"][
                            "defaultPositionId"] in choices,
                        i["rosterForMatchupPeriod"]["entries"],
                    )
                    started_ids = {
                        j["playerId"]:
                        j["playerPoolEntry"]["player"]["fullName"]
                        for j in started_players
                    }
                    best_players = sorted(
                        filter(
                            lambda j: j["playerPoolEntry"]["player"][
                                "defaultPositionId"] in choices,
                            i["rosterForCurrentScoringPeriod"]["entries"],
                        ),
                        key=lambda j: -j["playerPoolEntry"]["appliedStatTotal"
                                                            ],
                    )
                    best_ids = {}
                    for position in choices:
                        if position == Positions.FLEX:
                            continue  # handle flex later
                        for _ in range(choices[position]):
                            best_id = list(
                                filter(
                                    lambda j: j["playerId"] not in best_ids and
                                    j["playerPoolEntry"]["player"][
                                        "defaultPositionId"] == position,
                                    best_players,
                                ))[0]["playerId"]
                            best_ids[best_id] = True
                    for _ in range(choices.get(Positions.FLEX, 0)):
                        best_flex_id = list(
                            filter(
                                lambda j: j not in best_ids,
                                map(
                                    lambda j: j["playerId"],
                                    best_players,
                                ),
                            ))[0]
                        best_ids[best_flex_id] = True
                    for id in list(started_ids.keys()):
                        if id in best_ids:
                            del best_ids[id]
                            del started_ids[id]
                    if best_ids:
                        best_starts = []
                        for id in best_ids:
                            best_player = list(
                                filter(
                                    lambda j: j["playerId"] == id,
                                    best_players,
                                ))[0]["playerPoolEntry"]
                            player_score = get_points(
                                best_player["appliedStatTotal"])
                            superscore += player_score
                            best_starts.append(
                                f'{best_player["player"]["fullName"]} {player_score}'
                            )
                        started_starts = []
                        for id in started_ids:
                            started_player = list(
                                filter(
                                    lambda j: j["playerId"] == id,
                                    best_players,
                                ))[0]["playerPoolEntry"]
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
                    f'{team_names[i["teamId"] - 1]}: {score} ss {superscore}',
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
                    ','.join(teams[0]["better_starts_strings"]),
                ])
    return points


main()
