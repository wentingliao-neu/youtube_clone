export const dynamic = "force-dynamic";
import { DEFAULT_LIMIT } from "@/constants";
import PlaylistHeaderSection from "@/sections/PlaylistHeaderSection";
import PlaylistVideosSection from "@/sections/PlaylistVideosSection";
import { HydrateClient, trpc } from "@/trpc/server";

export default async function page({
   params,
}: {
   params: Promise<{ playlistId: string }>;
}) {
   const { playlistId } = await params;
   void trpc.playlists.getVideos.prefetchInfinite({
      limit: DEFAULT_LIMIT,
      playlistId,
   });
   void trpc.playlists.getOne.prefetch({ id: playlistId });
   return (
      <HydrateClient>
         <div className=" max-w-screen-md mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6">
            {/* <div>
               <h1 className=" text-2xl font-bold">Custom playlist</h1>
               <p className=" text-xs text-muted-foreground">
                  Videos you have added to this playlist
               </p>
            </div> */}
            <PlaylistHeaderSection playlistId={playlistId} />
            <PlaylistVideosSection sectionType="custom" />
         </div>
      </HydrateClient>
   );
}
