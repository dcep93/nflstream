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

function Fetcher(props: { setNflStream: (nflStream: NFLStreamType) => void }) {
  return (
    <div style={{ height: 0 }}>
      <iframe
        title="fetcher"
        srcDoc={`<script>(${script.toString()})()</script>`}
      ></iframe>
    </div>
  );
}

const script = () => {
  fetch("https://reddit.nflbite.com/")
    .then((resp) => resp.text())
    .then(console.log);
};

export default Fetcher;
