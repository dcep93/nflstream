import concurrent.futures

metrics = []


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
        for point in points:
            print(point)


def metric_d(name, number=0):
    def d(f):
        metrics.append((name, f, number))
        return f

    return d


###


@metric_d("times chosen wrong")
def times_chosen_wrong():
    return [1, 2, 3]


main()
