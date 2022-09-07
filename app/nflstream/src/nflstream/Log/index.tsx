import React from "react";
import { LogType } from "../Fetcher";
import { delayedLogComponent } from "./DelayedLog";
import { default as ofStyle } from "./index.module.css";

class LogWrapper extends React.Component<{
  espnId: string;
  updateDrivingTeam: (drivingTeam: string) => void;
  hidden: boolean;
}> {
  // const drive = ((
  //   (delayedLogComponent?.state?.logs || []).find(
  //     (l) => l.name === props.screen.name
  //   ) || {}
  // ).playByPlay || [])[0];
  render() {
    const log = (delayedLogComponent?.state?.logs || []).find(
      (l) => l.name === this.props.name
    );
    return (
      <div
        className={ofStyle.logWrapper}
        onClick={() => {
          delayedLogComponent.updateNow();
          setTimeout(() => this.forceUpdate(), 100);
        }}
      >
        <Log log={log || undefined} />
      </div>
    );
  }
}

function Log(props: { log: LogType | undefined }) {
  if (props.log === undefined) return null;
  const playByPlay = props.log.playByPlay || [];
  if (
    playByPlay.length > 1 &&
    playByPlay[0].description === playByPlay[1].description
  ) {
    playByPlay.shift();
  }
  return (
    <div className={ofStyle.log}>
      <div className={ofStyle.logContent}>
        <div>{new Date(props.log.timestamp).toLocaleTimeString()}</div>
        {(playByPlay || []).map((drive, i) => (
          <div key={i}>
            <div className={ofStyle.logHeader}>
              <div>
                {drive.team}: {drive.result || "*"}
              </div>
              <div>{drive.description}</div>
              <div>{drive.score}</div>
            </div>
            <div>
              {(drive.plays || []).map((play, j) => (
                <div key={j} className={ofStyle.playByPlayContent}>
                  <div>{play.down}</div>
                  <div>{play.clock}</div>
                  <div>{play.text}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className={ofStyle.logContent}>
        {(props.log.boxScore || []).map((boxScore, i) => (
          <div key={i} className={ofStyle.boxScore}>
            <div className={ofStyle.logHeader}>{boxScore.key}</div>
            <table>
              <thead>
                <tr>
                  <th></th>
                  {boxScore.labels.map((label, j) => (
                    <th key={j}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(boxScore.players || []).map((player, j) => (
                  <tr key={j}>
                    <td>{player.name}</td>
                    {player.stats.map((stat, j) => (
                      <td key={j}>{stat}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LogWrapper;
