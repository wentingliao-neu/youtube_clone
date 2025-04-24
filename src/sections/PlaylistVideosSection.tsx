"use client";
import InfiniteScroll from "@/components/common/InfiniteScroll";
import VideoGridCard, {
   VideoGridCardSkeleton,
} from "@/components/videos/VideoGridCard";
import VideoRowCard, {
   VideoRowCardSkeleton,
} from "@/components/videos/VideoRowCard";
import { DEFAULT_LIMIT } from "@/constants";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";

interface PlaylistVideoSectionProps {
   sectionType: "liked" | "custom" | "subscription" | "history";
   playlistId?: string;
}
export default function PlaylistVideoSection({
   sectionType,
   playlistId,
}: PlaylistVideoSectionProps) {
   return (
      <Suspense fallback={<PlaylistVideoSectionSkeleton />}>
         <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <PlaylistVideoSectionSuspense
               sectionType={sectionType}
               playlistId={playlistId}
            />
         </ErrorBoundary>
      </Suspense>
   );
}

function PlaylistVideoSectionSuspense({
   sectionType,
   playlistId,
}: PlaylistVideoSectionProps) {
   const utils = trpc.useUtils();
   const [videos, query] = (() => {
      switch (sectionType) {
         case "liked":
            return trpc.playlists.getLiked.useSuspenseInfiniteQuery(
               {
                  limit: DEFAULT_LIMIT,
               },
               { getNextPageParam: (lastPage) => lastPage.nextCursor }
            );

         case "history":
            return trpc.playlists.getHistory.useSuspenseInfiniteQuery(
               {
                  limit: DEFAULT_LIMIT,
               },
               { getNextPageParam: (lastPage) => lastPage.nextCursor }
            );
         case "custom":
            return trpc.playlists.getVideos.useSuspenseInfiniteQuery(
               {
                  playlistId: playlistId as string,
                  limit: DEFAULT_LIMIT,
               },
               { getNextPageParam: (lastPage) => lastPage.nextCursor }
            );
         default:
            return trpc.videos.getMany.useSuspenseInfiniteQuery(
               {
                  limit: DEFAULT_LIMIT,
               },
               { getNextPageParam: (lastPage) => lastPage.nextCursor }
            );
      }
   })();

   const removeVideo = trpc.playlists.removeVideo.useMutation({
      onSuccess: (data) => {
         toast.success("Video removed to playlist");
         utils.playlists.getManyVideo.invalidate({ videoId: data.videoId });
         utils.playlists.getMany.invalidate();
         utils.playlists.getOne.invalidate({ id: data.playlistId });
         utils.playlists.getVideos.invalidate({ playlistId: data.playlistId });
      },
      onError: (error) => {
         toast.error(error.message);
      },
   });

   function handleRemoveVideo(videoId: string) {
      if (sectionType !== "custom" || !playlistId) return;
      removeVideo.mutate({ videoId, playlistId });
   }

   return (
      <>
         {/* {(sectionType === "history" || sectionType === "liked") && ( */}
         <>
            <div className=" flex flex-col md:hidden gap-4 gap-y-10">
               {videos.pages
                  .flatMap((page) => page.items)
                  .map((video) => (
                     <VideoGridCard
                        key={video.id}
                        data={video}
                        onRemove={
                           sectionType === "custom"
                              ? () => handleRemoveVideo(video.id)
                              : undefined
                        }
                     />
                  ))}
            </div>
            <div className="flex-col md:flex gap-4 ">
               {videos.pages
                  .flatMap((page) => page.items)
                  .map((video) => (
                     <VideoRowCard
                        key={video.id}
                        data={video}
                        size="compact"
                        onRemove={
                           sectionType === "custom"
                              ? () => handleRemoveVideo(video.id)
                              : undefined
                        }
                     />
                  ))}
            </div>
         </>
         {/* )} */}
         <InfiniteScroll
            hasNextPage={query.hasNextPage}
            isFetchingNextPage={query.isFetchingNextPage}
            fetchNextPage={query.fetchNextPage}
         />
      </>
   );
}

function PlaylistVideoSectionSkeleton() {
   return (
      <>
         <div className="flex flex-col md:hidden gap-4 gap-y-10">
            {Array.from({ length: 18 }).map((_, video) => (
               <VideoGridCardSkeleton key={video} />
            ))}
         </div>
         <div className="md:flex flex-col hidden gap-4">
            {Array.from({ length: 18 }).map((_, video) => (
               <VideoRowCardSkeleton key={video} size="compact" />
            ))}
         </div>
      </>
   );
}
