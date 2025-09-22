import style from "../index.module.css";
import firebase from "./Firebase";
import { titleMessageDiv } from "./Options";

type RemoteType = {
  src: string;
  timestamp: number;
  screens: { title: string; name: string }[];
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
          {this.state.state.screens.map(({ title, name }) => (
            <div key={title}>
              <div
                className={style.bubble}
                style={{
                  backgroundColor:
                    this.state.state.selected === title
                      ? "lightgrey"
                      : undefined,
                }}
                onClick={() =>
                  this.state.state.selected !== title &&
                  updateRemote({
                    timestamp: Date.now(),
                    src: "remote",
                    screens: this.state.state.screens,
                    selected: title,
                  })
                }
              >
                {name}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export function onUpdateRemote(callback: (remote: RemoteType) => void) {
  return firebase._connect(firebasePath, callback);
}

export function updateRemote(remote: RemoteType) {
  firebase._set(firebasePath, remote);
}
