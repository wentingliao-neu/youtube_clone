import { UserGetOneOutput } from "@/types";
import UserAvatar from "../common/UserAvatar";
import { useAuth, useClerk } from "@clerk/nextjs";
import { Button } from "../ui/button";
import Link from "next/link";
import SubscriptionButton from "../subscriptions/SubscriptionButton";
import { useSubscription } from "@/hooks/use-subscription";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import BlockButton from "../block/BlockButton";
import { useBlock } from "@/hooks/use-block";
import LiveBadge from "../stream/LiveBadge";
import { ExternalLink } from "lucide-react";

interface UserPageInfoProps {
   user: UserGetOneOutput;
}
export default function UserPageInfo({ user }: UserPageInfoProps) {
   const clerk = useClerk();
   const { userId, isLoaded } = useAuth();
   const { isPending: isSubPending, onClick: onClickSub } = useSubscription({
      userId: user.id,
      isSubscribed: user.viewerSubscribed,
   });
   const { isPending: isBlockPending, onClick: onClickBlock } = useBlock({
      userId: user.id,
      isBlocked: user.viewerBlocked,
   });
   return (
      <div className=" py-6">
         <div className=" flex flex-col md:hidden">
            <div className=" flex items-center gap-3">
               <UserAvatar
                  size={"lg"}
                  imageUrl={user.imageUrl}
                  className="h-[60px] w-[60px]"
                  name={user.name}
                  isLive={user.isLive}
                  onClick={() => {
                     if (user.clerkId === userId) clerk.openUserProfile({});
                  }}
               />
               {user.isLive && <LiveBadge />}
               <div className=" flex-1 min-w-0">
                  <h1 className=" text-xl font-bold">{user.name}</h1>
                  <div className=" flex items-center gap-1 text-xs text-muted-foreground mt-1">
                     <span>
                        {user.subscriberCount} subscribers &bull;{" "}
                        {user.videoCount} videos
                     </span>
                  </div>
               </div>
            </div>
            {user.clerkId === userId ? (
               <Button
                  variant="secondary"
                  asChild
                  className=" w-full mt-3 rounded-full"
               >
                  <Link prefetch href={"/studio"}>
                     Go to studio
                  </Link>
               </Button>
            ) : (
               <>
                  <SubscriptionButton
                     onClick={onClickSub}
                     disabled={isSubPending || !isLoaded}
                     isSubscribed={user.viewerSubscribed}
                     className=" mt-3"
                  />
                  <BlockButton
                     style="full"
                     onClick={onClickBlock}
                     disabled={isBlockPending || !isLoaded}
                     isBlocked={user.viewerBlocked}
                     className=" mt-3"
                  />
                  {user.isLive && (
                     <Link
                        prefetch
                        href={`/stream/${user.id}`}
                        className={
                           "bg-rose-500 text-center p-0.5 px-1.5 rounded-md uppercase text-[10px] border border-background font-semibold mt-3"
                        }
                     >
                        Go to stream room
                     </Link>
                  )}
               </>
            )}
         </div>
         {/* Desktop layout */}
         <div className="hidden md:flex items-start gap-4 justify-center">
            <UserAvatar
               size={"xl"}
               imageUrl={user.imageUrl}
               className={cn(
                  user.clerkId === userId &&
                     "cursor-pointer hover:opacity-80 transition-opacity duration-300"
               )}
               name={user.name}
               onClick={() => {
                  if (user.clerkId === userId) clerk.openUserProfile({});
               }}
               isLive={user.isLive}
            />

            <div className=" flex-1 min-w-0">
               <div className=" flex items-center gap-2">
                  <h1 className=" text-4xl font-bold">{user.name}</h1>
                  {user.isLive && (
                     <Link prefetch href={`/stream/${user.id}`}>
                        <Button
                           variant="secondary"
                           className={
                              "bg-rose-500 text-center p-0.5 px-1.5 rounded-md  border border-background font-semibold "
                           }
                        >
                           <ExternalLink className=" size-4" />
                           Go to stream room
                        </Button>
                     </Link>
                  )}
               </div>
               <div className=" flex items-center gap-1 text-sm text-muted-foreground mt-3">
                  <span>
                     {user.subscriberCount} subscribers &bull; {user.videoCount}{" "}
                     videos
                  </span>
               </div>
               {user.clerkId === userId ? (
                  <Button
                     variant="secondary"
                     asChild
                     className="mt-3 rounded-full"
                  >
                     <Link prefetch href={"/studio"}>
                        Go to studio
                     </Link>
                  </Button>
               ) : (
                  <>
                     <SubscriptionButton
                        onClick={onClickSub}
                        disabled={isSubPending || !isLoaded}
                        isSubscribed={user.viewerSubscribed}
                        className="mt-3 w-24 mr-2"
                     />
                     <BlockButton
                        style="full"
                        onClick={onClickBlock}
                        disabled={isBlockPending || !isLoaded}
                        isBlocked={user.viewerBlocked}
                        className="mt-3 w-24"
                     />
                  </>
               )}
            </div>
         </div>
      </div>
   );
}

export const UserPageInfoSkeleton = () => {
   return (
      <div className="py-6">
         {/* Mobile layout */}
         <div className="flex flex-col md:hidden">
            <div className="flex items-center gap-3">
               <Skeleton className="h-[60px] w-[60px] rounded-full" />
               <div className="flex-1 min-w-0">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48 mt-1" />
               </div>
            </div>
            <Skeleton className="h-10 w-full mt-3 rounded-full" />
         </div>
         <div className="hidden md:flex items-start gap-4">
            <Skeleton className="h-[160px] w-[160px] rounded-full" />
            <div className="flex-1 min-w-0">
               <Skeleton className="h-8 w-64" />
               <Skeleton className="h-5 w-48 mt-4" />
               <Skeleton className="h-10 w-32 mt-3 rounded-full" />
            </div>
         </div>
      </div>
   );
};
