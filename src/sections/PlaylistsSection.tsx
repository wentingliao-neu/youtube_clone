"use client";
import InfiniteScroll from "@/components/common/InfiniteScroll";
import PlaylistGridCard, {
   PlaylistGridCardSkeleton,
} from "@/components/playlists/PlaylistGridCard";
import { DEFAULT_LIMIT } from "@/constants";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export default function PlaylistsSection() {
   return (
      <Suspense fallback={<PlaylistsSectionSkeleton />}>
         <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <PlaylistsSectionSuspense />
         </ErrorBoundary>
      </Suspense>
   );
}

function PlaylistsSectionSuspense() {
   const [playlists, query] = trpc.playlists.getMany.useSuspenseInfiniteQuery(
      {
         limit: DEFAULT_LIMIT,
      },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
   );

   return (
      <>
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 [@media(min-width:1920px)]:grid-cols-5 [@media(min-width:2200px)]:grid-cols-6 gap-4 gap-y-10">
            {playlists.pages
               .flatMap((page) => page.items)
               .map((list) => (
                  <PlaylistGridCard key={list.id} data={list} />
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

function PlaylistsSectionSkeleton() {
   return (
      <div className=" grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 [@media(min-width:1920px)]:grid-cols-5 [@media(min-width:2200px)]:grid-cols-6 gap-y-10">
         {Array.from({ length: 18 }).map((_, video) => (
            <PlaylistGridCardSkeleton key={video} />
         ))}
      </div>
   );
}
