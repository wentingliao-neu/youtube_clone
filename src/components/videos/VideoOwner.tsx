import Link from "next/link";
import { VideoGetOneOutput } from "../../types";
import UserAvatar from "@/components/common/UserAvatar";
import { useAuth } from "@clerk/nextjs";
import { useSubscription } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import SubscriptionButton from "../subscriptions/SubscriptionButton";
import UserInfo from "../users/UserInfo";

interface VideoOwnerProps {
   user: VideoGetOneOutput["user"];
   videoId: string;
}
export default function VideoOwner({ user, videoId }: VideoOwnerProps) {
   const { userId, isLoaded } = useAuth();
   const { isPending, onClick } = useSubscription({
      userId: user.clerkId,
      isSubscribed: user.viewerSubscribed,
      fromVideoId: videoId,
   });

   return (
      <div className=" flex items-center sm:items-start justify-between sm:justify-start gap-3 min-w-0">
         <Link prefetch href={`/users/${user.id}`}>
            <div className=" flex items-center gap-3 min-w-0">
               <UserAvatar
                  size="lg"
                  name={user.name}
                  imageUrl={user.imageUrl}
               />
               <div className=" flex flex-col gap-1 min-w-0">
                  <UserInfo name={user.name} size="lg" />
                  <span className=" text-sm text-muted-foreground line-clamp-1">
                     {user.subscriberCount} subscribers
                  </span>
               </div>
            </div>
         </Link>
         {userId === user.clerkId ? (
            <Button className=" rounded-full" asChild variant={"secondary"}>
               <Link prefetch href={`/studio/videos/${videoId}`}>
                  Edit Video
               </Link>
            </Button>
         ) : (
            <SubscriptionButton
               onClick={onClick}
               disabled={isPending || !isLoaded}
               isSubscribed={user.viewerSubscribed}
               className=" flex-none"
            />
         )}
      </div>
   );
}
