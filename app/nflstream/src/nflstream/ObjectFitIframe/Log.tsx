import React from "react";
import { LogType } from "../../firebase";
import { menuWrapper } from "../Menu";
import { default as ofStyle } from "./index.module.css";

const delaySeconds = 1;

class Log extends React.Component<
  { log: LogType },
  { log: LogType | null; upcomingLog: LogType | null }
> {
  constructor(props: { log: LogType }) {
    super(props);
    this.state = { log: null, upcomingLog: null };
    this.delayUpdate();
  }

  delayUpdate() {
    const upcomingLog = (menuWrapper.state.streams || [])
      .map((s) => s.log)
      .find((l) => l.id === this.props.log.id);
    if (!upcomingLog) return;
    const log = this.state.upcomingLog;
    this.setState({ log, upcomingLog });
    setTimeout(this.delayUpdate.bind(this), delaySeconds * 1000);
  }

  render() {
    return <div className={ofStyle.log}>{JSON.stringify(this.state.log)}</div>;
  }
}

export default Log;
