import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { VideoGetManyOutput } from "@/types";
import Link from "next/link";
import VideoThumbnail, { VideoThumbnailSkeleton } from "./VideoThumbnail";
import UserAvatar from "../common/UserAvatar";
import UserInfo from "../users/UserInfo";
import VideoMenu from "./VideoMenu";
import { useMemo } from "react";
import { Skeleton } from "../ui/skeleton";

const videoRowCardVariants = cva(" group flex min-w-0", {
   variants: {
      size: {
         default: "gap-4",
         compact: "gap-2",
      },
      defaultVariants: {
         size: "default",
      },
   },
});

const thumbnailVariants = cva("relative flex-none", {
   variants: {
      size: {
         default: "w-[38%]",
         compact: "w-[168px] ",
      },
      defaultVariants: {
         size: "default",
      },
   },
});

interface VideoRowCardProps extends VariantProps<typeof videoRowCardVariants> {
   data: VideoGetManyOutput[number];
   onRemove?: () => void;
}

export default function VideoRowCard({
   data,
   size = "default",
   onRemove,
}: VideoRowCardProps) {
   const compactViews = useMemo(() => {
      return Intl.NumberFormat("en-US", { notation: "compact" }).format(
         data.viewCount
      );
   }, [data.viewCount]);
   const compactLikes = useMemo(() => {
      return Intl.NumberFormat("en-US", { notation: "compact" }).format(
         data.likeCount
      );
   }, [data.likeCount]);
   return (
      <div className={videoRowCardVariants({ size })}>
         <Link
            href={`/videos/${data.id}`}
            className={thumbnailVariants({ size })}
         >
            <VideoThumbnail
               imageUrl={data.thumbnailUrl}
               previewUrl={data.previewUrl}
               title={data.title}
               duration={data.duration}
            />
         </Link>
         <div className=" flex min-w-0">
            <div className=" flex justify-between gap-x-2">
               <Link
                  prefetch
                  href={`/videos/${data.id}`}
                  className=" flex-1 min-w-0"
               >
                  <h3
                     className={cn(
                        " font-medium line-clamp-2",
                        size === "compact" ? "text-sm" : "text-base"
                     )}
                  >
                     {data.title}
                  </h3>
                  {size === "default" ? (
                     <>
                        <p className=" text-sm text-muted-foreground mt-1">
                           {compactViews} views · {compactLikes} likes
                        </p>
                        <div className=" flex items-center gap-2 my-3">
                           <UserAvatar
                              size="sm"
                              name={data.user.name}
                              imageUrl={data.user.imageUrl}
                           />
                           <UserInfo name={data.user.name} size="small" />
                        </div>
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <p className=" text-sm text-muted-foreground w-fit line-clamp-2">
                                 {data.description ?? "No description"}
                              </p>
                           </TooltipTrigger>
                           <TooltipContent
                              className="bg-black/70"
                              side="bottom"
                              align="center"
                           >
                              <p>From the video description</p>
                           </TooltipContent>
                        </Tooltip>
                     </>
                  ) : (
                     <>
                        <UserInfo size={"small"} name={data.user.name} />
                        <p className=" text-sm text-muted-foreground mt-1">
                           {compactViews} views · {compactLikes} likes
                        </p>
                     </>
                  )}
               </Link>
               <div className=" flex-none">
                  <VideoMenu videoId={data.id} onRemove={onRemove} />
               </div>
            </div>
         </div>
      </div>
   );
}

export const VideoRowCardSkeleton = ({
   size = "default",
}: VariantProps<typeof videoRowCardVariants>) => {
   return (
      <div className={videoRowCardVariants({ size })}>
         {/* Thumbnail skeleton */}
         <div className={thumbnailVariants({ size })}>
            <VideoThumbnailSkeleton />
         </div>

         {/* Info skeleton */}
         <div className="flex-1 min-w-0">
            <div className="flex justify-between gap-x-2">
               <div className="flex-1 min-w-0">
                  <Skeleton
                     className={cn(
                        "h-5 w-[40%]",
                        size === "compact" && "h-4 w-[40%]"
                     )}
                  />
                  {size === "default" ? (
                     <>
                        <Skeleton className="h-4 w-[20%] mt-1" />
                        <div className="flex items-center gap-2 my-3">
                           <Skeleton className="size-8 rounded-full" />
                           <Skeleton className="h-4 w-24" />
                        </div>
                     </>
                  ) : (
                     <Skeleton className="h-4 w-[50%] mt-1" />
                  )}
               </div>
            </div>
         </div>
      </div>
   );
};
