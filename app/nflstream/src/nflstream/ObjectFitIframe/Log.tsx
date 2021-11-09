import React from "react";
import { LogType } from "../../firebase";
import { default as ofStyle } from "./index.module.css";

class Log extends React.Component<
  { log: LogType },
  { log: LogType; timeout: number }
> {
  componentDidUpdate() {}

  render() {
    return <div className={ofStyle.log}>{this.props.log.id}</div>;
  }
}

export default Log;
