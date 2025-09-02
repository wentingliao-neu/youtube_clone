export const dynamic = "force-dynamic";

import StreamAndChatSection from "@/sections/StreamAndChatSection";
import { HydrateClient, trpc } from "@/trpc/server";
interface Props {
   params: Promise<{ streamerId: string }>;
}

export default async function page({ params }: Props) {
   const { streamerId } = await params;
   void trpc.streams.getOneByUserId.prefetch({ id: streamerId });
   void trpc.users.getOne.prefetch({ id: streamerId });

   return (
      <HydrateClient>
         <div className=" flex flex-col max-w-[1700px] mx-auto pt-2.5  px-4 mb-10">
            <div className=" flex flex-col xl:flex-row gap-6">
               <StreamAndChatSection streamerId={streamerId} />
            </div>
         </div>
      </HydrateClient>
   );
}
