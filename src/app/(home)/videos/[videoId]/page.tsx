export const dynamic = "force-dynamic";

import { DEFAULT_LIMIT } from "@/constants";
import CommentsSection from "@/sections/CommentsSection";
import SuggestionsSection from "@/sections/SuggestionsSection";
import VideoSection from "@/sections/VideoSection";
import { HydrateClient, trpc } from "@/trpc/server";
interface Props {
   params: Promise<{ videoId: string }>;
}

export default async function page({ params }: Props) {
   const { videoId } = await params;
   void trpc.videos.getOne.prefetch({ id: videoId });
   void trpc.comments.getMany.prefetchInfinite({
      videoId,
      limit: DEFAULT_LIMIT,
   });
   void trpc.suggestions.getMany.prefetchInfinite({
      videoId,
      limit: DEFAULT_LIMIT,
   });
   return (
      <HydrateClient>
         <div className=" flex flex-col max-w-[1700px] mx-auto pt-2.5  px-4 mb-10">
            <div className=" flex flex-col xl:flex-row gap-6">
               <div className=" flex-1 min-w-0">
                  <VideoSection videoId={videoId} />
                  {/* Mobile view of suggestions */}
                  <div className=" xl:hidden block mt-4">
                     <SuggestionsSection videoId={videoId} isManual />
                  </div>
                  <CommentsSection videoId={videoId} />
               </div>
               <div className=" hidden xl:block w-full xl:w-[380px] 2xl:w-[460px] shrink-1">
                  <SuggestionsSection videoId={videoId} />
               </div>
            </div>
         </div>
         {/* <VideoView videoId={videoId} /> */}
      </HydrateClient>
   );
}
