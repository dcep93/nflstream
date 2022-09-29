import React from "react";
import { StreamType } from "./Fetcher";
import style from "./index.module.css";
import { ScreenType } from "./Multiscreen";
import recorded_sha from "./recorded_sha";

class Menu extends React.Component<
  {
    streams?: StreamType[];
    addScreen: (screen: ScreenType) => void;
  },
  {}
> {
  render() {
    return (
      <div className={style.menu}>
        <h1 className={style.header} title={recorded_sha}>
          NFL Stream
        </h1>

        {this.props.streams === undefined ? (
          <div>
            <img
              style={{ height: "100px", marginLeft: "100px" }}
              src={"https://nflstream.web.app/loading.gif"}
              alt="loading"
            />
          </div>
        ) : (
          <div>
            {this.props.streams
              .map((stream, i) => ({
                stream,
                i,
              }))
              .map((obj) => (
                <div key={obj.i}>
                  <div
                    className={[style.bubble, style.hover].join(" ")}
                    onClick={(e) =>
                      e.metaKey
                        ? window.open(obj.stream.url)
                        : this.props.addScreen({
                            iFrameTitle: (Math.random() + 1)
                              .toString(36)
                              .substring(2),
                            skipLog: e.shiftKey,
                            ref: React.createRef() as React.RefObject<HTMLIFrameElement>,
                            ...obj.stream,
                          })
                    }
                  >
                    <div title={obj.stream.url}>{obj.stream.name}</div>
                  </div>
                </div>
              ))}
          </div>
        )}
        <Guide />
      </div>
    );
  }
}

function Guide() {
  return (
    <div className={style.bubble}>
      <h3>User Guide</h3>
      <ol>
        <li>This app is used to watch multiple NFL streams.</li>
        <li>
          By default, chrome blocks mixed content http resources on an https
          page.
          <ul>
            <li>
              This can be fixed by navigating to{" "}
              <input
                readOnly
                value="chrome://settings/content/siteDetails?site=https%3A%2F%2Fnflstream.web.app"
              />
              . Then, scroll down to "Insecure content", and change to "Allow".
            </li>
            <li>
              If you don't want to do that,{" "}
              <a download href={"iframe.html"}>
                this downloaded page might work
              </a>
            </li>
            <li>
              If that doesn't work, holding ctrl/cmd and clicking a link will
              open it in a new tab.
            </li>
          </ul>
        </li>
        <li>
          Clicking a game will open a stream and place it on the multiscreen.
          Streams are borrowed from other sources, so I can't do anything about
          broken links.
        </li>
        <li>Clicking a minimized stream will move it to the spotlight.</li>
        <li>
          Downloading the{" "}
          <a href="https://chrome.google.com/webstore/detail/nfl-stream/jjlokcmkcepehbfepbffkmkkbnggkmje?hl=en&u_producttype=chrome-extension-667709&u_country=au&funnel=convert-pdf&gclid=Cj0KCQjwwNWKBhDAARIsAJ8HkhfEFO3SAM6aK42aSfntfnUY6yIRKS6A7DiyPG00l1mf8743CELeGaQaAksoEALw_wcB">
            chrome extension
          </a>{" "}
          offers additional functionality, like muting non-spotlighted streams.
        </li>
        <li>
          If you have the chrome extension, streams will include a delayed
          play-by-play log. You can disable this by holding shift when opening a
          stream.
        </li>
        <li>
          If you get an error like "redirected too many times", visit{" "}
          <input readOnly value="chrome://net-internals/#dns" />. Then, perform
          DNS -&gt; Clear Host Cache and Sockets -&gt; Flush socket pools. The
          chrome extension should make this step unnecessary.
        </li>
        <li>
          You can only use this tool if you legally have access to the stream
          and the game.
        </li>
      </ol>
    </div>
  );
}

// function downloadIframe() {
//   fetch("iframe.html")
//     .then((response) => response.blob())
//     .then((blob) => {
//       const a = document.createElement("a");
//       a.href = window.URL.createObjectURL(blob);
//       a.download = "nflstream.html";
//       a.click();
//     });
// }

export default Menu;
