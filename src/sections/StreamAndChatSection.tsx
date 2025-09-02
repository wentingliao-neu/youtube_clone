"use client";
import { trpc } from "@/trpc/client";
import { useStreamChatStore } from "@/stores/streamChatStore";
import { Suspense, useEffect, useRef, useState } from "react";
import StreamSection from "./StreamSection";
import { useAuth } from "@clerk/nextjs";
import { ChatRoomSkeleton } from "./ChatSection";
import { ErrorBoundary } from "react-error-boundary";
import { VideoPlayerSkeleton } from "@/components/videos/VideoPlayer";
import { VideoTopRowSkeleton } from "@/components/videos/VideoTopRow";
import StreamInfoSection from "./StreamInfoSection";
import BlockRedirect from "@/components/block/BlockRedirect";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Pusher from "pusher-js";
import { toast } from "sonner";

const ChatRoom = dynamic(() => import("./ChatSection"), {
   ssr: false,
});

function StreamAndChatSectionSuspense({ streamerId }: { streamerId: string }) {
   const [stream] = trpc.streams.getOneByUserId.useSuspenseQuery({
      id: streamerId,
   });
   const utils = trpc.useUtils();
   const { client, channel, reset } = useStreamChatStore();
   const { userId } = useAuth();
   const pusher = useRef<Pusher | null>(null);

   const [forceToEnd, setForceToEnd] = useState(false);

   const [watchToken, setWatchToken] = useState<string>("");
   function onError() {
      console.log("Error in stream section");
      setForceToEnd(true);
   }
   const listenerRef = useRef<{ unsubscribe: () => void } | undefined>(
      undefined
   );
   const router = useRouter();
   const generateToken = trpc.streams.generateToken.useMutation({
      onSuccess: (data) => {
         console.log("generateToken success");
         setWatchToken(data.token);
      },
      onError(err) {
         console.log("generateToken error", err);
         if (err.data?.code === "UNAUTHORIZED") router.push("/not-found");
      },
   });

   useEffect(() => {
      if (stream.isLive) {
         if (stream.visibility === "subscribers")
            generateToken.mutate({ id: stream.id });
         else if (stream.publicToken) setWatchToken(stream.publicToken);
      }
   }, [streamerId, stream.isLive, stream.visibility]);

   useEffect(() => {
      if (!client?.user) return;

      listenerRef.current = client?.on("user.banned", (event) => {
         if (
            event.user?.id === userId &&
            (event as { created_by?: { id: string } }).created_by?.id ===
               stream.user.clerkId
         )
            router.push("/not-found");
      });

      return () => {
         listenerRef.current?.unsubscribe();
         listenerRef.current = undefined;
         channel?.stopWatching();
         reset();
      };
   }, [streamerId, client]);

   useEffect(() => {
      if (!pusher.current)
         pusher.current = useStreamChatStore.getState().pusher;

      const pusherChannel = pusher.current?.subscribe(`stream-${stream.id}`);

      pusher.current?.connection.bind("connected", () => {
         console.log("Pusher connected successfully");
      });

      pusherChannel?.bind("test", () => {
         console.log("test");
      });
      pusherChannel?.bind("statusChanged", () => {
         utils.streams.getOneByUserId.invalidate({ id: streamerId });
      });
      pusherChannel?.bind("userBanned", () => {
         utils.streams.getOneByUserId.invalidate({ id: streamerId });
      });

      pusher.current?.connection.bind("error", (err: Error) => {
         console.error("Pusher connection error:", err);
         toast.error("Pusher connection error");
      });

      return () => {
         pusher.current?.unsubscribe(`stream-${stream.id}`);

         pusher.current = null;
      };
   }, [streamerId, stream.id]);
   return (
      <>
         <div className=" flex-1 min-w-0">
            <StreamSection
               isLive={stream.isLive && !forceToEnd}
               isLoading={generateToken.isPending}
               playbackId={stream.playbackId}
               thumbnailUrl={stream.thumbnailUrl}
               watchToken={watchToken}
               onError={onError}
            />

            <StreamInfoSection stream={stream} />
            {/* Mobile view of suggestions */}
            <div className="xl:hidden block mt-4 h-80">
               {" "}
               This is the mobile view of the chat
               <ChatRoom streamId={stream.id} />
            </div>
         </div>
         <div className="hidden xl:block w-full xl:w-[380px] shrink-1 xl:h-[calc(100vh-8rem)]">
            This is the desktop view of the chat
            <ChatRoom streamId={stream.id} />
         </div>
      </>
   );
}

export default function StreamAndChatSection({
   streamerId,
}: {
   streamerId: string;
}) {
   return (
      <Suspense fallback={<StreamAndChatSectionSkeleton />}>
         <ErrorBoundary fallback={<BlockRedirect />}>
            <StreamAndChatSectionSuspense streamerId={streamerId} />
         </ErrorBoundary>
      </Suspense>
   );
}

function StreamAndChatSectionSkeleton() {
   return (
      <>
         <div className=" flex-1 min-w-0">
            <VideoPlayerSkeleton />
            <VideoTopRowSkeleton />
            {/* Mobile view of suggestions */}
            <div className="xl:hidden block mt-4">
               This is the desktop view of the chat
               <ChatRoomSkeleton />
            </div>
         </div>
         <div className="hidden xl:block w-full xl:w-[380px] shrink-1 xl:h-[calc(100vh-8rem)]">
            This is the mobile view of the chat
            <ChatRoomSkeleton />
         </div>
      </>
   );
}
