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

interface SuggestionsSectionProps {
   videoId: string;
   isManual?: boolean;
}

export default function SuggestionsSection({
   videoId,
   isManual,
}: SuggestionsSectionProps) {
   return (
      <Suspense fallback={<SuggestionsSectionSkeleton />}>
         <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <SuggestionsSectionSuspense videoId={videoId} isManual={isManual} />
         </ErrorBoundary>
      </Suspense>
   );
}

function SuggestionsSectionSuspense({
   videoId,
   isManual,
}: SuggestionsSectionProps) {
   const [suggestions, query] =
      trpc.suggestions.getMany.useSuspenseInfiniteQuery(
         {
            videoId,
            limit: DEFAULT_LIMIT,
         },

         { getNextPageParam: (lastPage) => lastPage.nextCursor }
      );
   return (
      <>
         <div className=" hidden md:block space-y-3">
            {suggestions.pages
               .flatMap((page) => page.items)
               .map((video) => (
                  <VideoRowCard key={video.id} data={video} size={"compact"} />
               ))}
         </div>
         <div className=" md:hidden block space-y-10">
            {suggestions.pages
               .flatMap((page) => page.items)
               .map((video) => (
                  <VideoGridCard key={video.id} data={video} />
               ))}
         </div>
         <InfiniteScroll
            hasNextPage={query.hasNextPage}
            isFetchingNextPage={query.isFetchingNextPage}
            fetchNextPage={query.fetchNextPage}
            isManual={isManual}
         />
      </>
   );
}

function SuggestionsSectionSkeleton() {
   return (
      <>
         <div className="hidden md:block space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
               <VideoRowCardSkeleton key={index} size="compact" />
            ))}
         </div>
         <div className="block md:hidden space-y-10">
            {Array.from({ length: 6 }).map((_, index) => (
               <VideoGridCardSkeleton key={index} />
            ))}
         </div>
      </>
   );
}
