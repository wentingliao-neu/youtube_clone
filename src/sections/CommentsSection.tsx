"use client";

import CommentForm from "@/components/comments/CommentForm";
import CommentItem from "@/components/comments/CommentItem";
import InfiniteScroll from "@/components/common/InfiniteScroll";
import { DEFAULT_LIMIT } from "@/constants";
import { trpc } from "@/trpc/client";
import { Loader2Icon } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

function CommentsSectionSuspense({ videoId }: { videoId: string }) {
   const [comments, query] = trpc.comments.getMany.useSuspenseInfiniteQuery(
      {
         videoId,
         limit: DEFAULT_LIMIT,
      },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
   );
   return (
      <div className="mt-6">
         <div className=" flex flex-col gap-6">
            <h1 className=" text-xl font-bold">
               {comments.pages[0].totalCount} Comments
            </h1>
            <CommentForm videoId={videoId} />
            <div className=" flex flex-col gap-4 mt-2">
               {comments.pages
                  .flatMap((page) => page.items)
                  .map((comment) => (
                     <CommentItem key={comment.id} comment={comment} />
                  ))}
               <InfiniteScroll
                  hasNextPage={query.hasNextPage}
                  isFetchingNextPage={query.isFetchingNextPage}
                  fetchNextPage={query.fetchNextPage}
               />
            </div>
         </div>
      </div>
   );
}

export default function CommentsSection({ videoId }: { videoId: string }) {
   return (
      <Suspense fallback={<CommentSectionSkeleton />}>
         <ErrorBoundary fallback={<div>Error loading comments</div>}>
            <CommentsSectionSuspense videoId={videoId} />
         </ErrorBoundary>
      </Suspense>
   );
}

function CommentSectionSkeleton() {
   return (
      <div className=" mt-6 flex justify-center items-center ">
         <Loader2Icon className=" animate-spin text-muted-foreground size-7" />
      </div>
   );
}
