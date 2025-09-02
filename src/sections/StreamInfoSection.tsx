import { Skeleton } from "@/components/ui/skeleton";
import VideoDescription from "@/components/videos/VideoDescription";
import VideoOwner from "@/components/videos/VideoOwner";
import { useStreamChatStore } from "@/stores/streamChatStore";
import { trpc } from "@/trpc/client";
import { StreamGetOneOutput } from "@/types";
import { format, formatDistanceToNow } from "date-fns";
import { useMemo } from "react";

interface StreamInfoSectionProps {
   stream: StreamGetOneOutput;
}

export default function StreamInfoSection({ stream }: StreamInfoSectionProps) {
   const { channel } = useStreamChatStore();
   const compactViews = useMemo(() => {
      return Intl.NumberFormat("en-US", { notation: "compact" }).format(
         channel?.state.watcher_count || 0
      );
   }, [channel?.state.watcher_count]);
   const expandedViews = useMemo(() => {
      return Intl.NumberFormat("en-US", { notation: "standard" }).format(
         channel?.state.watcher_count || 0
      );
   }, [channel?.state.watcher_count]);

   const compactDate = useMemo(() => {
      return formatDistanceToNow(stream.updatedAt, {
         addSuffix: true,
      });
   }, [stream.updatedAt]);

   const expandedDate = useMemo(() => {
      return format(stream.updatedAt, "dd/MM/yyyy");
   }, [stream.updatedAt]);

   const [user] = trpc.users.getOne.useSuspenseQuery({
      id: stream.userId,
   });

   // const { channel } = useStreamChatStore();

   return (
      <div className=" flex flex-col gap-4 mt-4">
         <h1 className=" text-xl font-semibold">{stream.name}</h1>
         <div className=" flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <VideoOwner user={user} streamId={stream.id} type="stream" />
            <div className=" flex overflow-x-auto sm:min-w-[calc(50%-6px)] sm:justify-end sm:overflow-visible pb-2 -mb-2 sm:pb-0 sm:mb-0 gap-2">
               {/* <VideoReactions
                  videoId={video.id}
                  likes={video.likeCount}
                  dislikes={video.dislikeCount}
                  viewerReaction={video.viewerReaction}
               /> */}
            </div>
         </div>
         <VideoDescription
            description={stream.description}
            compactViews={compactViews}
            expandedViews={expandedViews}
            expandedDate={expandedDate}
            compactDate={compactDate}
         />
      </div>
   );
}

export function StreamInfoSectionSkeleton() {
   return (
      <div className=" flex flex-col gap-4 mt-4">
         <div className=" flex flex-col gap-2">
            <Skeleton className="h-6 w-4/5 md:w-2/5" />
         </div>
         <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 w-[70%]">
               <Skeleton className="w-10 h-10 rounded-full shrink-0" />
               <div className="flex flex-col gap-2 w-full">
                  <Skeleton className="h-5 w-4/5 md:w-2/6" />
                  <Skeleton className="h-5 w-3/5 md:w-1/5" />
               </div>
            </div>
            {/* <Skeleton className=" h-9 w-2/6 md:1/6 rounded-full" /> */}
         </div>
         <div className=" h-[120px] w-full" />
      </div>
   );
}
