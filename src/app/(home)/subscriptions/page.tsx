import { DEFAULT_LIMIT } from "@/constants";
import SubscriptionUserSection from "@/sections/SubscriptionUserSection";
import { HydrateClient, trpc } from "@/trpc/server";

export default async function page() {
   void trpc.subscriptions.getMany.prefetchInfinite({ limit: DEFAULT_LIMIT });
   return (
      <HydrateClient>
         <div className=" max-w-screen-md mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6">
            <div>
               <h1 className=" text-2xl font-bold">All Subscriptions</h1>
               <p className=" text-xs text-muted-foreground">
                  View and manage all your subscriptions.
               </p>
            </div>
            <SubscriptionUserSection />
         </div>
      </HydrateClient>
   );
}
