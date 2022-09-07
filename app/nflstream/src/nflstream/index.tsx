import React from "react";
import firebase, { LogType, NFLStreamType } from "../firebase";
import DelayedLog from "./DelayedLog";
import style from "./index.module.css";
import Menu from "./Menu";
import Multiscreen, { ScreenType } from "./multiscreen";

var firebaseWrapperComponent: FirebaseWrapper;
class FirebaseWrapper extends React.Component<
  {},
  { nflStream: NFLStreamType }
> {
  componentDidMount() {
    const oldComponent = firebaseWrapperComponent;
    firebaseWrapperComponent = this;
    if (oldComponent) {
      this.setState(oldComponent.state);
    } else {
      document.title = "NFL Stream";
      firebase.connect((nflStream) =>
        firebaseWrapperComponent.setState.bind(firebaseWrapperComponent)({
          nflStream,
        })
      );
    }
  }

  render() {
    return <NFLStream nflStream={this.state?.nflStream || {}} />;
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
export default FirebaseWrapper;
