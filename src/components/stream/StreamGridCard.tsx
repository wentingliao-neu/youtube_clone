"use client";
import Link from "next/link";
import VideoThumbnail from "../videos/VideoThumbnail";

import { StreamGetManyOutput } from "@/types";
import { Skeleton } from "../ui/skeleton";
import StreamerInfoHeader from "./StreamerInfoHeader";
import { Radio, WifiOff } from "lucide-react";

interface VideoGridCardProps {
   data: StreamGetManyOutput[number];
   viewerCount?: number;
}
export default function StreamGridCard({
   data,
   viewerCount,
}: VideoGridCardProps) {
   return (
      <div className=" flex flex-col gap-2 w-full group">
         <Link prefetch href={`/stream/${data.userId}`} className=" relative">
            <VideoThumbnail
               imageUrl={data.thumbnailUrl}
               title={data.name}
               duration={0}
            />
            <div className="absolute bottom-2 right-2 px-1 gap-1 py-0.5 rounded bg-rose-500 text-white text-xs font-medium flex items-center ">
               {data.isLive ? (
                  <Radio className="size-4" />
               ) : (
                  <WifiOff className="size-4" />
               )}
               {data.isLive ? "Live" : "Offline"}
            </div>
         </Link>
         <StreamerInfoHeader
            isFollowing={data.viewerSubscribed}
            isLive={data.isLive}
            participantCount={viewerCount}
            imageUrl={data.user.imageUrl}
            hostName={data.user.name}
            streamName={data.name}
            hostId={data.userId}
         />
      </div>
   );
}

export const StreamGridCardSkeleton = () => {
   return (
      <div className=" flex flex-col gap-2 w-full">
         <div className="relative w-full overflow-hidden rounded-xl aspect-video">
            <Skeleton className="size-full" />
         </div>
         <div className="flex gap-3">
            <Skeleton className="size-10 flex-shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
               <Skeleton className="h-5 w-[90%]" />
               <Skeleton className="h-5 w-[70%]" />
            </div>
         </div>
      </div>
   );
};
