import React from "react";

const PERIOD_MS = 10;
const EDGE_SLEEP_MS = 2500;

type Props = {
  speed: number;
  children: JSX.Element;
};
type State = { ref: React.RefObject<HTMLDivElement> };
type FakeState = { offset: number; sleeping: boolean; last: number };

export default class AutoScroller extends React.Component<Props, State> {
  mounted: boolean;

  constructor(props: Props) {
    super(props);
    this.mounted = false;
  }

  componentDidMount(): void {
    if (this.mounted) return;
    this.mounted = true;
    this.setState({ ref: React.createRef<HTMLDivElement>() });
    this.scrollF({ offset: 0, sleeping: false, last: 0 });
  }

  scrollF(fakeState: FakeState) {
    // this.helper(fakeState);
    // setTimeout(() => this.scrollF(fakeState), PERIOD_MS);
  }

  helper(fakeState: FakeState) {
    if (!this.state?.ref) return;
    const now = Date.now();
    fakeState.last = now;
    const scrollableAmount =
      (this.state.ref.current?.scrollHeight || 0) -
      (this.state.ref.current?.clientHeight || 0);
    const currentlyScrolled = this.state.ref.current?.scrollTop || 0;
    console.log({ fakeState, currentlyScrolled });
    if (fakeState.sleeping) return;
    if (Math.abs(fakeState.offset - currentlyScrolled) > 1) {
      fakeState.sleeping = true;
      setTimeout(() => {
        if (scrollableAmount - currentlyScrolled < 5) {
          fakeState.offset = 0;
          this.state.ref.current?.scrollTo({ top: 0 });
          setTimeout(() => {
            fakeState.sleeping = false;
          }, EDGE_SLEEP_MS);
        } else {
          fakeState.offset = currentlyScrolled;
          fakeState.sleeping = false;
        }
      }, EDGE_SLEEP_MS);
      return;
    }
    fakeState.offset +=
      (this.props.speed * scrollableAmount * PERIOD_MS) / 1000;
    this.state.ref.current?.scrollTo({ top: Math.ceil(fakeState.offset) });
  }

  render() {
    if (!this.state?.ref) return null;
    return (
      <div
        ref={this.state.ref}
        style={{
          height: "100%",
          overflow: "scroll",
        }}
      >
        {this.props.children}
      </div>
    );
  }
}
