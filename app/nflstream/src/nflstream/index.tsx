import React from "react";
import { StreamType } from "./Fetcher";
import StreamsFetcher from "./Fetcher/StreamsFetcher";
import style from "./index.module.css";
import Menu from "./Menu";
import Multiscreen, { ScreenType } from "./Multiscreen";

const PASSWORD = "mustbeusedlegally";

class NFLStream extends React.Component<
  {},
  {
    backgroundColor?: string;
    streams?: StreamType[];
    screens: ScreenType[];
    protocol?: string;
  }
> {
  componentDidMount() {
    this.setState({ protocol: "http" });
  }

  render() {
    return localStorage.getItem("password") !== PASSWORD ? (
      <Password />
    ) : !this.state?.protocol ? null : (
      <div className={style.main}>
        <StreamsFetcher
          handleResponse={(streams) => {
            if (
              streams.map((s) => s.url).join(" ") !==
              (this.state.streams || []).map((s) => s.url).join(" ")
            ) {
              this.setState({ backgroundColor: "darkgrey" });
              setTimeout(
                () => this.setState({ backgroundColor: undefined }),
                2000
              );
            }
            this.setState({ streams });
          }}
          payload={this.state.protocol!}
        />
        <Menu
          addScreen={(screen) =>
            this.setState({
              screens: (this.state?.screens || []).concat(screen),
            })
          }
          streams={this.state?.streams}
        />
        <Multiscreen
          backgroundColor={this.state?.backgroundColor}
          screens={this.state?.screens || []}
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

function Password() {
  const password = window.prompt("enter the password:");
  if (password) localStorage.setItem("password", password);
  window.location.reload();
  return null;
}

export default NFLStream;
