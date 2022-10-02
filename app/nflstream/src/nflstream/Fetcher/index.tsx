import React from "react";

export type StreamType = {
  url: string;
  name: string;
  espnId?: string;
};

export type LogType = {
  timestamp: number;
  playByPlay: DriveType[];
  boxScore: BoxScoreType[];
};

export type DriveType = {
  team: string;
  description: string;
  score: string;
  result?: string;
  plays?: { down: string; text: string; clock: string }[];
};

export type BoxScoreType = {
  key: string;
  labels: string[];
  players?: { name: string; stats: string[] }[];
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
    console.log("run", this.props.payload);
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
    clearTimeout(this.state.timeout);
  }

  render() {
    return null;
  }
}

const cache: { [key: string]: { timestamp: number; data: any } } = {};
export function cacheF<T>(
  key: string,
  maxAgeMs: number,
  f: () => Promise<T>
): Promise<T> {
  const cached = cache[key];
  const timestamp = new Date().getTime();
  if (cached && timestamp - cached!.timestamp < maxAgeMs)
    return Promise.resolve(cached.data as T);
  return f().then((data) => {
    cache[key] = { timestamp, data };
    return data;
  });
}

export function parse(rawHtml: string): Document {
  return new DOMParser().parseFromString(rawHtml, "text/html");
}
