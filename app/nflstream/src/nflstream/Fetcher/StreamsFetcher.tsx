import Fetcher, { StreamType } from ".";
import ClapprDriver from "../Drivers/ClapprDriver";
import { fetchE } from "./LogFetcher";

export const HOST_STORAGE_KEY = "host.v2";
export const ACTIVE_HOST = "icrackstreams.app";
export const HOST = localStorage.getItem(HOST_STORAGE_KEY)!;
export const DRIVER = ClapprDriver;

export default class StreamsFetcher extends Fetcher<StreamType[], null> {
  intervalMs = 10 * 60 * 1000;

  getResponse(_maxAgeMs: number | null = null) {
    const maxAgeMs = _maxAgeMs !== null ? _maxAgeMs : 10 * 60 * 1000;
    return fetchE(
      "https://www.espn.com/nfl/schedule",
      maxAgeMs,
      undefined,
      (text) =>
        Promise.resolve(text)
          .then(
            (text) =>
              text.match(/(?<=window\['__espnfitt__'\]=).*(?=;<\/script>)/)![0]
          )
          .then(JSON.parse)
          .then(
            (o: {
              page: {
                content: {
                  events: {
                    [date: string]: {
                      id: string;
                      teams: { shortName: string }[];
                      date: string;
                      status: { state: "in" | "pre" | "post" };
                    }[];
                  };
                };
              };
            }) =>
              Object.values(o.page.content.events).flatMap((es) =>
                es.map((e) => ({
                  startTime: new Date(e.date).getTime(),
                  state: e.status.state,
                  espnId: parseInt(e.id),
                  teams: e.teams.map((t) => t.shortName).reverse(),
                }))
              )
          )
    )
      .then((games) =>
        !DRIVER.includeSpecialStreams
          ? games
          : DRIVER.includeSpecialStreams(games)
      )
      .then((games) =>
        games
          .filter(
            (game) =>
              !game.espnId ||
              game.state === "in" ||
              (game.state === "pre" &&
                game.startTime - Date.now() < 1000 * 60 * 60) ||
              (game.state === "post" &&
                game.startTime - Date.now() > 1000 * 60 * 60 * 3)
          )
          .map((game) => ({
            name: game.teams.join(" @ "),
            stream_id: game.teams[1].toLowerCase(),
            isStream: true,
            espnId: game.espnId,
          }))
          .map((stream) => ({
            ...stream,
            raw_url: DRIVER.getRawUrl(stream.stream_id),
          }))
          .map((stream) =>
            DRIVER.getHostParams(stream, false)
              .then(() => stream)
              .catch((err) => {
                console.error(err);
                return null as any as StreamType;
              })
          )
      )
      .then((ps) => Promise.all(ps))
      .then((streams) => streams.filter(Boolean))
      .catch((err) => {
        console.error(err);
        return [
          {
            raw_url: "",
            name: err.toString(),
            stream_id: "ERROR",
            isStream: false,
          },
        ];
      });
  }
}
