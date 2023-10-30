import { createRef } from "react";
import { bigPlayDurationMs, defaultBigPlayWarningMs } from "./Log";
import style from "./index.module.css";

export const logDelayRef = createRef<HTMLInputElement>();
export const bigPlayWarningRef = createRef<HTMLInputElement>();

export default function Options() {
  return (
    <div className={style.bubble}>
      <h3>Options</h3>
      <div>
        <span>log delay ms </span>
        <input ref={logDelayRef} defaultValue={defaultBigPlayWarningMs} />
      </div>
      <div>
        <span>big play warning ms </span>
        <input ref={bigPlayWarningRef} defaultValue={bigPlayDurationMs} />
      </div>
    </div>
  );
}
