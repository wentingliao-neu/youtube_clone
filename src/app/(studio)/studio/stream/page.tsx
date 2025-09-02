export const dynamic = "force-dynamic";
import StreamFormSectionSuspense from "@/sections/StreamFormSection";
import { HydrateClient, trpc } from "@/trpc/server";

// interface Props {
//    params: Promise<{ videoId: string }>;
// }
export default async function page() {
   void trpc.studio.getStream.prefetch();
   return (
      <HydrateClient>
         <div className=" px-4 pt-2.5 max-w-screen-lg">
            <StreamFormSectionSuspense />
         </div>
      </HydrateClient>
   );
}
