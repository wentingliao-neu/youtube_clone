import { trpc } from "@/trpc/client";
import { useClerk } from "@clerk/nextjs";
import { toast } from "sonner";
interface SubscriptionButtonProps {
   userId: string;
   isSubscribed: boolean;
   fromVideoId?: string;
}

export const useSubscription = ({
   userId,
   isSubscribed,
   fromVideoId,
}: SubscriptionButtonProps) => {
   const clerk = useClerk();
   const utils = trpc.useUtils();
   const subscribe = trpc.subscriptions.create.useMutation({
      onSuccess: () => {
         toast.success("Subscribed successfully");
         utils.videos.getManySubscribed.invalidate();
         utils.users.getOne.invalidate({ id: userId });
         utils.subscriptions.getMany.invalidate();
         if (fromVideoId) {
            utils.videos.getOne.invalidate({ id: fromVideoId });
         }
      },
      onError: (error) => {
         toast.error(error.message);
         if (error.data?.code === "UNAUTHORIZED") clerk.openSignIn();
      },
   });
   const unsubscribe = trpc.subscriptions.remove.useMutation({
      onSuccess: () => {
         toast.success("Unsubscribed successfully");
         utils.videos.getManySubscribed.invalidate();
         utils.users.getOne.invalidate({ id: userId });
         utils.subscriptions.getMany.invalidate();
         if (fromVideoId) {
            utils.videos.getOne.invalidate({ id: fromVideoId });
         }
      },
      onError: (error) => {
         toast.error(error.message);
         if (error.data?.code === "UNAUTHORIZED") clerk.openSignIn();
      },
   });
   const isPending = subscribe.isPending || unsubscribe.isPending;

   function onClick() {
      if (isSubscribed) unsubscribe.mutate({ userId });
      else subscribe.mutate({ userId });
   }

   return { isPending, onClick };
};
