import React from "react";
import { LogType, StreamsFetcher, StreamType } from "./Fetcher";
import style from "./index.module.css";
import DelayedLog from "./Log/DelayedLog";
import Menu from "./Menu";
import Multiscreen, { ScreenType } from "./Multiscreen";

class NFLStream extends React.Component<
  {},
  {
    backgroundColor: string;
    streams: StreamType[];
    screens: ScreenType[];
    logs: LogType[];
  }
> {
  render() {
    return (
      <div
        className={style.main}
        style={{ backgroundColor: this.state.backgroundColor }}
      >
        <StreamsFetcher
          handleResponse={(streams) => this.setState({ streams })}
        />
        <DelayedLog logs={this.state.logs} />
        <Menu
          addScreen={(screen) =>
            this.setState({
              screens: (this.state?.screens || []).concat(screen),
            })
          }
          streams={this.state.streams}
          setBackground={(backgroundColor) =>
            this.setState({ backgroundColor })
          }
        />
        <Multiscreen
          screens={this.state.screens}
          removeScreen={(iFrameTitle) =>
            this.setState({
              screens: this.state.screens.filter(
                (o) => o.iFrameTitle !== iFrameTitle
              ),
            })
          }
        />
      </div>
    );
  }
}
export default NFLStream;
