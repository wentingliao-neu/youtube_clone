"use client";

import UserAvatar, { UserAvatarSkeleton } from "@/components/common/UserAvatar";

import { Check, UserIcon } from "lucide-react";
// import Actions, { ActionsSkeleton } from "./Actions";
import { Skeleton } from "@/components/ui/skeleton";
import SubscriptionButton from "../subscriptions/SubscriptionButton";
import { useSubscription } from "@/hooks/use-subscription";

interface HeaderProps {
   hostName: string;
   isLive: boolean;
   participantCount?: number;
   imageUrl: string;
   isFollowing: boolean;
   streamName: string;
   hostId: string;
}
export default function Header({
   hostName,
   isLive,
   participantCount,
   imageUrl,
   isFollowing,
   streamName,
   hostId,
}: HeaderProps) {
   const { isPending, onClick } = useSubscription({
      userId: hostId,
      isSubscribed: false,
   });
   return (
      <div className=" flex  items-center justify-between px-4 gap-y-2">
         <div className=" flex items-center gap-x-3">
            <UserAvatar
               imageUrl={imageUrl}
               name={hostName}
               size="lg"
               isLive={isLive}
            />
            <div className=" space-y-1 ">
               <div className=" flex items-center gap-x-2">
                  <h2 className=" text-lg font-semibold">{hostName}</h2>
                  <div className=" p-0.5 flex items-center justify-center h-4 w-4 rounded-full bg-blue-600">
                     <Check className=" h-[10px] w-[10px] text-primary stroke-[4px]" />
                  </div>
               </div>
               <div className="flex items-center gap-x-1">
                  <p className="text-sm font-semibold">{streamName}</p>
                  {isLive ? (
                     <div className=" font-semibold flex gap-x-1 items-center text-xs text-rose-500">
                        <UserIcon className=" h-4 w-4" />
                        <p>
                           {`${participantCount} Viewer${
                              participantCount === 1 ? "" : "s"
                           }`}
                        </p>
                     </div>
                  ) : (
                     <p className=" font-semibold text-xs text-muted-foreground">
                        Offline
                     </p>
                  )}
               </div>
            </div>
         </div>
         <SubscriptionButton
            size="sm"
            onClick={onClick}
            disabled={isPending}
            isSubscribed={isFollowing}
         />
      </div>
   );
}

export function HeaderSkeleton() {
   return (
      <div className=" flex flex-col lg:flex-row items-start justify-between px-4">
         <div className=" flex items-center gap-x-2">
            <UserAvatarSkeleton size="lg" />
            <div className=" space-y-2">
               <Skeleton className=" h-6 w-32" />
               <Skeleton className=" h-4 w-24" />
            </div>
         </div>
         <Skeleton className=" w-full h-10 lg:w-24" />
      </div>
   );
}
