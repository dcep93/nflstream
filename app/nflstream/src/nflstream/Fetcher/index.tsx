import React from "react";
import { ScoreboardDataType } from "../Multiscreen/Scoreboard";

export type StreamType = {
  raw_url: string;
  name: string;
  stream_id: string;
  isStream: boolean;
  espnId?: number;
  leagueName?: string;
};

export type LogType = {
  gameId: number;
  timestamp: number;
  teams: { name: string; statistics: { [key: string]: string } }[];
  playByPlay: DriveType[];
  boxScore: BoxScoreType[];
  fantasyLog?: ScoreboardDataType | null;
};

export type DriveType = {
  team: string;
  description: string;
  score: string;
  result?: string;
  plays?: PlayType[];
  yardsToEndzone: number;
};

export type PlayType = {
  down: string;
  text: string;
  clock: string;
  distance: number;
};

export type BoxScoreType = {
  key: string;
  labels: string[];
  players?: { name: string; stats: string[] }[];
};

export type FantasyLogType = {
  playerManagers: { [playerName: string]: string };
};

export default abstract class Fetcher<T, U> extends React.Component<
  {
    handleResponse: (t: T) => void;
    payload: U;
  },
  { timeout: NodeJS.Timeout }
> {
  abstract getResponse(): Promise<T>;
  abstract intervalMs: number;

  run() {
    this.getResponse()
      .then(this.props.handleResponse)
      .catch((err) => console.error(err))
      .finally(() => {
        const timeout = setTimeout(this.run.bind(this), this.intervalMs);
        this.setState({ timeout });
      });
  }

  componentDidMount() {
    this.run();
  }

  componentWillUnmount() {
    clearTimeout(this.state?.timeout);
  }

  render() {
    return null;
  }
}

const cacheVersion = "1.0.2";
const cache: {
  [key: string]: Promise<{ timestamp: number; data: any; version: string }>;
} = {};
export function cacheF<T>(
  key: string,
  maxAgeMs: number,
  f: () => Promise<T>
): Promise<T> {
  const timestamp = new Date().getTime();
  var _cached = cache[key];
  if (!_cached) {
    const localCached = window.localStorage.getItem(key);
    if (localCached !== null) {
      _cached = Promise.resolve(JSON.parse(localCached));
    }
  }
  return (_cached || Promise.resolve(null)).then((cached) => {
    if (
      cached &&
      timestamp - cached!.timestamp < maxAgeMs &&
      cached!.version === cacheVersion
    ) {
      return Promise.resolve(cached.data as T);
    }
    const cacheF = f().then((data) => {
      cached = { timestamp, data, version: cacheVersion };
      cache[key] = Promise.resolve(cached);
      return cached;
    });
    const rval = cacheF.then((cached) => {
      const localCached = JSON.stringify(cached);
      if (maxAgeMs >= 0) {
        try {
          window.localStorage.setItem(key, localCached);
        } catch {}
      }
      return cached.data;
    });
    cache[key] = cacheF;
    return rval;
  });
}

export function parse(rawHtml: string): Document {
  return new DOMParser().parseFromString(rawHtml, "text/html");
}
