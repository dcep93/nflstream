import React from "react";

var ref = React.createRef<HTMLDivElement>();
var offset = 0;
var interval: NodeJS.Timeout;
const PERIOD_MS = 10;
const EDGE_SLEEP_MS = 2000;
export default function AutoScroller(props: {
  children: JSX.Element;
  speed: number;
}) {
  var sleeping = false;
  clearInterval(interval);
  interval = setInterval(() => {
    if (sleeping) return;
    offset = ref.current?.scrollTop || 0;
    const scrollAmount =
      (ref.current?.scrollHeight || 0) - (ref.current?.clientHeight || 0);
    if (offset >= scrollAmount - 1) {
      sleeping = true;
      setTimeout(() => {
        ref.current?.scrollTo({ top: 0 });
        setTimeout(() => {
          sleeping = false;
        }, EDGE_SLEEP_MS + 1000);
      }, EDGE_SLEEP_MS);
    }
    offset += (props.speed * scrollAmount) / 1000 / PERIOD_MS;
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
