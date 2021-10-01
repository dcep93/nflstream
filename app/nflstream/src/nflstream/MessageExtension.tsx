import React from "react";
import firebase from "../firebase";

type MessageType = { href: string; title: string }[];

function MessageExtension() {
  const ref: React.RefObject<HTMLTextAreaElement> = React.createRef();
  return (
    <textarea
      hidden
      ref={ref}
      id={"message_extension"}
      onClick={() => {
        const message: MessageType = JSON.parse(ref.current!.value);
        const nflStream = {
          timestamp: new Date().getTime(),
          streams: message.map((m) => ({ url: m.href, name: m.title })),
        };
        console.log("update", nflStream);
        firebase.updateNFLStream(nflStream);
      }}
    />
  );
}

export default MessageExtension;
