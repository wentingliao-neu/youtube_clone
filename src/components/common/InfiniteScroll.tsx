import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useEffect } from "react";
import { Button } from "../ui/button";

interface InfiniteScrollProps {
   isManual?: boolean;
   hasNextPage: boolean;
   fetchNextPage: () => void;
   isFetchingNextPage: boolean;
}
export default function InfiniteScroll({
   isManual = false,
   hasNextPage,
   fetchNextPage,
   isFetchingNextPage,
}: InfiniteScrollProps) {
   const { targetRef, isIntersecting } = useIntersectionObserver({
      threshold: 0.5,
      rootMargin: "100px",
   });

   useEffect(() => {
      if (isIntersecting && !isFetchingNextPage && hasNextPage && !isManual)
         fetchNextPage();
   }, [
      hasNextPage,
      fetchNextPage,
      isManual,
      isIntersecting,
      isFetchingNextPage,
   ]);

   return (
      <div className=" flex flex-col items-center gap-4 p-4">
         <div ref={targetRef} className=" h-1">
            {hasNextPage ? (
               <Button
                  variant="secondary"
                  disabled={!hasNextPage || isFetchingNextPage}
                  onClick={() => fetchNextPage()}
               >
                  {isFetchingNextPage ? "Loading" : "Load more"}
               </Button>
            ) : (
               <p className=" text-sm text-muted-foreground">
                  You have reached the end of list
               </p>
            )}
         </div>
      </div>
   );
}
