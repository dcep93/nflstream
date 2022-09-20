import React from "react";
import { StreamType } from "./Fetcher";

class Mobile extends React.Component<
  {},
  {
    streams: StreamType[];
    opened: { [espnId: string]: boolean };
  }
> {
  render() {
    return null;
  }
}

export default Mobile;
