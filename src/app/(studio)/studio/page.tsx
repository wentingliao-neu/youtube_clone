export const dynamic = "force-dynamic";
import { DEFAULT_LIMIT } from "@/constants";
import VideosSection from "@/sections/VideosSection";
//import StudioView from "@/modules/studio/ui/views/StudioView";
import { HydrateClient, trpc } from "@/trpc/server";

export default async function page() {
   void trpc.studio.getMany.prefetchInfinite({ limit: DEFAULT_LIMIT });
   return (
      <HydrateClient>
         {/* <StudioView /> */}
         <div className=" flex flex-col gap-y-6 pt-2.5">
            <div className=" px-4">
               <h1 className=" text-2xl font-bold">Channel content</h1>
               <p className=" text-xs text-muted-foreground">
                  Manage your channel content and videos
               </p>
            </div>
            <VideosSection />
         </div>
      </HydrateClient>
   );
}
