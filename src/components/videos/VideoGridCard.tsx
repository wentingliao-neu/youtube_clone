"use client";
import Link from "next/link";
import VideoThumbnail, { VideoThumbnailSkeleton } from "./VideoThumbnail";
import VideoInfo, { VideoInfoSkeleton } from "./VideoInfo";
import { VideoGetManyOutput } from "@/types";

interface VideoGridCardProps {
   data: VideoGetManyOutput[number];
   onRemove?: () => void;
}
export default function VideoGridCard({ data, onRemove }: VideoGridCardProps) {
   return (
      <div className=" flex flex-col gap-2 w-full group">
         <Link prefetch href={`/videos/${data.id}`}>
            <VideoThumbnail
               imageUrl={data.thumbnailUrl}
               title={data.title}
               duration={data.duration}
               previewUrl={data.previewUrl}
            />
         </Link>
         <VideoInfo data={data} onRemove={onRemove} />
      </div>
   );
}

export const VideoGridCardSkeleton = () => {
   return (
      <div className=" flex flex-col gap-2 w-full">
         <VideoThumbnailSkeleton />
         <VideoInfoSkeleton />
      </div>
   );
};
