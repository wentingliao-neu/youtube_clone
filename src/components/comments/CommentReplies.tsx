import { DEFAULT_LIMIT } from "@/constants";
import { trpc } from "@/trpc/client";
import { CornerDownRightIcon, Loader2Icon } from "lucide-react";
import CommentItem from "./CommentItem";
import { Button } from "../ui/button";

interface CommentRepliesProps {
   parentId: string;
   videoId: string;
}

export default function CommentReplies({
   parentId,
   videoId,
}: CommentRepliesProps) {
   const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
      trpc.comments.getMany.useInfiniteQuery(
         {
            limit: DEFAULT_LIMIT,
            videoId,
            parentId,
         },
         { getNextPageParam: (lastPage) => lastPage.nextCursor }
      );
   return (
      <div className=" pl-14">
         <div className=" flex flex-col gap-4 mt-2">
            {isLoading ? (
               <div className=" flex justify-center items-center ">
                  <Loader2Icon className=" animate-spin text-muted-foreground size-6" />
               </div>
            ) : (
               data?.pages
                  .flatMap((page) => page.items)
                  .map((comment) => (
                     <CommentItem key={comment.id} comment={comment} />
                  ))
            )}
         </div>
         {hasNextPage && (
            <Button
               variant={"territory"}
               size={"sm"}
               onClick={() => fetchNextPage()}
               disabled={isFetchingNextPage}
            >
               <CornerDownRightIcon />
               Show more replies
            </Button>
         )}
      </div>
   );
}
