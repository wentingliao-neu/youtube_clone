export const dynamic = "force-dynamic";
import { HydrateClient, trpc } from "@/trpc/server";

import { DEFAULT_LIMIT } from "@/constants";
import HomeStreamsSection from "@/sections/HomeStreamsSection";

export default async function Streams() {
   void trpc.streams.getMany.prefetchInfinite({
      limit: DEFAULT_LIMIT,
   });
   return (
      <HydrateClient>
         <div className=" max-w-[2400px] mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6">
            <div>
               <h1 className=" text-2xl font-bold">Streams</h1>
               <p className=" text-xs text-muted-foreground">
                  Live streams from the community
               </p>
            </div>
            <HomeStreamsSection />
         </div>
         {/* <HomeView categoryId={categoryId} /> */}
      </HydrateClient>
   );
}
