import React from "react";
import DelayedLog from "./DelayedLog";
import Fetcher, { LogType, NFLStreamType } from "./Fetcher";
import style from "./index.module.css";
import Menu from "./Menu";
import Multiscreen, { ScreenType } from "./multiscreen";

class FetchWrapper extends React.Component<{}, { nflStream: NFLStreamType }> {
  render() {
    return (
      <>
        <Fetcher setNflStream={(nflStream) => this.setState({ nflStream })} />
        <NFLStream nflStream={this.state?.nflStream || {}} />
      </>
    );
  }
}

class NFLStream extends React.Component<
  { nflStream: NFLStreamType },
  { screens: ScreenType[]; logs: LogType[] }
> {
  constructor(props: { nflStream: NFLStreamType }) {
    super(props);
    this.state = { screens: [], logs: [] };
  }

  render() {
    return (
      <div className={style.main}>
        <DelayedLog logs={this.state.logs} />
        <Menu
          addScreen={this.addScreen.bind(this)}
          nflStream={this.props.nflStream}
        />
        <Multiscreen
          screens={this.state.screens}
          removeScreen={this.removeScreen.bind(this)}
        />
      </div>
    );
  }

  addScreen(screen: ScreenType) {
    this.setState({
      screens: this.state.screens.concat(screen),
    });
  }

  removeScreen(iFrameTitle: string) {
    this.setState({
      screens: this.state.screens.filter((o) => o.iFrameTitle !== iFrameTitle),
    });
  }
}
export default FetchWrapper;
