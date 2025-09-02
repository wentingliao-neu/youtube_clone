"use client";

import { cn } from "@/lib/utils";

import VideoPlayer from "@/components/videos/VideoPlayer";
import VideoBanner from "@/components/videos/VideoBanner";
import { Loader, WifiOff } from "lucide-react";

interface StreamSectionProps {
   isLive: boolean;
   isLoading: boolean;
   playbackId: string;
   thumbnailUrl: string | null;
   watchToken?: string;
   onError: () => void;
}

export default function StreamSection({
   isLive,
   isLoading,
   playbackId,
   thumbnailUrl,
   watchToken,
   onError,
}: StreamSectionProps) {
   return (
      <>
         <div
            className={cn(
               "aspect-video bg-black rounded-xl overflow-hidden relative"
            )}
         >
            {isLoading && (
               <div className=" h-full flex flex-col space-y-4 justify-center items-center">
                  <Loader className=" h-10 w-10 text-muted-foreground animate-spin" />
                  <p className=" text-muted-foreground capitalize">
                     Stream Loading...
                  </p>
               </div>
            )}
            {isLive && !isLoading && (
               <VideoPlayer
                  autoPlay
                  token={watchToken}
                  playbackId={playbackId}
                  thumbnail={thumbnailUrl}
                  onError={onError}
               />
            )}
            {!isLive && !isLoading && (
               <div className=" h-full flex flex-col space-y-4 justify-center items-center">
                  <WifiOff className=" h-10 w-10 text-muted-foreground" />
                  <p className=" text-muted-foreground">
                     This stream is off right now
                  </p>
               </div>
            )}
         </div>
         <VideoBanner
            status={isLive ? "ready" : "processing"}
            text={
               isLive ? "This stream is live" : "This stream is off right now"
            }
         />
      </>
   );
}
