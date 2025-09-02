"use client";

import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import VideoPlayer, {
   VideoPlayerSkeleton,
} from "@/components/videos/VideoPlayer";
import VideoBanner from "@/components/videos/VideoBanner";
import VideoTopRow, {
   VideoTopRowSkeleton,
} from "@/components/videos/VideoTopRow";
import { useAuth } from "@clerk/nextjs";

interface VideoSectionProps {
   videoId: string;
}

export default function VideoSection({ videoId }: VideoSectionProps) {
   return (
      <Suspense>
         <ErrorBoundary fallback={<VideoSectionSkeleton />}>
            <VideoSectionSuspense videoId={videoId} />
         </ErrorBoundary>
      </Suspense>
   );
}

function VideoSectionSuspense({ videoId }: VideoSectionProps) {
   const { isSignedIn } = useAuth();
   const utils = trpc.useUtils();
   const [video] = trpc.videos.getOne.useSuspenseQuery({ id: videoId });
   const createView = trpc.videoViews.create.useMutation({
      onSuccess: () => {
         utils.videos.getOne.invalidate({ id: videoId });
      },
   });
   const handlePlay = () => {
      if (!isSignedIn) return;
      createView.mutate({ videoId });
   };
   return (
      <>
         <div
            className={cn(
               "aspect-video bg-black rounded-xl overflow-hidden relative",
               video.muxStatus !== "ready" && "rounded-b-none"
            )}
         >
            <VideoPlayer
               autoPlay
               onPlay={handlePlay}
               playbackId={video.muxPlaybackId}
               thumbnail={video.thumbnailUrl}
            />
         </div>
         <VideoBanner
            status={video.muxStatus}
            text="This video is still being processed"
         />
         <VideoTopRow video={video} />
      </>
   );
}

function VideoSectionSkeleton() {
   return (
      <>
         <VideoPlayerSkeleton />
         <VideoTopRowSkeleton />
      </>
   );
}
