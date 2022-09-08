import React from "react";
import { LogType, StreamType } from "./Fetcher";
import LogFetcher from "./Fetcher/LogFetcher";
import StreamsFetcher from "./Fetcher/StreamsFetcher";
import { SubLog } from "./Log";

class Mobile extends React.Component<
  {},
  {
    streams: StreamType[];
    opened: { [espnId: string]: boolean };
  }
> {
  render() {
    return (
      <div>
        <StreamsFetcher
          handleResponse={(streams) => {
            this.setState({ streams });
          }}
        />
        <div>
          {(this.state?.streams || []).map((stream, i) => (
            <div
              key={i}
              onClick={() =>
                this.setState({
                  opened: Object.assign(this.state?.opened || {}, {
                    [stream.espnId]: !this.state?.opened[stream.espnId],
                  }),
                })
              }
            >
              {stream.name}
            </div>
          ))}
        </div>
        <div>
          {(this.state?.streams || [])
            .filter(({ espnId }) => this.state?.opened[espnId])
            .map(({ espnId }, i) => (
              <MobileLog espnId={espnId} />
            ))}
        </div>
      </div>
    );
  }
}

class MobileLog extends React.Component<{ espnId: string }, { log: LogType }> {
  render() {
    return (
      <div>
        <LogFetcher
          payload={this.props.espnId}
          handleResponse={(log) => log && this.setState({ log })}
        />
        <SubLog log={this.state.log} />
      </div>
    );
  }
}

export default Mobile;
