export const dynamic = "force-dynamic";
import { HydrateClient, trpc } from "@/trpc/server";

import { DEFAULT_LIMIT } from "@/constants";
import HomeVideosSection from "@/sections/HomeVideosSection";

export default async function Trending() {
   void trpc.videos.getManySubscribed.prefetchInfinite({
      limit: DEFAULT_LIMIT,
   });
   return (
      <HydrateClient>
         <div className=" max-w-[2400px] mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6">
            <div>
               <h1 className=" text-2xl font-bold">Subscribed</h1>
               <p className=" text-xs text-muted-foreground">
                  Videos from your favourite creators
               </p>
            </div>
            <HomeVideosSection sectionType="subscription" />
         </div>
         {/* <HomeView categoryId={categoryId} /> */}
      </HydrateClient>
   );
}
