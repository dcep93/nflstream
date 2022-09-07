import React from "react";
import { LogType } from "../Fetcher";
import LogFetcher from "../Fetcher/LogFetcher";
import ofStyle from "./index.module.css";

const delayMs = 4 * 60 * 1000;

class Log extends React.Component<
  {
    espnId: string;
    updateDrivingTeam: (drivingTeam: string) => void;
    hidden: boolean;
  },
  { log: LogType }
> {
  render() {
    return (
      <div>
        <LogFetcher
          payload={this.props.espnId}
          handleResponse={(log) => this.setState({ log })}
        />
        <div className={ofStyle.logWrapper}>
          <DelayedLog
            log={this.state.log}
            updateDrivingTeam={this.props.updateDrivingTeam}
          />
        </div>
      </div>
    );
  }
}

class DelayedLog extends React.Component<
  { log: LogType; updateDrivingTeam: (drivingTeam: string) => void },
  { log: LogType }
> {
  componentDidUpdate() {
    setTimeout(() => this.updateNow(this.props.log), delayMs);
  }

  updateNow(log: LogType) {
    this.setState({ log });
    const drivingTeam = (log.playByPlay || [])[0]?.team;
    this.props.updateDrivingTeam(drivingTeam);
  }

  render() {
    return (
      <div
        onClick={() => {
          this.updateNow(this.props.log);
          // setTimeout(() => this.forceUpdate(), 100);
        }}
      >
        <SubLog log={this.state.log} />
      </div>
    );
  }
}

function SubLog(props: { log: LogType }) {
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

export default Log;
