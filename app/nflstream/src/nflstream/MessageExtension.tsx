import React from "react";
import { NFLStreamType } from "../firebase";

function MessageExtension() {
  const ref: React.RefObject<HTMLTextAreaElement> = React.createRef();
  return (
    <textarea
      hidden
      ref={ref}
      id={"message_extension"}
      onClick={() => {
        const nflStream: NFLStreamType = JSON.parse(ref.current!.value);
        console.log("skipping update", nflStream);
        // firebase.updateNFLStream(nflStream);
      }}
    />
  );
}

export default MessageExtension;
