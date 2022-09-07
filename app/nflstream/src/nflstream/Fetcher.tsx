import React from "react";

export type StreamType = {
  url: string;
  name: string;
  espnId: string;
};

export type LogType = {
  timestamp: number;
  playByPlay?: DriveType[];
  boxScore?: BoxScoreType[];
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

abstract class Fetcher<T, U = undefined> extends React.Component<{
  handleResponse: (t: T) => void;
  payload?: U;
}> {
  abstract getResponse(): Promise<T>;
}

export class StreamsFetcher extends Fetcher<StreamType[]> {
  getResponse() {
    return Promise.resolve([]);
  }
}

export class LogFetcher extends Fetcher<LogType, string> {
  getResponse() {
    return Promise.resolve({ timestamp: Date.now() });
  }
}
