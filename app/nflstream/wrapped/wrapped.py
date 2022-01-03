import concurrent.futures

import json
import requests

league_id = 203836968

cache_path = "cache.json"

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
                print(point)
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


###

weeks = range(1, 14)


@metric_d("times chosen wrong")
def times_chosen_wrong():
    points = []
    for week in weeks:
        url = f"https://fantasy.espn.com/apis/v3/games/ffl/seasons/2021/segments/0/leagues/{league_id}?view=mScoreboard&scoringPeriodId={week}"
        data = fetch(url)
        matches = [
            i for i in data['schedule']
            if 'rosterForCurrentScoringPeriod' in i['away']
        ]
        for match in matches:
            pass
    return points


main()
