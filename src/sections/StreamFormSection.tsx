"use client";

import { Button } from "@/components/ui/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { streamUpdateSchema } from "@/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/trpc/client";
import {
   CopyCheckIcon,
   CopyIcon,
   Globe2Icon,
   ImagePlusIcon,
   Loader2Icon,
   LockIcon,
   MessageCircleQuestionIcon,
   MoreVerticalIcon,
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
import Link from "next/link";
import { snakeToTitle } from "@/lib/utils";
import Image from "next/image";
import { THUMBNAIL_FALLBACK } from "@/constants";

import { Skeleton } from "@/components/ui/skeleton";
import ImageUploadModal from "@/components/common/ImageUploadModal";
import ResponsiveModal from "@/components/common/ResponsiveModal";

function StreamFormSectionSuspense() {
   const utils = trpc.useUtils();
   const [stream] = trpc.studio.getStream.useSuspenseQuery();

   const update = trpc.streams.update.useMutation({
      onSuccess: () => {
         utils.studio.getStream.invalidate();
         utils.streams.getOneByUserId.invalidate({ id: stream.userId });
         toast.success("Stream updated");
      },
      onError: (error: unknown) => {
         if (error instanceof Error) {
            toast.error(error.message);
         }
      },
   });

   const remove = trpc.streams.remove.useMutation({
      onSuccess: () => {
         utils.studio.getStream.invalidate();
         toast.success("Stream removed");
         // router.push("/studio");
      },
      onError: (error: unknown) => {
         if (error instanceof Error) {
            toast.error(error.message);
         }
      },
   });

   const form = useForm<z.infer<typeof streamUpdateSchema>>({
      resolver: zodResolver(streamUpdateSchema),
      defaultValues: stream,
   });
   async function onSubmit(data: z.infer<typeof streamUpdateSchema>) {
      await update.mutateAsync({
         id: stream.id,
         data: {
            title: data.name ?? "",
            description: data.description ?? "",
            visibility: data.visibility ?? "public",
         },
      });
   }

   const fullUrl = `${
      process.env.VERCEL_URL || "http://localhost:3000"
   }/stream/${stream?.userId}`;

   const srtUrl = `${process.env.NEXT_PUBLIC_MUX_SRT_URL}?streamid=${stream?.streamKey}&passphrase=${stream?.srtPassphrase}`;
   const statuses = [
      { key: "Stream Link", value: fullUrl },
      {
         key: "SRT URL",
         displayValue: "*******************************",
         value: srtUrl,
      },
      {
         key: "Stream Key",
         displayValue: "*******************************",
         value: stream?.streamKey,
      },
      {
         key: "Stream Status",
         value: snakeToTitle(stream?.isLive ? "Live" : "Offline"),
      },
      {
         key: "Subtitles Status",
         value: snakeToTitle(
            stream?.subTitleGenerated ? "Generated" : "Not Generated"
         ),
      },
   ];

   const [isCopied, setIsCopied] = useState(false);

   async function onCopy(content: string) {
      setIsCopied(true);
      await navigator.clipboard.writeText(content);
      setIsCopied(false);
      toast.success("Copied content to clipboard");
   }

   const [thumbnailModalOpen, setThumbnailModalOpen] = useState(false);
   const [createStreamModalOpen, setCreateStreamModalOpen] = useState(false);

   return (
      <>
         {stream ? (
            <>
               <ImageUploadModal
                  modalType="room"
                  open={thumbnailModalOpen}
                  onOpenChange={setThumbnailModalOpen}
                  streamId={stream.id}
               />
               <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                     <div className=" flex items-center justify-between mb-6">
                        <div>
                           <h1 className=" text-2xl font-bold">
                              Stream Details
                           </h1>
                           <p className=" text-xs text-muted-foreground">
                              Manage your stream details
                           </p>
                        </div>
                        <div className=" flex items-center gap-x-2">
                           <Button
                              type="submit"
                              disabled={
                                 update.isPending || !form.formState.isDirty
                              }
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
                                    onClick={() => remove.mutate()}
                                 >
                                    <TrashIcon className=" size-4 mr-2" />
                                    Delete
                                 </DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                        </div>
                     </div>
                     <div className=" grid lg:grid-cols-5 gap-6">
                        <div className=" space-y-8 lg:col-span-3">
                           <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                 <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                       <Input
                                          {...field}
                                          placeholder="Add a title to your stream"
                                       />
                                    </FormControl>
                                    <FormMessage />
                                 </FormItem>
                              )}
                           />
                           <FormField
                              control={form.control}
                              name="description"
                              render={({ field }) => (
                                 <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                       <Textarea
                                          {...field}
                                          value={field.value || ""}
                                          rows={10}
                                          className=" resize-none pr-10"
                                          placeholder="Add a description to your stream"
                                       />
                                    </FormControl>
                                    <FormMessage />
                                 </FormItem>
                              )}
                           />
                           <FormField
                              name="thumbnailUrl"
                              control={form.control}
                              render={() => (
                                 <FormItem>
                                    <FormLabel>Thumbnail</FormLabel>
                                    <FormControl>
                                       <div className=" p-0.5 border border-dashed border-neutral-400 relative h-[84px] w-[153px] group">
                                          <Image
                                             fill
                                             alt="Thumbnail"
                                             src={
                                                stream.thumbnailUrl ||
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
                                                      setThumbnailModalOpen(
                                                         true
                                                      )
                                                   }
                                                >
                                                   <ImagePlusIcon className=" size-4 mr-1" />
                                                   Change
                                                </DropdownMenuItem>
                                             </DropdownMenuContent>
                                          </DropdownMenu>
                                       </div>
                                    </FormControl>
                                 </FormItem>
                              )}
                           />
                        </div>
                        <div className=" flex flex-col gap-y-8 lg:col-span-2">
                           <div className=" flex flex-col gap-4 bg-[#f9f9f9] rounded-xl overflow-hidden h-fit">
                              <div className=" flex flex-col gap-y-6 p-4">
                                 {statuses.map((status) => (
                                    <div
                                       className=" flex items-center gap-x-2"
                                       key={status.key}
                                    >
                                       <div className=" flex flex-col gap-y-1 w-full">
                                          <p className=" text-muted-foreground text-xs">
                                             {status.key}
                                          </p>
                                          {status.key === "Stream Link" ||
                                          status.key === "Stream Key" ||
                                          status.key === "SRT URL" ? (
                                             <div className=" flex items-center justify-between gap-x-2 w-full">
                                                {status.key ===
                                                "Stream Link" ? (
                                                   <Link
                                                      prefetch
                                                      href={`/stream/${stream.userId}`}
                                                   >
                                                      <p className=" text-blue-500 line-clamp-1 text-sm">
                                                         {fullUrl}
                                                      </p>
                                                   </Link>
                                                ) : (
                                                   <p className=" text-blue-500 line-clamp-1 text-sm break-all">
                                                      {status.displayValue}
                                                   </p>
                                                )}{" "}
                                                <Button
                                                   type="button"
                                                   variant="ghost"
                                                   size="icon"
                                                   className=" shrink-0"
                                                   onClick={() =>
                                                      onCopy(status.value)
                                                   }
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
                                 <div className=" flex items-center gap-x-2">
                                    <MessageCircleQuestionIcon className=" size-4 mr-2" />
                                    <Link
                                       target="_blank"
                                       href={`https://www.mux.com/docs/guides/start-live-streaming`}
                                       className=" text-slate-500 text-sm"
                                    >
                                       How to Stream
                                    </Link>
                                 </div>
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
                                          <SelectItem value="subscribers">
                                             <div className=" flex items-center">
                                                <LockIcon className=" size-4 mr-2" />
                                                Subscribers Only
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
         ) : (
            <>
               <CreateStreamModal
                  open={createStreamModalOpen}
                  onOpenChange={setCreateStreamModalOpen}
               />
               {!createStreamModalOpen && (
                  <div className=" flex flex-col gap-2">
                     <h1 className=" text-2xl font-bold">
                        You don&apos;t have a stream yet
                     </h1>
                     <p className=" text-muted-foreground">
                        Create a new stream to start streaming
                     </p>
                     <Button onClick={() => setCreateStreamModalOpen(true)}>
                        Create Stream
                     </Button>
                  </div>
               )}
            </>
         )}
      </>
   );
}

export default function StreamFormSection() {
   return (
      <Suspense fallback={<FormSectionSkeleton />}>
         <ErrorBoundary fallback={<div>Error</div>}>
            <StreamFormSectionSuspense />
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

const streamCreateSchema = z.object({
   name: z.string().min(1),
   description: z.string().min(1),
});

function CreateStreamModal({
   open,
   onOpenChange,
}: {
   open: boolean;
   onOpenChange: (open: boolean) => void;
}) {
   const utils = trpc.useUtils();
   const form = useForm<z.infer<typeof streamCreateSchema>>({
      resolver: zodResolver(streamCreateSchema),
      defaultValues: {
         name: "",
         description: "",
      },
   });

   const createStream = trpc.streams.create.useMutation({
      onSuccess: () => {
         toast.success("Stream created successfully");
         onOpenChange(false);
         utils.studio.getStream.invalidate();
      },
      onError: (error: unknown) => {
         if (error instanceof Error) {
            toast.error(error.message);
         }
      },
   });

   async function onSubmit(data: z.infer<typeof streamCreateSchema>) {
      createStream.mutate({
         name: data.name,
         description: data.description,
      });
   }
   return (
      <ResponsiveModal
         title="Create Stream"
         description="Create a new stream to start streaming"
         open={open}
         onOpenChange={onOpenChange}
      >
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
               <div className=" flex flex-col gap-y-2 ">
                  <Input placeholder="Title" {...form.register("name")} />
                  <Textarea
                     placeholder="Description"
                     {...form.register("description")}
                  />

                  <Button type="submit" disabled={createStream.isPending}>
                     {createStream.isPending ? (
                        <Loader2Icon className=" size-4 mr-2 animate-spin" />
                     ) : (
                        "Create"
                     )}
                  </Button>
               </div>
            </form>
         </Form>
      </ResponsiveModal>
   );
}
