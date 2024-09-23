import React from "react";

const PERIOD_MS = 10;
const EDGE_SLEEP_MS = 2500;

var ref = React.createRef<HTMLDivElement>();
var offset = 0;
var sleeping = false;
var interval: NodeJS.Timeout;
export default function AutoScroller(props: {
  children: JSX.Element;
  speed: number;
}) {
  clearInterval(interval);
  interval = setInterval(() => {
    if (sleeping) return;
    const scrollableAmount =
      (ref.current?.scrollHeight || 0) - (ref.current?.clientHeight || 0);
    const currentlyScrolled = ref.current?.scrollTop || 0;
    if (Math.abs(offset - currentlyScrolled) >= 1) {
      sleeping = true;
      setTimeout(() => {
        offset = 0;
        ref.current?.scrollTo({ top: 0 });
        setTimeout(() => {
          sleeping = false;
        }, EDGE_SLEEP_MS);
      }, EDGE_SLEEP_MS);
      return;
    }
    offset += (props.speed * scrollableAmount) / 1000 / PERIOD_MS;
    ref.current?.scrollTo({ top: Math.ceil(offset) });
  }, PERIOD_MS);
  return (
    <div
      ref={ref}
      style={{
        height: "100%",
        overflow: "scroll",
      }}
    >
      {props.children}
    </div>
  );
}
