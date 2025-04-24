import { cn } from "@/lib/utils";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";

interface VideoDescriptionProps {
   compactViews: string;
   expandedViews: string;
   description?: string | null;
   compactDate: string;
   expandedDate: string;
}

export default function VideoDescription({
   compactViews,
   expandedViews,
   description,
   compactDate,
   expandedDate,
}: VideoDescriptionProps) {
   const [isExpaneded, setIsExpanded] = useState(false);
   return (
      <div
         onClick={() => setIsExpanded((current) => !current)}
         className=" bg-secondary/50 rounded-xl p-3 cursor-pointer hover:bg-secondary/70 transition"
      >
         <div className=" flex gap-2 text-sm mb-2">
            <span className=" font-medium">
               {isExpaneded ? expandedViews : compactViews} views
            </span>
            <span className=" font-medium">
               {isExpaneded ? expandedDate : compactDate}
            </span>
         </div>
         <div className=" relative">
            <p
               className={cn(
                  " text-sm whitespace-pre-wrap",
                  !isExpaneded && " line-clamp-2"
               )}
            >
               {description || "No description available."}
            </p>
            <div className=" flex items-center gap-1 mt-4 text-sm font-medium">
               {isExpaneded ? (
                  <>
                     show less <ChevronUpIcon className=" size-4" />
                  </>
               ) : (
                  <>
                     show more
                     <ChevronDownIcon className=" size-4" />
                  </>
               )}
            </div>
         </div>
      </div>
   );
}
