import { DataTable } from "@/components/studio/BlackListDataTable";
import { DEFAULT_LIMIT } from "@/constants";
import { HydrateClient, trpc } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export default async function CommunityPage() {
   void trpc.blocks.getMany.prefetchInfinite({ limit: DEFAULT_LIMIT });

   return (
      <HydrateClient>
         <div className="p-6">
            <div className="mb-4">
               <h1 className="text-2xl font-bold">Community Settings</h1>
            </div>
            <Suspense fallback={<UserTableSkeleton />}>
               <ErrorBoundary fallback={<div>Error</div>}>
                  <DataTable />
               </ErrorBoundary>
            </Suspense>
         </div>
      </HydrateClient>
   );
}

function UserTableSkeleton() {
   return Array.from({ length: 10 }).map((_, index) => (
      <div key={index} className="animate-pulse">
         <div className="h-10 w-full bg-gray-200 rounded-md"></div>
      </div>
   ));
}
