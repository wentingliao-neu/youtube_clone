"use client";
import InfiniteScroll from "@/components/common/InfiniteScroll";

import { DEFAULT_LIMIT } from "@/constants";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import StreamGridCard, {
   StreamGridCardSkeleton,
} from "@/components/stream/StreamGridCard";

export default function HomeStreamsSection() {
   return (
      <Suspense fallback={<HomeVideosSectionSkeleton isUser={false} />}>
         <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <HomeStreamsSectionSuspense />
         </ErrorBoundary>
      </Suspense>
   );
}

function HomeStreamsSectionSuspense() {
   const [data, query] = trpc.streams.getMany.useSuspenseInfiniteQuery(
      {
         limit: DEFAULT_LIMIT,
      },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
   );

   return (
      <>
         <div
            className={cn(
               "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4  gap-4 gap-y-10",
               true &&
                  " [@media(min-width:1920px)]:grid-cols-5 [@media(min-width:2200px)]:grid-cols-6"
            )}
         >
            {data.pages.flatMap((page) =>
               page.items.map((stream) => (
                  <StreamGridCard
                     key={stream.id}
                     data={stream}
                     viewerCount={page.watchers?.get(stream.id)}
                  />
               ))
            )}
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
         {Array.from({ length: 18 }).map((_, stream) => (
            <StreamGridCardSkeleton key={stream} />
         ))}
      </div>
   );
}
