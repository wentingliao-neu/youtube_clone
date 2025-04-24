export const dynamic = "force-dynamic";
import FormSection from "@/sections/FormSection";
import { HydrateClient, trpc } from "@/trpc/server";

interface Props {
   params: Promise<{ videoId: string }>;
}
export default async function page({ params }: Props) {
   const { videoId } = await params;
   void trpc.studio.getOne.prefetch({ id: videoId });
   void trpc.categories.getMany.prefetch();
   return (
      <HydrateClient>
         <div className=" px-4 pt-2.5 max-w-screen-lg">
            <FormSection videoId={videoId} />
         </div>
      </HydrateClient>
   );
}
