import firebase from "./firebase";

declare global {
  interface Window {
    firebaseinitialized: boolean;
  }
}
window.firebaseinitialized = false;
if (!window.firebaseinitialized) {
  window.firebaseinitialized = true;
  // set userAgent to Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1
  firebase._init();
}

export type NFLStreamType = {
  other?: StreamType[];
  streams?: StreamType[];
  version: string;
};

export type StreamType = {
  url: string;
  name: string;
};

export type LogType = {
  id: string;
  name: string;
  timestamp: string;
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

function connect(f: (nflStream: NFLStreamType) => void) {
  firebase._connect(`/`, (val) => f(val || {}));
}

function updateNFLStream(nflStream: NFLStreamType) {
  firebase._set(`/`, nflStream);
}

function updateStreams(streams: StreamType[]) {
  firebase._set(`/streams`, streams);
}

const ex = {
  connect,
  updateNFLStream,
  updateStreams,
};

export default ex;
