import { createRef } from "react";
import { defaultLogDelayMs } from "./Log";
import style from "./index.module.css";

export const logDelayRef = createRef<HTMLInputElement>();
export const autoRefreshRef = createRef<HTMLInputElement>();
export const muteCommercialRef = createRef<HTMLInputElement>();
export const remoteRef = createRef<HTMLInputElement>();

export const isMobile = window.screen.width * window.screen.height < 500_000;

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
        <input ref={remoteRef} type={"checkbox"} defaultChecked />
        <span> follow remote</span>
      </div>
    </div>
  );
}
