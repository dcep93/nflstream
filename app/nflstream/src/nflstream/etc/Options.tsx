import { createRef } from "react";
import { extension_id, EXTENSION_STORAGE_KEY } from "..";
import style from "../index.module.css";
import { defaultLogDelayMs } from "../Log";
import { refreshMultiscreen } from "../Multiscreen";

export const logDelayRef = createRef<HTMLInputElement>();
export const autoRefreshRef = createRef<HTMLInputElement>();
export const muteCommercialRef = createRef<HTMLInputElement>();
export const displayLogRef = createRef<HTMLInputElement>();
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
        <span>extension_id </span>
        <input
          style={{ width: "6em" }}
          defaultValue={extension_id}
          onChange={(e) =>
            Promise.resolve()
              .then(() =>
                localStorage.setItem(EXTENSION_STORAGE_KEY, e.target.value)
              )
              .then(() => window.location.reload())
          }
        />
      </div>
      <div>
        <span>log delay ms </span>
        <input
          style={{ width: "6em" }}
          ref={logDelayRef}
          defaultValue={defaultLogDelayMs}
        />
      </div>
      <div>
        <label>
          <input ref={autoRefreshRef} type={"checkbox"} defaultChecked />
          <span> autorefresh</span>
        </label>
      </div>
      <div>
        <label>
          <input ref={muteCommercialRef} type={"checkbox"} defaultChecked />
          <span> mute nfl+ commercials</span>
        </label>
      </div>
      <div>
        <label>
          <input
            ref={displayLogRef}
            type={"checkbox"}
            defaultChecked
            onChange={() => refreshMultiscreen?.()}
          />
          <span> display logs</span>
        </label>
      </div>
      <div>
        <label>
          <input ref={remoteRef} type={"checkbox"} />
          <span> follow remote</span>
        </label>
      </div>
      <button
        onClick={() => {
          if (!window.confirm("Are you sure?")) return;
          localStorage.clear();
          window.location.reload();
        }}
      >
        clear cache
      </button>
    </div>
  );
}
