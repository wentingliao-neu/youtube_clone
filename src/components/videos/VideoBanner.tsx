import { AlertTriangleIcon } from "lucide-react";
import { VideoGetOneOutput } from "../../types";
interface VideoBannerProps {
   status: VideoGetOneOutput["muxStatus"];
   text: string;
}
export default function VideoBanner({ status, text }: VideoBannerProps) {
   return (
      status !== "ready" && (
         <div className=" bg-yellow-400 py-3 px-4  rounded-b-xl flex items-center gap-2">
            <AlertTriangleIcon className=" size-4 text-black shrink-0" />
            <p className=" text-xs md:text-sm font-medium text-black line-clamp-1">
               {text}
            </p>
         </div>
      )
   );
}
