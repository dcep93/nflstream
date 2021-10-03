import React from "react";
import firebase from "../firebase";

type MessageType = {
  version: string;
  streams: { href: string; title: string }[];
};

function MessageExtension() {
  const ref: React.RefObject<HTMLTextAreaElement> = React.createRef();
  return (
    <textarea
      hidden
      ref={ref}
      id={"message_extension"}
      onClick={() => {
        const message: MessageType = JSON.parse(ref.current!.value);
        console.log("update", message);
        if (message.version !== "0.0.4") return;
        const nflStream = {
          timestamp: new Date().getTime(),
          streams: message.streams.map((m) => ({ url: m.href, name: m.title })),
        };
        firebase.updateNFLStream(nflStream);
      }}
    />
  );
}

export default MessageExtension;
