import { ScreenType } from "../Multiscreen";
import firebase from "./Firebase";
import style from "./index.module.css";
import { titleMessageDiv } from "./Options";

type RemoteType = {
  src: string;
  timestamp: number;
  screens: ScreenType[];
  selected: string;
};

const firebasePath = "/remote";

export default class Remote extends firebase.FirebaseWrapper<RemoteType> {
  getFirebasePath(): string {
    return firebasePath;
  }

  render() {
    return (
      <div>
        <div>
          <h1>{titleMessageDiv}</h1>
        </div>
        <div className={style.bubble}>
          <h2>remote</h2>
          <div>src:</div>
          <div>{this.state.state.src}</div>
          <div>{new Date(this.state.state.timestamp).toLocaleTimeString()}</div>
        </div>
        <div>
          {this.state.state.screens.map((s) => (
            <div key={s.iFrameTitle}>
              <div
                className={style.bubble}
                style={{
                  backgroundColor:
                    this.state.state.selected === s.iFrameTitle
                      ? "lightgrey"
                      : undefined,
                }}
                onClick={() =>
                  this.state.state.selected !== s.iFrameTitle &&
                  updateRemote({
                    timestamp: Date.now(),
                    src: "remote",
                    screens: this.state.state.screens,
                    selected: s.iFrameTitle,
                  })
                }
              >
                {s.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export function onUpdateRemote(callback: (remote: RemoteType) => void) {
  firebase._connect(firebasePath, callback);
}

export function updateRemote(remote: RemoteType) {
  firebase._set(firebasePath, remote);
}
