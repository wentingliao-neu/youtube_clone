export const dynamic = "force-dynamic";
import { DEFAULT_LIMIT } from "@/constants";
import CategoriesSection from "@/sections/CategoriesSection";
import ResultsSection from "@/sections/ResultsSection";
import { HydrateClient, trpc } from "@/trpc/server";

interface pageProps {
   searchParams: Promise<{
      query: string | undefined;
      categoryId: string | undefined;
   }>;
}
export default async function page({ searchParams }: pageProps) {
   const { query, categoryId } = await searchParams;
   void trpc.categories.getMany.prefetch();
   void trpc.search.getMany.prefetchInfinite({
      query,
      categoryId,
      limit: DEFAULT_LIMIT,
   });

   return (
      <HydrateClient>
         <div className=" max-w-[1300px] mx-auto mb-10 flex flex-col gap-y-6 px-4 pt-2.5">
            <CategoriesSection categoryId={categoryId} />
            <ResultsSection query={query} categoryId={categoryId} />
         </div>
      </HydrateClient>
   );
}
