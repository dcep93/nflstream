import React from "react";
import { LogType } from "../../firebase";

class Log extends React.Component<
  { log: LogType },
  { log: LogType; timeout: number }
> {
  componentDidUpdate() {
    alert("wut");
  }

  render() {
    alert("hi");
    return <div>hi</div>;
  }
}

export default Log;
