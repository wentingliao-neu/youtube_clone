"use client";
import InfiniteScroll from "@/components/common/InfiniteScroll";
import { Skeleton } from "@/components/ui/skeleton";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import VideoThumbnail from "@/components/videos/VideoThumbnail";
import { DEFAULT_LIMIT } from "@/constants";
import { snakeToTitle } from "@/lib/utils";

import { trpc } from "@/trpc/client";
import { format } from "date-fns";
import { Globe2Icon, LockIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

function VideosSectionSuspense() {
   const [videos, query] = trpc.studio.getMany.useSuspenseInfiniteQuery(
      { limit: DEFAULT_LIMIT },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
   );
   return (
      <div>
         <div className=" border-y">
            <Table>
               <TableHeader>
                  <TableRow>
                     <TableHead className=" pl-6 w-[510px]">Video</TableHead>
                     <TableHead>Visibility</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead>Date</TableHead>
                     <TableHead className=" text-right">Views</TableHead>
                     <TableHead className=" text-right">Comments</TableHead>
                     <TableHead className=" text-right pr-6">Likes</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {videos.pages
                     .flatMap((page) => page.items)
                     .map((video) => (
                        <Link
                           href={`/studio/videos/${video.id}`}
                           key={video.id}
                           legacyBehavior
                        >
                           <TableRow className=" cursor-pointer">
                              <TableCell className=" pl-6">
                                 <div className=" flex items-center gap-4">
                                    <div className=" relative aspect-video w-36 shrink-0">
                                       <VideoThumbnail
                                          imageUrl={video.thumbnailUrl}
                                          previewUrl={video.previewUrl}
                                          title={video.title}
                                          duration={video.duration}
                                       />
                                    </div>
                                    <div className=" flex flex-col overflow-hidden gap-y-1">
                                       <span className=" text-sm line-clamp-1">
                                          {video.title}
                                       </span>
                                       <span className=" text-xs text-muted-foreground line-clamp-1">
                                          {video.description ||
                                             "No description"}
                                       </span>
                                    </div>
                                 </div>
                              </TableCell>
                              <TableCell>
                                 <div className=" flex items-center">
                                    {video.visibility === "private" ? (
                                       <LockIcon className=" size-4 mr-2" />
                                    ) : (
                                       <Globe2Icon className=" size-4 mr-2" />
                                    )}
                                    {snakeToTitle(video.visibility)}
                                 </div>
                              </TableCell>
                              <TableCell>
                                 <div className=" flex items-center">
                                    {snakeToTitle(video.muxStatus || "error")}
                                 </div>
                              </TableCell>
                              <TableCell className=" text-sm truncate">
                                 {format(
                                    new Date(video.createdAt),
                                    "MMM dd, yyyy"
                                 )}
                              </TableCell>
                              <TableCell className=" text-sm text-right">
                                 {video.viewCount}
                              </TableCell>
                              <TableCell className=" text-sm text-right">
                                 {video.commentCount}
                              </TableCell>
                              <TableCell className=" text-sm text-right pr-6">
                                 {video.likeCount}
                              </TableCell>
                           </TableRow>
                        </Link>
                     ))}
               </TableBody>
            </Table>
         </div>
         <InfiniteScroll
            hasNextPage={query.hasNextPage}
            isFetchingNextPage={query.isFetchingNextPage}
            fetchNextPage={query.fetchNextPage}
            isManual
         />
      </div>
   );
}
export default function VideosSection() {
   return (
      <Suspense fallback={<VideoSectionSkeleton />}>
         <ErrorBoundary fallback={<div>Error</div>}>
            <VideosSectionSuspense />
         </ErrorBoundary>
      </Suspense>
   );
}

function VideoSectionSkeleton() {
   return (
      <div>
         <div className=" border-y">
            <Table>
               <TableHeader>
                  <TableRow>
                     <TableHead className=" pl-6 w-[510px]">Video</TableHead>
                     <TableHead>Visibility</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead>Date</TableHead>
                     <TableHead className=" text-right">Views</TableHead>
                     <TableHead className=" text-right">Comments</TableHead>
                     <TableHead className=" text-right pr-6">Likes</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                     <TableRow key={i}>
                        <TableCell className=" pl-6">
                           <div className=" flex gap-4 items-center">
                              <Skeleton className=" w-36 h-20 " />
                              <div className=" flex flex-col gap-2">
                                 <Skeleton className=" w-[100px] h-4 " />
                                 <Skeleton className=" w-[150px] h-3 " />
                              </div>
                           </div>
                        </TableCell>
                        <TableCell>
                           <Skeleton className=" w-20 h-4 " />
                        </TableCell>
                        <TableCell>
                           <Skeleton className=" w-15 h-4 " />
                        </TableCell>
                        <TableCell>
                           <Skeleton className=" w-24 h-4 " />
                        </TableCell>
                        <TableCell className=" text-right">
                           <Skeleton className=" w-12 h-4  ml-auto" />
                        </TableCell>
                        <TableCell className=" text-right">
                           <Skeleton className=" w-12 h-4  ml-auto" />
                        </TableCell>
                        <TableCell className=" text-right pr-6">
                           <Skeleton className=" w-12 h-4  ml-auto" />
                        </TableCell>
                     </TableRow>
                  ))}
               </TableBody>
            </Table>
         </div>
      </div>
   );
}
