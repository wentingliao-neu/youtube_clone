"use client";
import InfiniteScroll from "@/components/common/InfiniteScroll";
import VideoGridCard, {
   VideoGridCardSkeleton,
} from "@/components/videos/VideoGridCard";
import { DEFAULT_LIMIT } from "@/constants";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface HomeVideosSectionProps {
   categoryId?: string;
   userId?: string;
   sectionType: "home" | "trending" | "subscription" | "history" | "user";
}
export default function HomeVideosSection({
   categoryId,
   userId,
   sectionType,
}: HomeVideosSectionProps) {
   return (
      <Suspense
         fallback={
            <HomeVideosSectionSkeleton isUser={sectionType === "user"} />
         }
         key={categoryId}
      >
         <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <HomeVideosSectionSuspense
               categoryId={categoryId}
               sectionType={sectionType}
               userId={userId}
            />
         </ErrorBoundary>
      </Suspense>
   );
}

function HomeVideosSectionSuspense({
   categoryId,
   userId,
   sectionType,
}: HomeVideosSectionProps) {
   const [videos, query] = (() => {
      switch (sectionType) {
         case "subscription":
            return trpc.videos.getManySubscribed.useSuspenseInfiniteQuery(
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
         default:
            return trpc.videos.getMany.useSuspenseInfiniteQuery(
               {
                  categoryId,
                  limit: DEFAULT_LIMIT,
                  userId,
                  isTrending: sectionType === "trending",
               },
               { getNextPageParam: (lastPage) => lastPage.nextCursor }
            );
      }
   })();
   return (
      <>
         <div
            className={cn(
               "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4  gap-4 gap-y-10",
               sectionType !== "user" &&
                  " [@media(min-width:1920px)]:grid-cols-5 [@media(min-width:2200px)]:grid-cols-6"
            )}
         >
            {videos.pages
               .flatMap((page) => page.items)
               .map((video) => (
                  <VideoGridCard key={video.id} data={video} />
               ))}
         </div>
         <InfiniteScroll
            hasNextPage={query.hasNextPage}
            isFetchingNextPage={query.isFetchingNextPage}
            fetchNextPage={query.fetchNextPage}
         />
      </>
   );
}

function HomeVideosSectionSkeleton({ isUser }: { isUser: boolean }) {
   return (
      <div
         className={cn(
            "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4  gap-4 gap-y-10",
            !isUser &&
               "[@media(min-width:1920px)]:grid-cols-5 [@media(min-width:2200px)]:grid-cols-6"
         )}
      >
         {Array.from({ length: 18 }).map((_, video) => (
            <VideoGridCardSkeleton key={video} />
         ))}
      </div>
   );
}
