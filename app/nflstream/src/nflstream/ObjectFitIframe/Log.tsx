import React from "react";
import { LogType } from "../../firebase";
import { default as ofStyle } from "./index.module.css";

function LogWrapper(props: { log: LogType | null | undefined }) {
  // if (props.log === null) return null;
  // return (
  //   <div className={ofStyle.logWrapper}>
  //     <Log log={props.log} />
  //   </div>
  // );
  return null;
}

function Log(props: { log: LogType | undefined }) {
  if (props.log === undefined) return null;
  return (
    <div className={ofStyle.log}>
      <div className={ofStyle.logContent}>
        {(props.log.playByPlay || []).map((drive, i) => (
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
