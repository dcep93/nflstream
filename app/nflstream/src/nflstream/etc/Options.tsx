import { createRef } from "react";
import { HOST_STORAGE_KEY } from "../Fetcher/StreamsFetcher";
import { defaultLogDelayMs } from "../Log";
import style from "../index.module.css";

export const logDelayRef = createRef<HTMLInputElement>();
export const autoRefreshRef = createRef<HTMLInputElement>();
export const muteCommercialRef = createRef<HTMLInputElement>();
export const remoteRef = createRef<HTMLInputElement>();

const params = new URLSearchParams(window.location.search);
export const isMobile =
  params.get("desktop") === null &&
  (params.get("remote") !== null ||
    window.screen.width * window.screen.height < 500_000);

export const titleMessageDiv = <div>NFLStream</div>;

export default function Options() {
  return (
    <div className={style.bubble}>
      <h3>Options</h3>
      <div>
        <input ref={logDelayRef} defaultValue={defaultLogDelayMs} />
        <span> log delay ms</span>
      </div>
      <div>
        <input ref={autoRefreshRef} type={"checkbox"} defaultChecked />
        <span> autorefresh</span>
      </div>
      <div>
        <input ref={muteCommercialRef} type={"checkbox"} defaultChecked />
        <span> mute nfl+ commercials</span>
      </div>
      <div>
        <input ref={remoteRef} type={"checkbox"} />
        <span> follow remote</span>
      </div>
      <button
        onClick={() => {
          if (!window.confirm("Are you sure?")) return;
          localStorage.removeItem(HOST_STORAGE_KEY);
          window.location.reload();
        }}
      >
        reset host
      </button>
    </div>
  );
}
