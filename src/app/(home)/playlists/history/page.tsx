export const dynamic = "force-dynamic";
import { DEFAULT_LIMIT } from "@/constants";
import PlaylistVideosSection from "@/sections/PlaylistVideosSection";
import { HydrateClient, trpc } from "@/trpc/server";

export default async function page() {
   void trpc.playlists.getHistory.prefetchInfinite({ limit: DEFAULT_LIMIT });
   return (
      <HydrateClient>
         <div className=" max-w-screen-md mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6">
            <div>
               <h1 className=" text-2xl font-bold">History</h1>
               <p className=" text-xs text-muted-foreground">
                  Videos you have watched
               </p>
            </div>
            <PlaylistVideosSection sectionType="history" />
         </div>
      </HydrateClient>
   );
}
