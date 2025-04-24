import ResponsiveModal from "@/components/common/ResponsiveModal";
import { UploadDropzone } from "@/lib/uploadthing";
import { trpc } from "@/trpc/client";

interface ImageUploadModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   videoId?: string;
   userId?: string | null;
   modalType: "video" | "banner" | "room";
}

export default function ImageUploadModal({
   open,
   onOpenChange,
   videoId,
   userId,
   modalType,
}: ImageUploadModalProps) {
   const utils = trpc.useUtils();

   function onSuccess() {
      onOpenChange(false);
      if (videoId) {
         utils.studio.getOne.invalidate({ id: videoId });
         utils.studio.getMany.invalidate();
      }
      if (userId) utils.users.getOne.invalidate({ id: userId });
   }
   return (
      <ResponsiveModal
         title={
            modalType === "video"
               ? "Upload Thumbnail"
               : modalType === "banner"
               ? "Upload a banner"
               : "Upload Image"
         }
         open={open}
         onOpenChange={onOpenChange}
      >
         {videoId && (
            <UploadDropzone
               endpoint="thumbnailUploader"
               input={{ videoId }}
               onClientUploadComplete={onSuccess}
            />
         )}
         {userId && modalType === "banner" && (
            <UploadDropzone
               endpoint="bannerUploader"
               onClientUploadComplete={onSuccess}
            />
         )}
         {userId && modalType === "room" && (
            <UploadDropzone
               endpoint="roomThumbnailUploader"
               onClientUploadComplete={onSuccess}
            />
         )}
      </ResponsiveModal>
   );
}
