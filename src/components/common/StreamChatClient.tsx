"use client";

import { useStreamChatStore } from "@/stores/streamChatStore";
import Pusher from "pusher-js";
import { useEffect } from "react";
import { StreamChat } from "stream-chat";
import { Chat } from "stream-chat-react";

const client = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_API_KEY!);
const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_API_KEY!, {
   cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
   forceTLS: true,
   enabledTransports: ["ws", "wss"],
});

export function StreamChatClient({ children }: { children: React.ReactNode }) {
   const { setClient, setPusher } = useStreamChatStore();

   useEffect(() => {
      setClient(client);
      setPusher(pusher);

      return () => {
         pusher.disconnect();
      };
   }, [setClient, setPusher]);

   return <Chat client={client}>{children}</Chat>;
}
