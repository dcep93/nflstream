import Fetcher, { StreamType } from ".";
import ClapprDriver from "../Drivers/ClapprDriver";
import { fetchE } from "./LogFetcher";

export const HOST = "icrackstreams.app";
export const DRIVER = ClapprDriver;

export default class StreamsFetcher extends Fetcher<StreamType[], null> {
  intervalMs = 10 * 60 * 1000;

  getResponse(_maxAgeMs: number | null = null) {
    const maxAgeMs = _maxAgeMs !== null ? _maxAgeMs : 10 * 60 * 1000;
    return Promise.resolve()
      .then(() => ["nfl", "college-football"])
      .then((leagueScheduleUrls) =>
        leagueScheduleUrls.map((leagueName) =>
          fetchE(
            `https://www.espn.com/${leagueName}/schedule`,
            maxAgeMs,
            undefined,
            (text) =>
              Promise.resolve(text)
                .then(
                  (text) =>
                    text.match(
                      /(?<=window\['__espnfitt__'\]=).*(?=;<\/script>)/
                    )![0]
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
                        leagueName,
                        startTime: new Date(e.date).getTime(),
                        state: e.status.state,
                        espnId: parseInt(e.id),
                        teams: e.teams.map((t) => t.shortName).reverse(),
                      }))
                    )
                )
          )
        )
      )
      .then((ps) => Promise.all(ps))
      .then((arrs) => arrs.flatMap((arr) => arr))
      .then((games) => DRIVER.includeSpecialStreams(games))
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
            leagueName: game.leagueName,
            raw_url: "",
          }))
          .map((stream) =>
            DRIVER.getRawUrl(stream)
              .then((raw_url) => ({ ...stream, raw_url }))
              .then((stream) => {
                // fetch async, dont wait
                DRIVER.getHostParams(stream, false);
                return stream;
              })
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
