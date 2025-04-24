import { useMemo } from "react";
import { THUMBNAIL_FALLBACK } from "@/constants";
import { cn } from "@/lib/utils";
import { PlaylistsGetManyOutput } from "@/types";
import { ListVideoIcon, PlayIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";

interface PlaylistGridCardProps {
   data: PlaylistsGetManyOutput[number];
}
export default function PlaylistGridCard({ data }: PlaylistGridCardProps) {
   return (
      <Link prefetch href={`/playlists/${data.id}`}>
         <div className=" flex flex-col gap-2 w-full group">
            <PlaylistThumbnail
               imageUrl={data.thumbnailUrl || THUMBNAIL_FALLBACK}
               title={data.name}
               videoCount={data.videoCount}
            />
            <PlaylistInfo data={data} />
         </div>
      </Link>
   );
}

function PlaylistThumbnail({
   imageUrl,
   title,
   className,
   videoCount,
}: {
   imageUrl?: string | null;
   title: string;
   className?: string;
   videoCount: number;
}) {
   const compactViews = useMemo(() => {
      return Intl.NumberFormat("en-US", { notation: "compact" }).format(
         videoCount
      );
   }, [videoCount]);
   return (
      <div className={cn("relative pt-3", className)}>
         <div className=" relative">
            <div className=" absolute -top-3 left-1/2 -translate-x-1/2 w-[97%] overflow-hidden rounded-xl bg-black/20 aspect-video" />
            <div className=" absolute -top-1.5 left-1/2 -translate-x-1/2 w-[98.5%] overflow-hidden rounded-xl bg-black/25 aspect-video" />
            <div className=" relative overflow-hidden w-full rounded-xl aspect-video ">
               <Image
                  src={imageUrl || THUMBNAIL_FALLBACK}
                  alt={title}
                  className=" w-full h-full object-cover "
                  fill
               />
               <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex items-center gap-x-2">
                     <PlayIcon className="size-4 text-white fill-white" />
                     <span className=" text-white font-medium">Play all</span>
                  </div>
               </div>
            </div>
         </div>
         <div className="absolute bottom-2 right-2 px-1 py-0.5 rounded bg-black/80 text-white text-xs font-medium flex items-center gap-x-1">
            <ListVideoIcon className="size-4" />
            <span>{compactViews} videos</span>
         </div>
      </div>
   );
}

function PlaylistInfo({ data }: PlaylistGridCardProps) {
   return (
      <div className="flex  gap-3">
         <div className=" min-w-0 flex-1">
            <h3 className=" font-medium line-clamp-1 lg:line-clamp-2 text-sm break-words">
               {data.name}
            </h3>
            <p className=" text-sm text-muted-foreground">Playlist</p>
            <p className=" text-sm text-muted-foreground font-semibold hover:text-primary">
               View full playlist
            </p>
         </div>
      </div>
   );
}

export function PlaylistGridCardSkeleton() {
   return (
      <div className="flex flex-col gap-2 w-full">
         <div className="relative w-full overflow-hidden rounded-xl aspect-video">
            <Skeleton className="size-full" />
         </div>
         <div className="flex gap-3">
            <div className="min-w-0 flex-1 space-y-2">
               <Skeleton className="h-5 w-[90%]" />
               <Skeleton className="h-5 w-[70%]" />
               <Skeleton className="h-5 w-[50%]" />
            </div>
         </div>
      </div>
   );
}
