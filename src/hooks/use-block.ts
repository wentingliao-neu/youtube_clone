import { trpc } from "@/trpc/client";
import { useClerk } from "@clerk/nextjs";
import { toast } from "sonner";
interface BlockButtonProps {
   userId: string;
   isBlocked: boolean;
}

export const useBlock = ({ userId, isBlocked }: BlockButtonProps) => {
   const clerk = useClerk();
   const utils = trpc.useUtils();
   const block = trpc.blocks.create.useMutation({
      onSuccess: () => {
         toast.success("Blocked successfully");
         utils.videos.getManySubscribed.invalidate();
         utils.users.getOne.invalidate({ id: userId });
         utils.blocks.getMany.invalidate();
         utils.streams.getOneByUserId.invalidate({ id: userId });
         //  if (fromVideoId) {
         //     utils.videos.getOne.invalidate({ id: fromVideoId });
         //  }
      },
      onError: (error) => {
         toast.error(error.message);
         if (error.data?.code === "UNAUTHORIZED") clerk.openSignIn();
      },
   });
   const unblock = trpc.blocks.delete.useMutation({
      onSuccess: () => {
         toast.success("Unblocked successfully");
         utils.videos.getManySubscribed.invalidate();
         utils.users.getOne.invalidate({ id: userId });
         utils.blocks.getMany.invalidate();
         utils.streams.getOneByUserId.invalidate({ id: userId });
         //  if (fromVideoId) {
         //     utils.videos.getOne.invalidate({ id: fromVideoId });
         //  }
      },
      onError: (error) => {
         toast.error(error.message);
         if (error.data?.code === "UNAUTHORIZED") clerk.openSignIn();
      },
   });
   const isPending = block.isPending || unblock.isPending;

   function onClick() {
      if (isBlocked) unblock.mutate({ id: userId });
      else block.mutate({ id: userId });
   }

   return { isPending, onClick };
};
