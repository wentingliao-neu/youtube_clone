import { DEFAULT_LIMIT } from "@/constants";
import HomeVideosSection from "@/sections/HomeVideosSection";
import UserSection from "@/sections/UserSection";
import { HydrateClient, trpc } from "@/trpc/server";

interface pageProps {
   params: Promise<{ userId: string }>;
}
export default async function page({ params }: pageProps) {
   const { userId } = await params;
   void trpc.users.getOne.prefetch({ id: userId });
   void trpc.videos.getMany.prefetchInfinite({ limit: DEFAULT_LIMIT, userId });
   return (
      <HydrateClient>
         <div className=" flex flex-col max-w-[1300px] px-4 pt-2.5  mx-auto mb-10 gap-y-6">
            <UserSection userId={userId} />
            <HomeVideosSection userId={userId} sectionType="user" />
         </div>
      </HydrateClient>
   );
}
