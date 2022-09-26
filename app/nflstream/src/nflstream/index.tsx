import React from "react";
import { StreamType } from "./Fetcher";
import StreamsFetcher from "./Fetcher/StreamsFetcher";
import style from "./index.module.css";
import Menu from "./Menu";
import Multiscreen, { ScreenType } from "./Multiscreen";

const PASSWORD = "mustbeusedlegally";

declare global {
  interface Window {
    chrome: any;
  }
}

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
    if (!window.chrome?.runtime) {
      console.log("not chrome, using http");
      this.setState({ protocol: "http" });
    } else {
      new Promise((resolve, reject) => {
        const extension_id = "idejabpndfcphdflfdbionahnlnphlnf";
        window.chrome.runtime.sendMessage(extension_id, {}, (response: any) => {
          if (response === undefined) return reject("empty response");
          console.log("extension detected, using https");
          this.setState({ protocol: "https" });
          resolve(null);
        });
      }).catch((err: Error) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        window.chrome.runtime.lastError;
        console.log("extension not detected, using http");
        this.setState({ protocol: "http" });
      });
    }
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
