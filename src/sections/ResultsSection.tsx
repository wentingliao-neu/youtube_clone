"use client";

import InfiniteScroll from "@/components/common/InfiniteScroll";
import VideoGridCard, {
   VideoGridCardSkeleton,
} from "@/components/videos/VideoGridCard";
import VideoRowCard, {
   VideoRowCardSkeleton,
} from "@/components/videos/VideoRowCard";
import { DEFAULT_LIMIT } from "@/constants";
import { useIsMobile } from "@/hooks/use-mobile";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface ResultsSectionProps {
   query: string | undefined;
   categoryId: string | undefined;
   isManual?: boolean;
}
function ResultsSectionSuspense({ query, categoryId }: ResultsSectionProps) {
   const isMobile = useIsMobile();
   const [results, resultsQuery] = trpc.search.getMany.useSuspenseInfiniteQuery(
      { query, categoryId, limit: DEFAULT_LIMIT },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
   );
   return (
      <>
         {isMobile ? (
            <div className=" flex flex-col gap-4 gap-y-10">
               {results.pages
                  .flatMap((page) => page.items)
                  .map((video) => (
                     <VideoGridCard key={video.id} data={video} />
                  ))}
            </div>
         ) : (
            <div className=" flex flex-col gap-4 ">
               {results.pages
                  .flatMap((page) => page.items)
                  .map((video) => (
                     <VideoRowCard key={video.id} data={video} />
                  ))}
            </div>
         )}
         <InfiniteScroll
            hasNextPage={resultsQuery.hasNextPage}
            isFetchingNextPage={resultsQuery.isFetchingNextPage}
            fetchNextPage={resultsQuery.fetchNextPage}
         />
      </>
   );
}

export default function ResultsSection({
   query,
   categoryId,
}: ResultsSectionProps) {
   return (
      <Suspense
         fallback={<ResultsSectionSkeleton />}
         key={`${query}-${categoryId}`}
      >
         <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <ResultsSectionSuspense query={query} categoryId={categoryId} />
         </ErrorBoundary>
      </Suspense>
   );
}

function ResultsSectionSkeleton() {
   return (
      <>
         <div className="hidden md:flex gap-4 flex-col ">
            {Array.from({ length: 5 }).map((_, index) => (
               <VideoRowCardSkeleton key={index} size="compact" />
            ))}
         </div>
         <div className=" flex flex-col gap-4 p-4 md:hidden gap-y-10 pt-6">
            {Array.from({ length: 5 }).map((_, index) => (
               <VideoGridCardSkeleton key={index} />
            ))}
         </div>
      </>
   );
}
