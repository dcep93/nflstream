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
  timestamp: number;
  other?: StreamType[];
  streams?: StreamType[];
};

export type StreamType = {
  url: string;
  name: string;
  log?: LogType;
};

export type LogType = {
  playByPlay?: DriveType[];
  boxScore?: PlayByPlayType[];
} | null;

export type DriveType = {
  team: string;
  result?: string;
  description: string;
  plays: { down: string; text: string; clock: string }[];
};

export type PlayByPlayType = {
  key: string;
  labels: string[];
  players: { name: string; stats: string[] };
};

function connect(f: (nflStream: NFLStreamType) => void) {
  firebase._connect(`/`, (val) => f(val || {}));
}

function updateNFLStream(nflStream: NFLStreamType) {
  firebase._set(`/`, nflStream);
}

const ex = {
  connect,
  updateNFLStream,
};

export default ex;
