"use client";
import MuxPlayer from "@mux/mux-player-react";
import { THUMBNAIL_FALLBACK } from "../../constants";
interface VideoPlayerProps {
   playbackId?: string | null | undefined;
   thumbnail?: string | null | undefined;
   autoPlay?: boolean;
   onPlay?: () => void;
}

export default function VideoPlayer({
   playbackId,
   thumbnail,
   autoPlay,
   onPlay,
}: VideoPlayerProps) {
   return (
      playbackId && (
         <MuxPlayer
            playbackId={playbackId}
            poster={thumbnail || THUMBNAIL_FALLBACK}
            playerInitTime={0}
            autoPlay={autoPlay}
            thumbnailTime={0}
            className=" w-full h-full object-contain"
            accentColor="#FF2056"
            onPlay={onPlay}
         />
      )
   );
}

export function VideoPlayerSkeleton() {
   return <div className="aspect-video bg-black rounded-xl "></div>;
}
