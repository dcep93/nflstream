import React from "react";

export type StreamType = {
  url: string;
  name: string;
  espnId: string;
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

export default abstract class Fetcher<T, U = undefined> extends React.Component<
  {
    handleResponse: (t: T) => void;
    payload?: U;
  },
  { timeout: NodeJS.Timeout }
> {
  abstract getResponse(): Promise<T>;
  abstract intervalMs: number;

  run() {
    this.getResponse()
      .then(this.props.handleResponse)
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

export function fetchP(url: string): Promise<Response> {
  return fetch(url);
}

export function parse(rawHtml: string): Document {
  return new DOMParser().parseFromString(rawHtml, "text/html");
}
