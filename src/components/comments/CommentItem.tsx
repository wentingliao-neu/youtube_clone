import { CommentsGetManyOutput } from "@/types";
import Link from "next/link";
import UserAvatar from "../common/UserAvatar";
import { formatDistanceToNow } from "date-fns";
import { trpc } from "@/trpc/client";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import {
   ChevronDownIcon,
   ChevronUpIcon,
   MessageSquareIcon,
   MoreVerticalIcon,
   ThumbsDownIcon,
   ThumbsUpIcon,
   Trash2Icon,
} from "lucide-react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";
import CommentForm from "./CommentForm";
import CommentReplies from "./CommentReplies";

interface CommentItemProps {
   comment: CommentsGetManyOutput[number];
}
export default function CommentItem({ comment }: CommentItemProps) {
   // const variant = comment.parentId ? "reply" : "comment";

   const { userId } = useAuth();
   const utils = trpc.useUtils();
   const clerk = useClerk();

   const [isReplyOpen, setIsReplyOpen] = useState(false);
   const [isRepliesOpen, setIsRepliesOpen] = useState(false);

   const remove = trpc.comments.remove.useMutation({
      onSuccess: () => {
         toast.success("Comment deleted successfully");
         utils.comments.getMany.invalidate({
            videoId: comment.videoId,
         });
      },
      onError: () => {
         if (!userId) clerk.openSignIn();
         toast.error("Failed to delete comment");
      },
   });

   const like = trpc.commentReactions.like.useMutation({
      onSuccess: () => {
         utils.comments.getMany.invalidate({ videoId: comment.videoId });
      },
      onError: (error) => {
         if (error.data?.code === "UNAUTHORIZED") clerk.openSignIn();
         else toast.error(error.message);
      },
   });

   const dislike = trpc.commentReactions.dislike.useMutation({
      onSuccess: () => {
         utils.comments.getMany.invalidate({ videoId: comment.videoId });
      },
      onError: (error) => {
         if (error.data?.code === "UNAUTHORIZED") clerk.openSignIn();
         else toast.error(error.message);
      },
   });
   return (
      <div>
         <div className="flex gap-4">
            <Link prefetch href={`/users/${comment.userId}`}>
               <UserAvatar
                  size={comment.parentId ? "sm" : "lg"}
                  imageUrl={comment.user.imageUrl}
                  name={comment.user.name}
               />
            </Link>
            <div className=" flex-1 min-w-0">
               <Link prefetch href={`/users/${comment.userId}`}>
                  <div className=" flex items-center gap-2  mb-0.5">
                     <span className=" font-medium text-sm pb-0.5">
                        {comment.user.name}
                     </span>
                     <span className=" text-xs text-muted-foreground">
                        {formatDistanceToNow(comment.createdAt, {
                           addSuffix: true,
                        })}
                     </span>
                  </div>
               </Link>
               <p className=" text-sm">{comment.value}</p>
               <div className=" flex items-center gap-2 mt-1">
                  <div className=" flex items-center">
                     <Button
                        className=" size-8"
                        size={"icon"}
                        variant={"ghost"}
                        disabled={like.isPending}
                        onClick={() => {
                           like.mutate({ commentId: comment.id });
                        }}
                     >
                        <ThumbsUpIcon
                           className={cn(
                              comment.viewerReaction === "like" && " fill-black"
                           )}
                        />
                     </Button>
                     <span className=" text-xs text-muted-foreground">
                        {comment.likeCount}
                     </span>
                     <Button
                        className=" size-8"
                        size={"icon"}
                        variant={"ghost"}
                        disabled={dislike.isPending}
                        onClick={() => {
                           dislike.mutate({ commentId: comment.id });
                        }}
                     >
                        <ThumbsDownIcon
                           className={cn(
                              comment.viewerReaction === "dislike" &&
                                 " fill-black"
                           )}
                        />
                     </Button>
                     <span className=" text-xs text-muted-foreground">
                        {comment.dislikeCount}
                     </span>
                  </div>
                  {!comment.parentId && (
                     <Button
                        className=" h-8"
                        size={"sm"}
                        variant={"ghost"}
                        onClick={() => setIsReplyOpen(true)}
                     >
                        Reply
                     </Button>
                  )}
               </div>
            </div>
            {comment.user.clerkId !== userId && !comment.parentId && (
               <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                     <Button
                        variant={"ghost"}
                        size={"icon"}
                        className=" size-8"
                     >
                        <MoreVerticalIcon />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                     {!comment.parentId && (
                        <DropdownMenuItem
                           onClick={() => {
                              setIsReplyOpen(true);
                           }}
                        >
                           <MessageSquareIcon className=" size-6 " />
                           Reply
                        </DropdownMenuItem>
                     )}
                     {comment.user.clerkId === userId && (
                        <DropdownMenuItem
                           onClick={() => {
                              remove.mutate({ id: comment.id });
                           }}
                        >
                           <Trash2Icon className=" size-6 " />
                           Delete
                        </DropdownMenuItem>
                     )}
                  </DropdownMenuContent>
               </DropdownMenu>
            )}
         </div>
         {isReplyOpen && !comment.parentId && (
            <div className=" mt-4 pl-14">
               <CommentForm
                  parentId={comment.id}
                  videoId={comment.videoId}
                  onSuccess={() => {
                     setIsReplyOpen(false);
                     setIsRepliesOpen(true);
                     utils.comments.getMany.invalidate({
                        videoId: comment.videoId,
                     });
                  }}
                  onCancel={() => {
                     setIsReplyOpen(false);
                  }}
               />
            </div>
         )}
         {comment.replyCount > 0 && !comment.parentId && (
            <div className=" pl-14">
               <Button
                  size={"sm"}
                  variant={"territory"}
                  onClick={() => setIsRepliesOpen((current) => !current)}
               >
                  {isRepliesOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  {comment.replyCount}
                  {comment.replyCount > 1 ? "Replies" : "Reply"}
               </Button>
            </div>
         )}
         {comment.replyCount > 0 && !comment.parentId && isRepliesOpen && (
            <CommentReplies parentId={comment.id} videoId={comment.videoId} />
         )}
      </div>
   );
}
