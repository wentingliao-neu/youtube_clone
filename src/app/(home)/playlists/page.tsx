export const dynamic = "force-dynamic";
import PlaylistView from "@/components/playlists/PlaylistView";
import { DEFAULT_LIMIT } from "@/constants";
import { HydrateClient, trpc } from "@/trpc/server";

export default async function Page() {
   void trpc.playlists.getMany.prefetchInfinite({ limit: DEFAULT_LIMIT });
   return (
      <HydrateClient>
         <PlaylistView />
      </HydrateClient>
   );
}
