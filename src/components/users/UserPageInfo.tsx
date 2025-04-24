import { UserGetOneOutput } from "@/types";
import UserAvatar from "../common/UserAvatar";
import { useAuth, useClerk } from "@clerk/nextjs";
import { Button } from "../ui/button";
import Link from "next/link";
import SubscriptionButton from "../subscriptions/SubscriptionButton";
import { useSubscription } from "@/hooks/use-subscription";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";

interface UserPageInfoProps {
   user: UserGetOneOutput;
}
export default function UserPageInfo({ user }: UserPageInfoProps) {
   const clerk = useClerk();
   const { userId, isLoaded } = useAuth();
   const { isPending, onClick } = useSubscription({
      userId: user.clerkId,
      isSubscribed: user.viewerSubscribed,
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
                  onClick={() => {
                     if (user.clerkId === userId) clerk.openUserProfile({});
                  }}
               />
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
               <SubscriptionButton
                  onClick={onClick}
                  disabled={isPending || !isLoaded}
                  isSubscribed={user.viewerSubscribed}
                  className="  w-full mt-3"
               />
            )}
         </div>
         <div className=" hidden md:flex  items-start gap-4 justify-center">
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
            />
            <div className=" flex-1 min-w-0">
               <h1 className=" text-4xl font-bold">{user.name}</h1>
               <div className=" flex items-center gap-1 text-sm text-muted-foreground mt-3">
                  <span>
                     {user.subscriberCount} subscribers &bull; {user.videoCount}
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
                  <SubscriptionButton
                     onClick={onClick}
                     disabled={isPending || !isLoaded}
                     isSubscribed={user.viewerSubscribed}
                     className="mt-3"
                  />
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
