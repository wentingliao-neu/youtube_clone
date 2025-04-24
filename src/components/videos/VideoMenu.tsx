import { Button } from "@/components/ui/button";
import {
   DropdownMenu,
   DropdownMenuTrigger,
   DropdownMenuContent,
   DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { APP_URL } from "@/constants";
import {
   ListPlusIcon,
   MoreVerticalIcon,
   ShareIcon,
   Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import PlaylistAddModal from "../playlists/PlaylistAddModal";

interface VideoMenuProps {
   videoId: string;
   variant?: "ghost" | "secondary";
   onRemove?: () => void;
}

export default function VideoMenu({
   videoId,
   variant = "ghost",
   onRemove,
}: VideoMenuProps) {
   const onShare = () => {
      const fullUrl = `${APP_URL}/videos/${videoId}`;
      navigator.clipboard.writeText(fullUrl);
      toast.success("Link copied to clipboard");
   };
   const [isOpen, setIsOpen] = useState(false);
   return (
      <>
         <PlaylistAddModal
            open={isOpen}
            onOpenChange={setIsOpen}
            videoId={videoId}
            // onSuccess={() => toast.success("Video added to playlist")}
         />
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button variant={variant} size="icon" className=" rounded-full">
                  <MoreVerticalIcon />
               </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
               align="end"
               onClick={(e) => e.stopPropagation()}
            >
               <DropdownMenuItem onClick={onShare}>
                  <ShareIcon className="mr-2 size-4" />
                  Share
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => setIsOpen(true)}>
                  <ListPlusIcon className="mr-2 size-4" />
                  Add to playlist
               </DropdownMenuItem>
               {onRemove && (
                  <DropdownMenuItem onClick={onRemove}>
                     <Trash2Icon className="mr-2 size-4" />
                     Remove
                  </DropdownMenuItem>
               )}
            </DropdownMenuContent>
         </DropdownMenu>
      </>
   );
}
