"use client";

import FilterCarousel from "@/components/common/FilterCarousel";
import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
   categoryId?: string;
}
function CategoriesSectionSuspense({ categoryId }: Props) {
   const [categories] = trpc.categories.getMany.useSuspenseQuery();
   const router = useRouter();
   const data = categories.map((category) => ({
      value: category.id,
      label: category.name,
   }));

   function onSelect(value: string | null) {
      const url = new URL(window.location.href);
      if (value) url.searchParams.set("categoryId", value);
      else url.searchParams.delete("categoryId");
      router.push(url.toString());
   }
   return <FilterCarousel value={categoryId} data={data} onSelect={onSelect} />;
}
export default function CategoriesSection({ categoryId }: Props) {
   return (
      <Suspense
         fallback={<FilterCarousel data={[]} onSelect={() => {}} isLoading />}
      >
         <ErrorBoundary fallback={<div>Failed to load</div>}>
            <CategoriesSectionSuspense categoryId={categoryId} />
         </ErrorBoundary>
      </Suspense>
   );
}
