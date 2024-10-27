import style from "../index.module.css";
import firebase from "./Firebase";
import { titleMessageDiv } from "./Options";

type RemoteType = {
  src: string;
  timestamp: number;
  screens: { [title: string]: string };
  selected: string;
};

const firebasePath = "/remote";

export default class Remote extends firebase.FirebaseWrapper<RemoteType> {
  getFirebasePath(): string {
    return firebasePath;
  }

  render() {
    if (!this.state) return <></>;
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
          {Object.entries(this.state.state.screens).map(
            ([screenTitle, name]) => (
              <div key={screenTitle}>
                <div
                  className={style.bubble}
                  style={{
                    backgroundColor:
                      this.state.state.selected === screenTitle
                        ? "lightgrey"
                        : undefined,
                  }}
                  onClick={() =>
                    this.state.state.selected !== screenTitle &&
                    updateRemote({
                      timestamp: Date.now(),
                      src: "remote",
                      screens: this.state.state.screens,
                      selected: screenTitle,
                    })
                  }
                >
                  {name}
                </div>
              </div>
            )
          )}
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
