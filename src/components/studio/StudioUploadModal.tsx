"use client";

import ResponsiveModal from "@/components/common/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import StudioUploader from "./StudioUploader";
import { useRouter } from "next/navigation";

export default function StudioUploadModal() {
   //update data
   const utils = trpc.useUtils();
   const create = trpc.videos.create.useMutation({
      onSuccess: () => {
         utils.studio.getMany.invalidate();
         toast.success("Video created");
      },
      onError: (err) => {
         toast.error(err.message);
      },
   });

   const router = useRouter();
   function onSuccess() {
      if (!create.data?.video[0]?.id) return;
      create.reset();
      router.push(`/studio/videos/${create.data.video[0].id}`);
   }

   return (
      <>
         <ResponsiveModal
            title="Upload a video"
            open={!!create.data?.url}
            onOpenChange={() => create.reset()}
         >
            {create.data?.url ? (
               <StudioUploader
                  endpoint={create.data?.url}
                  onSuccess={onSuccess}
               />
            ) : (
               <Loader2Icon className=" animate-spin" />
            )}
         </ResponsiveModal>
         <Button
            variant="secondary"
            onClick={() => create.mutate()}
            disabled={create.isPending}
         >
            {create.isPending ? (
               <Loader2Icon className=" animate-spin" />
            ) : (
               <PlusIcon />
            )}
            Create
         </Button>
      </>
   );
}
