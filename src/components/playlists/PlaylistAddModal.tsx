import ResponsiveModal from "@/components/common/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { Loader2Icon, SquareCheckIcon, SquareIcon } from "lucide-react";
import InfiniteScroll from "../common/InfiniteScroll";
import { toast } from "sonner";

interface PlaylistAddModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   videoId: string;
}

export default function PlaylistAddModal({
   open,
   onOpenChange,
   videoId,
}: PlaylistAddModalProps) {
   const {
      data: playlists,
      isLoading,
      hasNextPage,
      isFetchingNextPage,
      fetchNextPage,
   } = trpc.playlists.getManyVideo.useInfiniteQuery(
      {
         limit: DEFAULT_LIMIT,
         videoId,
      },
      {
         getNextPageParam: (lastPage) => lastPage.nextCursor,
         enabled: !!videoId && open,
      }
   );

   const utils = trpc.useUtils();

   const addVideo = trpc.playlists.addVideo.useMutation({
      onSuccess: (data) => {
         toast.success("Video added to playlist");
         utils.playlists.getManyVideo.invalidate({ videoId });
         utils.playlists.getMany.invalidate();
         utils.playlists.getOne.invalidate({ id: data.playlistId });
         utils.playlists.getVideos.invalidate({ playlistId: data.playlistId });
      },
      onError: (error) => {
         toast.error(error.message);
      },
   });

   const removeVideo = trpc.playlists.removeVideo.useMutation({
      onSuccess: (data) => {
         toast.success("Video removed to playlist");
         utils.playlists.getManyVideo.invalidate({ videoId });
         utils.playlists.getMany.invalidate();
         utils.playlists.getOne.invalidate({ id: data.playlistId });
         utils.playlists.getVideos.invalidate({ playlistId: data.playlistId });
      },
      onError: (error) => {
         toast.error(error.message);
      },
   });

   function handleOpenChange(newOpen: boolean) {
      utils.playlists.getManyVideo.reset({ videoId });
      onOpenChange(newOpen);
   }

   // function onSubmit(values: z.infer<typeof formSchema>) {
   //    Add.mutate({ name: values.name });
   //    form.reset();
   //    onOpenChange(false);
   //    // utils.studio.getOne.invalidate({ id: videoId });
   //    // utils.studio.getMany.invalidate();
   // }
   return (
      <ResponsiveModal
         title="Add to Playlist"
         open={open}
         onOpenChange={handleOpenChange}
      >
         <div className=" flex flex-col gap-2">
            {isLoading ? (
               <div className=" flex justify-center p-4">
                  <Loader2Icon className=" animate-spin text-muted-foreground size-5" />
               </div>
            ) : (
               playlists?.pages
                  .flatMap((page) => page.items)
                  .map((playlist) => (
                     <Button
                        onClick={() => {
                           if (playlist.containsVideo) {
                              removeVideo.mutate({
                                 videoId,
                                 playlistId: playlist.id,
                              });
                           } else {
                              addVideo.mutate({
                                 videoId,
                                 playlistId: playlist.id,
                              });
                           }
                        }}
                        disabled={addVideo.isPending || removeVideo.isPending}
                        variant={"ghost"}
                        className=" w-full justify-start px-2 [&_svg]:size-5"
                        size={"lg"}
                        key={playlist.id}
                     >
                        {playlist.containsVideo ? (
                           <SquareCheckIcon className=" mr-2" />
                        ) : (
                           <SquareIcon className=" mr-2" />
                        )}
                        {playlist.name}
                     </Button>
                  ))
            )}
            {!isLoading && (
               <InfiniteScroll
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  fetchNextPage={fetchNextPage}
                  isManual
               />
            )}
         </div>
      </ResponsiveModal>
   );
}
