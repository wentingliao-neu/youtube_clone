"use client";
import InfiniteScroll from "@/components/common/InfiniteScroll";
import SubscriptionItem, {
   SubscriptionItemSkeleton,
} from "@/components/subscriptions/SubscriptionItem";
import { DEFAULT_LIMIT } from "@/constants";
import { trpc } from "@/trpc/client";
import Link from "next/link";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";

export default function SubscriptionUserSection() {
   return (
      <Suspense fallback={<SubscriptionUserSectionSkeleton />}>
         <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <SubscriptionUserSectionSuspense />
         </ErrorBoundary>
      </Suspense>
   );
}

function SubscriptionUserSectionSuspense() {
   const utils = trpc.useUtils();
   const [subscriptions, query] =
      trpc.subscriptions.getMany.useSuspenseInfiniteQuery(
         {
            limit: DEFAULT_LIMIT,
         },
         { getNextPageParam: (lastPage) => lastPage.nextCursor }
      );
   const unsubscribe = trpc.subscriptions.remove.useMutation({
      onSuccess: (data) => {
         toast.success("Unsubscribed successfully");
         utils.videos.getManySubscribed.invalidate();
         utils.users.getOne.invalidate({ id: data.creatorId });
         utils.subscriptions.getMany.invalidate();
      },
      onError: (error) => {
         toast.error(error.message);
      },
   });
   return (
      <>
         <div className=" flex flex-col  gap-4 ">
            {subscriptions.pages
               .flatMap((page) => page.items)
               .map((item) => (
                  <Link
                     prefetch
                     href={`/users/${item.user.id}`}
                     key={item.user.id}
                  >
                     <SubscriptionItem
                        name={item.user.name}
                        imageUrl={item.user.imageUrl}
                        subscriberCount={item.user.subscriberCount}
                        onUnsubscribe={() =>
                           unsubscribe.mutate({ userId: item.user.id })
                        }
                        disabled={unsubscribe.isPending}
                     />
                  </Link>
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

function SubscriptionUserSectionSkeleton() {
   return (
      <div className="flex flex-col  gap-4 ">
         {Array.from({ length: 18 }).map((_, video) => (
            <SubscriptionItemSkeleton key={video} />
         ))}
      </div>
   );
}
