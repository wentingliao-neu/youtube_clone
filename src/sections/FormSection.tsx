"use client";

import { Button } from "@/components/ui/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { videoUpdateSchema } from "@/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/trpc/client";
import {
   CopyCheckIcon,
   CopyIcon,
   Globe2Icon,
   ImagePlusIcon,
   Loader2Icon,
   LockIcon,
   MoreVerticalIcon,
   RotateCcwIcon,
   SparklesIcon,
   TrashIcon,
} from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
   Select,
   SelectTrigger,
   SelectContent,
   SelectValue,
   SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import VideoPlayer from "@/components/videos/VideoPlayer";
import Link from "next/link";
import { snakeToTitle } from "@/lib/utils";
import Image from "next/image";
import { THUMBNAIL_FALLBACK } from "@/constants";
import ThumbnailUploadModal from "@/components/studio/ThumbnailUploadModal";
import { useRouter } from "next/navigation";
import { TRPCClientErrorLike } from "@trpc/client";
import { UseTRPCMutationResult } from "@trpc/react-query/shared";
import { DefaultErrorShape } from "@trpc/server/unstable-core-do-not-import";
import ThumbnailGenerateModal from "@/components/studio/ThumbnailGenerateModal";
import { Skeleton } from "@/components/ui/skeleton";

