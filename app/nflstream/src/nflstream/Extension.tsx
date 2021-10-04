import React from "react";
import firebase from "../firebase";

type MessageType = {
  version: string;
  streams: { href: string; title: string }[];
};

const url = "https://nflstream.web.app";

function MessageExtension() {
  const ref: React.RefObject<HTMLTextAreaElement> = React.createRef();
  return (
    <div hidden>
      {window.location.href !== url && (
        <iframe title={"hidden_iframe"} hidden src={url}></iframe>
      )}
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
            streams: message.streams.map((m) => ({
              url: m.href,
              name: m.title,
            })),
          };
          firebase.updateNFLStream(nflStream);
        }}
      />
    </div>
  );
}

export default MessageExtension;
