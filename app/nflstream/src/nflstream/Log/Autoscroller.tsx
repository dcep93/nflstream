import React from "react";

var ref = React.createRef<HTMLDivElement>();
var interval: NodeJS.Timeout;
const PERIOD_MS = 100;
const EDGE_SLEEP_MS = 1000;
export default function AutoScroller(props: {
  children: JSX.Element;
  speed: number;
  id: number;
}) {
  var sleeping = false;
  clearInterval(interval);
  interval = setInterval(() => {
    if (
      ref.current!.scrollTop ===
      ref.current!.scrollHeight - ref.current!.clientHeight
    ) {
      sleeping = true;
      setTimeout(() => {
        (ref.current || { scrollTop: undefined }).scrollTop = 0;
        setTimeout(() => {
          sleeping = false;
        }, EDGE_SLEEP_MS);
      }, EDGE_SLEEP_MS);
    }
    if (sleeping) return;
    ref.current!.scrollTop += props.speed / 1000;
  }, PERIOD_MS);
  return <div ref={ref}>{props.children}</div>;
}