interface FormSectionProps {
   videoId: string;
}
function FormSectionSuspense({ videoId }: FormSectionProps) {
   const utils = trpc.useUtils();
   const router = useRouter();
   const [video] = trpc.studio.getOne.useSuspenseQuery({ id: videoId });
   const [categories] = trpc.categories.getMany.useSuspenseQuery();

   const update = trpc.videos.update.useMutation({
      onSuccess: () => {
         utils.studio.getMany.invalidate();
         utils.studio.getOne.invalidate({ id: videoId });
         toast.success("Video updated");
      },
      onError: (error) => {
         toast.error(error.message);
      },
   });

   const remove = trpc.videos.remove.useMutation({
      onSuccess: () => {
         utils.studio.getMany.invalidate();

         toast.success("Video removed");
         router.push("/studio");
      },
      onError: (error) => {
         toast.error(error.message);
      },
   });

   const revalidate = trpc.videos.revalidate.useMutation({
      onSuccess: () => {
         utils.studio.getMany.invalidate();
         utils.studio.getOne.invalidate({ id: videoId });
         toast.success("Video revalidated");
      },
      onError: (error) => {
         toast.error(error.message);
      },
   });

   const restoreThumbnail = trpc.videos.restoreThumbnail.useMutation({
      onSuccess: () => {
         utils.studio.getMany.invalidate();
         utils.studio.getOne.invalidate({ id: videoId });
         toast.success("Thumbnail restored");
      },
      onError: (error) => {
         toast.error(error.message);
      },
   });

   const generateTitle = trpc.videos.generateTitle.useMutation({
      onSuccess: () => {
         toast.success("Generation started", {
            description: "This may take a few minutes",
         });
      },
      onError: (error) => {
         toast.error(error.message);
      },
   });

   const generateDescription = trpc.videos.generateDescription.useMutation({
      onSuccess: () => {
         toast.success("Generation started", {
            description: "This may take a few minutes",
         });
      },
      onError: (error) => {
         toast.error(error.message);
      },
   });

   const form = useForm<z.infer<typeof videoUpdateSchema>>({
      resolver: zodResolver(videoUpdateSchema),
      defaultValues: video,
   });
   async function onSubmit(data: z.infer<typeof videoUpdateSchema>) {
      await update.mutateAsync(data);
   }

   const fullUrl = `${
      process.env.VERCEL_URL || "http://localhost:3000"
   }/videos/${video.id}`;

   const statuses = [
      { key: "Video Link", value: fullUrl },
      {
         key: "Video Status",
         value: snakeToTitle(video.muxStatus || "preparing"),
      },
      {
         key: "Subtitles Status",
         value: snakeToTitle(video.muxTrackStatus || "no_subtitles"),
      },
   ];

   const [isCopied, setIsCopied] = useState(false);

   async function onCopy() {
      await navigator.clipboard.writeText(fullUrl);
      setIsCopied(true);
      setTimeout(() => {
         setIsCopied(false);
      }, 2000);
   }

   const [thumbnailModalOpen, setThumbnailModalOpen] = useState(false);
   const [thumbnailGenerateModalOpen, setThumbnailGenerateModalOpen] =
      useState(false);
   return (
      <>
         <ThumbnailUploadModal
            open={thumbnailModalOpen}
            onOpenChange={setThumbnailModalOpen}
            videoId={videoId}
         />
         <ThumbnailGenerateModal
            open={thumbnailGenerateModalOpen}
            onOpenChange={setThumbnailGenerateModalOpen}
            videoId={videoId}
         />
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
               <div className=" flex items-center justify-between mb-6">
                  <div>
                     <h1 className=" text-2xl font-bold">Video Details</h1>
                     <p className=" text-xs text-muted-foreground">
                        Manage your video details
                     </p>
                  </div>
                  <div className=" flex items-center gap-x-2">
                     <Button
                        type="submit"
                        disabled={update.isPending || !form.formState.isDirty}
                     >
                        Save
                     </Button>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost">
                              <MoreVerticalIcon />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem
                              onClick={() => remove.mutate({ id: videoId })}
                           >
                              <TrashIcon className=" size-4 mr-2" />
                              Delete
                           </DropdownMenuItem>
                           <DropdownMenuItem
                              onClick={() => revalidate.mutate({ id: videoId })}
                           >
                              <RotateCcwIcon className=" size-4 mr-2" />
                              Revalidate
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </div>
               </div>
               <div className=" grid lg:grid-cols-5 gap-6">
                  <div className=" space-y-8 lg:col-span-3">
                     <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                           <AIFormField
                              field="Title"
                              onGenerate={generateTitle}
                              video={video}
                           >
                              <Input
                                 {...field}
                                 placeholder="Add a title to your video"
                              />
                           </AIFormField>
                           // <FormItem>
                           //    <FormLabel>
                           //       <div className=" flex items-center gap-x-2">
                           //          Title
                           //          <Button
                           //             size={"icon"}
                           //             variant={"outline"}
                           //             className=" rounded-full size-6 [&_svg]:size-3"
                           //             type="button"
                           //             onClick={() => {
                           //                generateTitle.mutate({
                           //                   id: videoId,
                           //                });
                           //             }}
                           //             disabled={generateTitle.isPending}
                           //          >
                           //             {generateTitle.isPending ? (
                           //                <Loader2Icon className=" animate-spin" />
                           //             ) : (
                           //                <SparklesIcon />
                           //             )}
                           //          </Button>
                           //       </div>
                           //    </FormLabel>
                           //    <FormControl>
                           //       <Input
                           //          {...field}
                           //          placeholder="Add a title to your video"
                           //       />
                           //    </FormControl>
                           //    <FormMessage />
                           // </FormItem>
                        )}
                     />
                     <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                           // <FormItem>
                           //    <FormLabel>
                           //       <div className=" flex items-center gap-x-2">
                           //          Description
                           //          <Button
                           //             size={"icon"}
                           //             variant={"outline"}
                           //             className=" rounded-full size-6 [&_svg]:size-3"
                           //             type="button"
                           //             onClick={() => {
                           //                generateDescription.mutate({
                           //                   id: videoId,
                           //                });
                           //             }}
                           //             disabled={
                           //                generateDescription.isPending ||
                           //                !video.muxTrackId
                           //             }
                           //          >
                           //             {generateDescription.isPending ? (
                           //                <Loader2Icon className=" animate-spin" />
                           //             ) : (
                           //                <SparklesIcon />
                           //             )}
                           //          </Button>
                           //       </div>
                           //    </FormLabel>
                           //    <FormControl>
                           //       <Textarea
                           //          {...field}
                           //          value={field.value || ""}
                           //          rows={10}
                           //          className=" resize-none pr-10"
                           //          placeholder="Add a description to your video"
                           //       />
                           //    </FormControl>
                           //    <FormMessage />
                           // </FormItem>
                           <AIFormField
                              field="Description"
                              onGenerate={generateDescription}
                              video={video}
                           >
                              <Textarea
                                 {...field}
                                 value={field.value || ""}
                                 rows={10}
                                 className=" resize-none pr-10"
                                 placeholder="Add a description to your video"
                              />
                           </AIFormField>
                        )}
                     />
                     <FormField
                        name="thumbnailUrl"
                        control={form.control}
                        render={() => (
                           <FormItem>
                              <FormLabel>Thumbnail 123</FormLabel>
                              <FormControl>
                                 <div className=" p-0.5 border border-dashed border-neutral-400 relative h-[84px] w-[153px] group">
                                    <Image
                                       fill
                                       alt="Thumbnail"
                                       src={
                                          video.thumbnailUrl ||
                                          THUMBNAIL_FALLBACK
                                       }
                                       className=" object-cover"
                                    />
                                    <DropdownMenu>
                                       <DropdownMenuTrigger asChild>
                                          <Button
                                             type="button"
                                             className=" bg-black/50 hover:bg-black/50 absolute top-1 right-1 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 duration-300 size-7"
                                             size="icon"
                                          >
                                             <MoreVerticalIcon className=" text-white" />
                                          </Button>
                                       </DropdownMenuTrigger>
                                       <DropdownMenuContent
                                          align="start"
                                          side="right"
                                       >
                                          <DropdownMenuItem
                                             onClick={() =>
                                                setThumbnailModalOpen(true)
                                             }
                                          >
                                             <ImagePlusIcon className=" size-4 mr-1" />
                                             Change
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                             onClick={() => {
                                                setThumbnailGenerateModalOpen(
                                                   true
                                                );
                                             }}
                                          >
                                             <SparklesIcon className=" size-4 mr-1" />
                                             AI-generated
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                             onClick={() => {
                                                restoreThumbnail.mutate({
                                                   id: videoId,
                                                });
                                             }}
                                          >
                                             <RotateCcwIcon className=" size-4 mr-1" />
                                             Restore
                                          </DropdownMenuItem>
                                       </DropdownMenuContent>
                                    </DropdownMenu>
                                 </div>
                              </FormControl>
                           </FormItem>
                        )}
                     />
                     <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select
                                 onValueChange={field.onChange}
                                 defaultValue={field.value ?? undefined}
                              >
                                 <FormControl>
                                    <SelectTrigger>
                                       <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                 </FormControl>
                                 <SelectContent>
                                    {categories.map((category) => (
                                       <SelectItem
                                          key={category.id}
                                          value={category.id}
                                       >
                                          {category.name}
                                       </SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                  </div>
                  <div className=" flex flex-col gap-y-8 lg:col-span-2">
                     <div className=" flex flex-col gap-4 bg-[#f9f9f9] rounded-xl overflow-hidden h-fit">
                        <div className=" aspect-video overflow-hidden relative">
                           <VideoPlayer
                              playbackId={video.muxPlaybackId}
                              thumbnail={video.thumbnailUrl}
                           />
                        </div>
                        <div className=" flex flex-col gap-y-6 p-4">
                           {/* <div className=" flex justify-between items-center gap-x-2">
                           <div className=" flex flex-col gap-y-1">
                              <p className=" text-muted-foreground text-xs">
                                 Video Link
                              </p>
                              <div className=" flex items-center gap-x-2">
                                 <Link prefetch href={`/videos/${video.id}`}>
                                    <p className=" text-blue-500 line-clamp-1 text-sm">
                                       {fillUrl}
                                    </p>
                                 </Link>
                                 <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className=" shrink-0"
                                    onClick={onCopy}
                                    disabled={isCopied}
                                 >
                                    {isCopied ? (
                                       <CopyCheckIcon />
                                    ) : (
                                       <CopyIcon />
                                    )}
                                 </Button>
                              </div>
                           </div>
                        </div> */}
                           {statuses.map((status) => (
                              <div
                                 className=" flex justify-between items-center gap-x-2"
                                 key={status.key}
                              >
                                 <div className=" flex flex-col gap-y-1">
                                    <p className=" text-muted-foreground text-xs">
                                       {status.key}
                                    </p>
                                    {status.key === "Video Link" ? (
                                       <div className=" flex items-center gap-x-2">
                                          <Link
                                             prefetch
                                             href={`/videos/${video.id}`}
                                          >
                                             <p className=" text-blue-500 line-clamp-1 text-sm">
                                                {fullUrl}
                                             </p>
                                          </Link>
                                          <Button
                                             type="button"
                                             variant="ghost"
                                             size="icon"
                                             className=" shrink-0"
                                             onClick={onCopy}
                                             disabled={isCopied}
                                          >
                                             {isCopied ? (
                                                <CopyCheckIcon />
                                             ) : (
                                                <CopyIcon />
                                             )}
                                          </Button>
                                       </div>
                                    ) : (
                                       <p className=" text-sm">
                                          {status.value}
                                       </p>
                                    )}
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                     <FormField
                        control={form.control}
                        name="visibility"
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>Visibility</FormLabel>
                              <Select
                                 onValueChange={field.onChange}
                                 defaultValue={field.value ?? undefined}
                              >
                                 <FormControl>
                                    <SelectTrigger>
                                       <SelectValue placeholder="Select visibility" />
                                    </SelectTrigger>
                                 </FormControl>
                                 <SelectContent>
                                    <SelectItem value="public">
                                       <div className=" flex items-center">
                                          <Globe2Icon className=" size-4 mr-2" />
                                          Public
                                       </div>
                                    </SelectItem>
                                    <SelectItem value="private">
                                       <div className=" flex items-center">
                                          <LockIcon className=" size-4 mr-2" />
                                          Private
                                       </div>
                                    </SelectItem>
                                 </SelectContent>
                              </Select>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                  </div>
               </div>
            </form>
         </Form>
      </>
   );
}

export default function FormSection({ videoId }: FormSectionProps) {
   return (
      <Suspense fallback={<FormSectionSkeleton />}>
         <ErrorBoundary fallback={<div>Error</div>}>
            <FormSectionSuspense videoId={videoId} />
         </ErrorBoundary>
      </Suspense>
   );
}

function FormSectionSkeleton() {
   return (
      <>
         <div className=" flex items-center justify-between mb-6">
            <div className=" space-y-2">
               <Skeleton className=" h-7 w-32" />
               <Skeleton className=" h-4 w-40 " />
            </div>
            <Skeleton className=" h-9 w-24 " />
         </div>
         <div className=" grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className=" space-y-8 lg:col-span-3">
               <div className="space-y-2">
                  <Skeleton className=" h-5 w-16" />
                  <Skeleton className=" h-10 w-full" />
               </div>
            </div>
            <div className=" flex flex-col gap-y-8 lg:col-span-2">
               <div className=" flex flex-col gap-4 bg-[#f9f9f9] rounded-xl overflow-hidden h-fit">
                  <Skeleton className=" aspect-video w-full" />
                  <div className=" flex flex-col gap-y-6 p-4">
                     {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className=" space-y-2">
                           <Skeleton className=" h-4 w-20" />
                           <Skeleton className=" h-5 w-full" />
                        </div>
                     ))}
                  </div>
               </div>
               <div className=" space-y-2">
                  <Skeleton className=" h-5 w-20" />
                  <Skeleton className=" h-10 w-full" />
               </div>
            </div>
         </div>
      </>
   );
}

function AIFormField({
   field,
   onGenerate,
   video,
   children,
}: {
   field: string;
   video: z.infer<typeof videoUpdateSchema>;
   children: React.ReactNode;
   onGenerate: UseTRPCMutationResult<
      string,
      TRPCClientErrorLike<{
         input: {
            id: string;
         };
         output: string;
         transformer: true;
         errorShape: DefaultErrorShape;
      }>,
      {
         id: string;
      },
      unknown
   >;
}) {
   return (
      <FormItem>
         <FormLabel>
            <div className=" flex items-center gap-x-2 mt-2">
               {field}
               <Button
                  size="icon"
                  variant="ghost"
                  className=" rounded-full size-6 [&_svg]:size-3"
                  type="button"
                  onClick={() => {
                     onGenerate.mutate({
                        id: video.id || "",
                     });
                  }}
                  disabled={onGenerate.isPending || !video.muxTrackId}
               >
                  {onGenerate.isPending ? (
                     <Loader2Icon className=" animate-spin" />
                  ) : (
                     <SparklesIcon />
                  )}
               </Button>
            </div>
         </FormLabel>
         <FormControl>{children}</FormControl>
         <FormMessage />
      </FormItem>
   );
}
