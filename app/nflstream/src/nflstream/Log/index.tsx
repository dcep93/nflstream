import React from "react";
import { LogType, PlayType } from "../Fetcher";
import LogFetcher from "../Fetcher/LogFetcher";
import { logDelayRef } from "../etc/Options";
import AutoScroller from "./Autoscroller";
import logStyle from "./index.module.css";

const bigPlayDurationMs = 5 * 1000;
const bigPlayWarningMs = 40 * 1000;
export const defaultLogDelayMs = bigPlayWarningMs; // 0 * 60 * 1000;

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
export class DelayedLog extends React.Component<
  PropsType,
  { log: LogType; bigPlay: string }
> {
  static active: DelayedLog | undefined;
  static updateTimeout: ReturnType<typeof setTimeout> | undefined;
  componentDidUpdate(prevProps: PropsType) {
    if (JSON.stringify(this.props) === JSON.stringify(prevProps)) return;
    const play = (this.props.log?.playByPlay || [])[0]?.plays?.[0];
    const delayMs = getLogDelayMs();
    if (play) {
      const bigPlayRaw = this.getBigPlay(play);
      if (bigPlayRaw !== null) {
        const bigPlay = `${play.clock} : ${bigPlayRaw}`;
        if (this.state?.bigPlay !== bigPlay) {
          this.setState({ bigPlay });
          setTimeout(() => {
            this.props.updateBigPlay(true);
            setTimeout(
              () => this.props.updateBigPlay(false),
              bigPlayDurationMs
            );
          }, Math.max(0, delayMs - bigPlayWarningMs));
        }
      }
    }
    const props = this.props;
    DelayedLog.updateTimeout = setTimeout(() => {
      this.updateNow(props.log);
    }, delayMs);
  }

  getBigPlay(play: PlayType): string | null {
    if (play.text.includes("touchback")) return null;
    if (play.text.includes("block")) return "block";
    if (play.text.includes("field goal")) {
      return play.distance >= 60 ? "field_goal" : null;
    }
    if (play.text.includes("kicks")) {
      return play.distance >= 70 ? "kicks" : null;
    }
    if (play.text.includes("punts")) {
      return play.distance >= 40 ? "punts" : null;
    }
    if (
      play.down?.startsWith("4th") &&
      !play.text.includes("field goal") &&
      !play.text.includes("No Play")
    ) {
      return "4th_down";
    }
    if (play.text.includes("Intentional Grounding")) {
      return null;
    }
    if (play.distance <= -11 || play.distance >= 25) {
      return "distance";
    }
    return [
      "TOUCHDOWN",
      "FUMBLE",
      "INTERCEPT",
      "MUFF",
      "SAFETY",
      "recover",
      // "injure",
    ].find((text) => play.text.includes(text)) !== undefined
      ? "super_big_play"
      : null;
  }

  updateNow(log: LogType | undefined = undefined) {
    if (!log) log = this.props.log;
    if (log?.timestamp < this.state?.log?.timestamp) return;
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
    const redZone =
      drive === undefined
        ? false
        : drive.result === undefined && drive.yardsToEndzone <= 20;
    this.props.updateRedzone(redZone);
  }

  onClick() {
    clearTimeout(DelayedLog.updateTimeout);
    this.updateNow(this.props.log);
  }

  render() {
    if (!this.props.isSelected) return null;
    DelayedLog.active = this;
    return (
      <div
        className={logStyle.logWrapper}
        onClick={(e) => {
          e.metaKey
            ? window.open(
                `https://www.espn.com/nfl/game?gameId=${this.props.log.gameId}`
              )
            : this.onClick();
        }}
      >
        <SubLog log={this.state?.log} bigPlay={this.state?.bigPlay} />
      </div>
    );
  }
}

function SubLog(props: { log: LogType; bigPlay: string }) {
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
      <div className={logStyle.logContent} style={{ height: "64%" }}>
        <div>
          <span>{new Date(props.log.timestamp).toLocaleTimeString()}</span>{" "}
          <span>[bigplay: {props.bigPlay}]</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {props.log.teams.map((t) => (
            <span key={t.name} title={JSON.stringify(t.statistics, null, 2)}>
              {t.name} - {t.statistics.possessionTime}={t.statistics.totalYards}
              /{t.statistics.totalOffensivePlays}
            </span>
          ))}
        </div>
        <div style={{ height: "1em" }}></div>
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
                  {
                    <div>
                      <div>{play.down}</div>
                      <div>{play.clock}</div>
                      <div>{play.text}</div>
                    </div>
                  }
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className={logStyle.logContent} style={{ height: "34%" }}>
        <AutoScroller speed={0.1}>
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

export function getLogDelayMs() {
  return parseInt(logDelayRef.current?.value || "") || defaultLogDelayMs;
}

export default Log;
