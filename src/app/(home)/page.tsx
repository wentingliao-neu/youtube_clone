export const dynamic = "force-dynamic";
import { HydrateClient, trpc } from "@/trpc/server";
import CategoriesSection from "@/sections/CategoriesSection";
import { DEFAULT_LIMIT } from "@/constants";
import HomeVideosSection from "@/sections/HomeVideosSection";

interface Props {
   searchParams: Promise<{ categoryId?: string }>;
}

export default async function Home({ searchParams }: Props) {
   const { categoryId } = await searchParams;
   void trpc.categories.getMany.prefetch();
   void trpc.videos.getMany.prefetchInfinite({
      categoryId,
      limit: DEFAULT_LIMIT,
      isTrending: false,
   });
   return (
      <HydrateClient>
         <div className=" max-w-[2400px] mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6">
            <CategoriesSection categoryId={categoryId} />
            <HomeVideosSection categoryId={categoryId} sectionType="home" />
         </div>
         {/* <HomeView categoryId={categoryId} /> */}
      </HydrateClient>
   );
}
