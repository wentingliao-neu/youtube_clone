import ResponsiveModal from "@/components/common/ResponsiveModal";
import { UploadDropzone } from "@/lib/uploadthing";
import { trpc } from "@/trpc/client";

interface ThumbnailUploadModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   videoId: string;
}

export default function ThumbnailUploadModal({
   open,
   onOpenChange,
   videoId,
}: ThumbnailUploadModalProps) {
   const utils = trpc.useUtils();

   function onSuccess() {
      onOpenChange(false);
      utils.studio.getOne.invalidate({ id: videoId });
      utils.studio.getMany.invalidate();
   }
   return (
      <ResponsiveModal
         title="Upload a thumbnail"
         open={open}
         onOpenChange={onOpenChange}
      >
         <UploadDropzone
            endpoint="thumbnailUploader"
            input={{ videoId }}
            onClientUploadComplete={onSuccess}
         />
      </ResponsiveModal>
   );
}
