import React from "react";
import { LogType } from "../../firebase";
import { default as ofStyle } from "./index.module.css";

class LogWrapper extends React.Component<{ log: LogType }> {
  componentDidUpdate() {
    setTimeout(
      () => logComponent.setState({ log: this.props.log }),
      2 * 60 * 1000
    );
  }

  render() {
    return (
      <div className={ofStyle.logWrapper}>
        <Log />
      </div>
    );
  }
}

var logComponent: Log;
class Log extends React.Component<{}, { log: LogType }> {
  componentDidMount() {
    const oldComponent = logComponent;
    logComponent = this;
    if (oldComponent) {
      this.setState(oldComponent.state);
    }
  }

  render() {
    if (this.state === undefined) return null;
    return (
      <div className={ofStyle.log}>
        <div className={ofStyle.logContent}>
          {(this.state.log.playByPlay || []).map((drive, i) => (
            <div key={i}>
              <div className={ofStyle.logHeader}>
                <div>
                  {drive.team} {drive.result}
                </div>
                <div>{drive.description}</div>
              </div>
              <div>
                {(drive.plays || []).map((play, j) => (
                  <div key={j} className={ofStyle.playByPlayContent}>
                    <div>
                      {play.down} {play.clock}
                    </div>
                    <div>{play.text}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className={ofStyle.logContent}>
          {(this.state.log.boxScore || []).map((boxScore, i) => (
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
}

export default LogWrapper;
