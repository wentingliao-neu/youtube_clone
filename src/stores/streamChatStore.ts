import { create } from "zustand";
import { StreamChat, Channel as StreamChannel } from "stream-chat";
import Pusher from "pusher-js";

interface StreamChatState {
   client: StreamChat | null;
   channel: StreamChannel | null;
   pusher: Pusher | null;
   setClient: (client: StreamChat) => void;
   setChannel: (channel: StreamChannel | null) => void;
   connectUser: (userId: string, token: string) => Promise<void>;
   disconnectUser: () => Promise<void>;
   joinChannel: (streamId: string) => void;
   reset: () => void;
   init: () => void;
   setPusher: (pusher: Pusher) => void;
}

export const useStreamChatStore = create<StreamChatState>((set, get) => ({
   client: null,
   channel: null,
   pusher: null,
   setClient: (client) => set({ client }),
   setChannel: (channel) => set({ channel }),
   setPusher: (pusher) => set({ pusher }),

   init: () => {
      if (typeof window === "undefined") return;
      if (!get().pusher)
         set({
            pusher: new Pusher(process.env.NEXT_PUBLIC_PUSHER_API_KEY!, {
               cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
            }),
         });

      if (!get().client)
         set({
            client: new StreamChat(process.env.NEXT_PUBLIC_STREAM_API_KEY!),
         });
   },

   connectUser: async (userId, token) => {
      const client = get().client;
      if (!client || client.user) return;

      try {
         await client.connectUser({ id: userId }, token);
         set({ client });
      } catch (err) {
         console.error("Failed to connect user", err);
         throw err;
      }
   },

   joinChannel: (streamId: string) => {
      const client = get().client;
      const currentChannel = get().channel;

      if (!client) throw new Error("Client not found");

      if (currentChannel && currentChannel.id === streamId) {
         console.log("already in channel", streamId);
         return;
      }

      try {
         const channel = client.channel("messaging", streamId);
         console.log("joining channel", streamId);
         channel.watch();
         set({ channel });
      } catch (err) {
         console.error("Failed to join channel", err);
         if ((err as { code: number }).code === 17) {
            // channel is disabled
            console.log("channel is disabled");

            set({ channel: null });
         } else throw err;
      }
   },

   disconnectUser: async () => {
      const client = get().client;
      if (client) {
         await client.disconnectUser();
         set({ channel: null });
      }
   },

   reset: () => set({ channel: null }),
}));
