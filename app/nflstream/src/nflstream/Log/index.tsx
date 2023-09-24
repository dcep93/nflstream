import React from "react";
import { LogType } from "../Fetcher";
import LogFetcher from "../Fetcher/LogFetcher";
import AutoScroller from "./Autoscroller";
import logStyle from "./index.module.css";

const delayMs = 2 * 60 * 1000;
const bigPlayWarningMs = 30 * 1000;
const bigPlayDurationMs = 5 * 1000;

class Log extends React.Component<
  {
    espnId: number;
    updateDrivingTeam: (drivingTeam: string) => void;
    updateRedzone: (redZone: boolean) => void;
    updateBigPlay: (isBigPlay: boolean) => void;
    isSelected: boolean;
  },
  { log: LogType }
> {
  render() {
    return (
      <>
        <LogFetcher
          payload={this.props.espnId}
          handleResponse={(log) => log && this.setState({ log })}
        />
        <DelayedLog
          log={this.state?.log}
          updateBigPlay={this.props.updateBigPlay}
          updateDrivingTeam={this.props.updateDrivingTeam}
          updateRedzone={this.props.updateRedzone}
          isSelected={this.props.isSelected}
        />
      </>
    );
  }
}

type PropsType = {
  isSelected: boolean;
  log: LogType;
  updateBigPlay: (isBigPlay: boolean) => void;
  updateDrivingTeam: (drivingTeam: string) => void;
  updateRedzone: (redZone: boolean) => void;
};
class DelayedLog extends React.Component<PropsType, { log: LogType }> {
  componentDidUpdate(prevProps: PropsType) {
    if (this.isBigPlay()) {
      setTimeout(() => {
        this.props.updateBigPlay(true);
        setTimeout(() => this.props.updateBigPlay(false), bigPlayDurationMs);
      }, delayMs - bigPlayWarningMs);
    }
    setTimeout(() => this.updateNow(this.props.log), delayMs);
  }

  isBigPlay(): boolean {
    const play = ((this.props.log?.playByPlay || [])[0]?.plays || [])[0];
    if (!play) return false;
    if (
      play.down?.startsWith("4th") &&
      !play.text.includes("field goal") &&
      !play.text.includes("punts")
    ) {
      return true;
    }
    if (play.distance <= -10 || play.distance > 20) {
      return true;
    }
    return (
      ["TOUCHDOWN", "FUMBLE", "INTERCEPT", "injure"].find((text) =>
        play.text.includes(text)
      ) !== undefined
    );
  }

  updateNow(log: LogType) {
    this.setState({ log });
    const playByPlay = log?.playByPlay || [];
    const drive = ["Q2 0:00", "Q4 0:00"].includes(
      (playByPlay[0]?.plays || [])[0]?.clock
    )
      ? undefined
      : playByPlay[0]?.result === undefined
      ? playByPlay[0]
      : playByPlay[1];
    const drivingTeam = drive?.team;
    this.props.updateDrivingTeam(drivingTeam || "");
    const redZone = drive === undefined ? false : drive.yardsToEndzone <= 20;
    this.props.updateRedzone(redZone);
  }

  render() {
    return !this.props.isSelected ? null : (
      <div
        className={logStyle.logWrapper}
        onClick={(e) => {
          e.metaKey
            ? window.open(
                `https://www.espn.com/nfl/game?gameId=${this.props.log.gameId}`
              )
            : this.updateNow(this.props.log);
        }}
      >
        <SubLog log={this.state?.log} />
      </div>
    );
  }
}

function SubLog(props: { log: LogType }) {
  if (!props.log) return null;
  const playByPlay = props.log.playByPlay || [];
  if (
    playByPlay.length > 1 &&
    playByPlay[0].description === playByPlay[1].description
  ) {
    playByPlay.shift();
  }
  return (
    <div className={logStyle.log}>
      <div className={logStyle.logContent}>
        <div>{new Date(props.log.timestamp).toLocaleTimeString()}</div>
        {(playByPlay || []).map((drive, i) => (
          <div key={i}>
            <div className={logStyle.logHeader}>
              <div>
                {drive.team}: {drive.result || "*"}
              </div>
              <div>{drive.description}</div>
              <div>{drive.score}</div>
            </div>
            <div>
              {(drive.plays || []).map((play, j) => (
                <div key={j} className={logStyle.playByPlayContent}>
                  <div>{play.down}</div>
                  <div>{play.clock}</div>
                  <div>{play.text}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className={logStyle.logContent}>
        <AutoScroller speed={10}>
          <>
            {(props.log.boxScore || []).map((boxScore, i) => (
              <div key={i} className={logStyle.boxScore}>
                <div className={logStyle.logHeader}>{boxScore.key}</div>
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
                        <td
                          style={{
                            width: "8em",
                            overflow: "hidden",
                            display: "inline-block",
                          }}
                        >
                          {player.name}
                        </td>
                        {player.stats.map((stat, j) => (
                          <td key={j}>{stat}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </>
        </AutoScroller>
      </div>
    </div>
  );
}

export default Log;
