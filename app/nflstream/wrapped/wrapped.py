import concurrent.futures

import json
import requests

league_id = 203836968

cache_path = "cache.json"


class Positions:
    QB = 1
    RB = 2
    WR = 3
    TE = 4
    K = 5
    DST = 16


metrics = []

g = {}


def main():
    with concurrent.futures.ThreadPoolExecutor(len(metrics)) as executor:
        fetched_metrics = executor.map(
            lambda metric: (metric, metric[1]()),
            metrics,
        )
    for metric in fetched_metrics:
        print(metric[0][0])
        points = metric[1]
        points.sort(reverse=True)
        number = metric[0][2]
        if number > 0:
            points = points[:number]
        if points:
            for point in points:
                print(f"{point[0]} {point[1]}")
        else:
            print("no points")
        print()


def metric_d(name, number=0):
    def d(f):
        metrics.append((name, f, number))
        return f

    return d


def fetch(url):
    if "cache" not in g:
        with open(cache_path) as fh:
            try:
                g['cache'] = json.load(fh)
            except:
                g['cache'] = {}
    cache = g['cache']
    if url in cache:
        return cache[url]
    print(f"fetching {url}")
    data = requests.get(url).json()
    cache[url] = data
    with open(cache_path, "w") as fh:
        json.dump(cache, fh)
    return data


def get_matches(week):
    url = f"https://fantasy.espn.com/apis/v3/games/ffl/seasons/2021/segments/0/leagues/{league_id}?view=mScoreboard&scoringPeriodId={week}"
    data = fetch(url)
    return [
        i for i in data['schedule']
        if 'rosterForCurrentScoringPeriod' in i['away']
    ]


def get_team_names():
    data = fetch(
        f"https://fantasy.espn.com/apis/v3/games/ffl/seasons/2021/segments/0/leagues/{league_id}?view=mTeam"
    )
    return [f"{i['location']} {i['nickname']}" for i in data["teams"]]


def get_points(raw_points):
    return round(raw_points, 2)


###


@metric_d("times chosen wrong")
def times_chosen_wrong():
    points = []
    for week in range(1, 14):
        matches = get_matches(week)
        for match in matches:
            raw_teams = sorted([i for i in [match["away"], match["home"]]],
                               key=lambda i: i["totalPoints"])
            teams = []
            for i in raw_teams:
                score = i['totalPoints']
                superscore = i['totalPoints']
                starts = []
                for position in [Positions.QB, Positions.DST, Positions.K]:
                    started_player = [
                        j for j in i['rosterForMatchupPeriod']["entries"]
                        if j["playerPoolEntry"]["player"]["defaultPositionId"]
                        == position
                    ][0]["playerPoolEntry"]
                    best_player = sorted(
                        [
                            j for j in i['rosterForCurrentScoringPeriod']
                            ["entries"] if j["playerPoolEntry"]["player"]
                            ["defaultPositionId"] == position
                        ],
                        key=lambda j: -(j["playerPoolEntry"][
                            "appliedStatTotal"]))[0]["playerPoolEntry"]
                    if started_player["id"] != best_player["id"]:
                        superscore += best_player[
                            "appliedStatTotal"] - started_player[
                                "appliedStatTotal"]
                        starts.append(
                            f"[{best_player['player']['fullName']} {get_points(best_player['appliedStatTotal'])} / {started_player['player']['fullName']} {get_points(started_player['appliedStatTotal'])}]"
                        )
                # WRT
                started_flexes = [
                    j for j in i['rosterForMatchupPeriod']["entries"]
                    if j["playerPoolEntry"]["player"]["defaultPositionId"] in
                    [Positions.RB, Positions.WR, Positions.TE]
                ]
                started_ids = {j["playerId"]: True for j in started_flexes}
                best_flexes = [
                    j for j in i['rosterForCurrentScoringPeriod']["entries"]
                    if j["playerPoolEntry"]["player"]["defaultPositionId"] in
                    [Positions.RB, Positions.WR, Positions.TE]
                ]
                best_ids = []
                for position in [
                        Positions.WR, Positions.WR, Positions.RB, Positions.RB,
                        Positions.TE
                ]:
                    best_flex_id = list(
                        filter(
                            lambda j: j["playerId"] not in best_ids and
                            j["playerPoolEntry"]["player"]["defaultPositionId"
                                                           ] == position,
                            best_flexes,
                        ))[0]["playerId"]
                    if best_flex_id in started_ids:
                        del started_ids[best_flex_id]
                    else:
                        best_ids.append(best_flex_id)
                best_flex_id = list(
                    filter(
                        lambda j: j["playerId"] not in best_ids,
                        best_flexes,
                    ))[0]["playerId"]
                if best_flex_id in started_ids:
                    del started_ids[best_flex_id]
                else:
                    best_ids.append(best_flex_id)
                if best_ids:
                    best_starts = []
                    for id in best_ids:
                        best_player = list(
                            filter(
                                lambda j: j["playerId"] == id,
                                best_flexes,
                            ))[0]['playerPoolEntry']
                        best_starts.append(
                            f"{best_player['player']['fullName']} {get_points(best_player['appliedStatTotal'])}"
                        )
                        superscore += best_player["appliedStatTotal"]
                    started_starts = []
                    for id in started_ids:
                        started_player = list(
                            filter(
                                lambda j: j["playerId"] == id,
                                best_flexes,
                            ))[0]['playerPoolEntry']
                        started_starts.append(
                            f"{started_player['player']['fullName']} {get_points(started_player['appliedStatTotal'])}"
                        )
                        superscore -= started_player["appliedStatTotal"]
                    starts.append(
                        f"[{','.join(best_starts)} / {','.join(started_starts)}]"
                    )
                #

                desc = f"{get_team_names()[i['teamId']-1]} {score} (ss {get_points(superscore)})"
                teams.append(
                    [desc, starts,
                     get_points(score),
                     get_points(superscore)])
            if teams[0][3] > teams[1][2]:
                points.append([
                    get_points(teams[0][3] - teams[0][2]),
                    f"[{teams[0][0]}] could have beaten [{teams[1][0]}] week {week} if they had started: {','.join(teams[0][1])}"
                ])
    return points


main()
