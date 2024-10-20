import { createRef } from "react";
import { defaultLogDelayMs } from "./Log";
import style from "./index.module.css";

export const logDelayRef = createRef<HTMLInputElement>();
export const autoRefreshRef = createRef<HTMLInputElement>();
export const muteCommercialRef = createRef<HTMLInputElement>();

export default function Options() {
  return (
    <div className={style.bubble}>
      <h3>Options</h3>
      <div>
        <span>log delay ms </span>
        <input ref={logDelayRef} defaultValue={defaultLogDelayMs} />
      </div>
      <div>
        <span>autorefresh </span>
        <input ref={autoRefreshRef} type={"checkbox"} defaultChecked />
      </div>
      <div>
        <span>mute nfl+ commercials</span>
        <input ref={muteCommercialRef} type={"checkbox"} defaultChecked />
      </div>
    </div>
  );
}
