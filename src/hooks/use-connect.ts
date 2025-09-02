import { useStreamChatStore } from "@/stores/streamChatStore";
import { trpc } from "@/trpc/client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";

export const useConnect = (streamId: string) => {
   const { userId } = useAuth();
   const { connectUser, client, joinChannel, disconnectUser } =
      useStreamChatStore();
   const generateToken = trpc.streams.getStreamToken.useMutation({
      onError: (error) => {
         console.error(error);
         toast.error("Failed to generate chat token");
      },
   });

   const [isUserConnected, setIsUserConnected] = useState(false);
   const connectRef = useRef(false);
   const initChat = useCallback(async () => {
      if (connectRef.current) return;
      connectRef.current = true;
      if (!userId) {
         console.log("user logged out, disconnect");
         await disconnectUser();
         connectRef.current = false;
         return;
      }

      try {
         if (!client?.user || client.user.id !== userId) {
            console.log("user not connected, initializing");
            const { token } = await generateToken.mutateAsync();

            await connectUser(userId || "guest", token);
            console.log("user connected, joining channel");
            joinChannel(streamId);
         } else if (client?.user && !client.channel) {
            // 只有在没有频道时才加入
            console.log("user connected, joining channel");
            joinChannel(streamId);
         }
         setIsUserConnected(true);
         connectRef.current = false;
      } catch (err) {
         console.error("Failed to init chat", err);
         toast.error("Failed to init chat");
         connectRef.current = false;
      }
   }, [userId, streamId]);
   useEffect(() => {
      initChat();
   }, [userId, streamId]);

   return {
      isConnected: isUserConnected,
      isConnecting: connectRef.current,
      initChat,
   };
};
