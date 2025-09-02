"use client";
import {
   Channel,
   MessageList,
   MessageInput,
   useMessageContext,
   useMessageInputContext,
   SendButton,
   TextareaComposer,
} from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";
import UserAvatar from "@/components/common/UserAvatar";
import BlockButton from "@/components/block/BlockButton";
import { useStreamChatStore } from "@/stores/streamChatStore";
import { useState } from "react";
import { ClerkLoaded, SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
   MessageCircle,
   MessageSquare,
   MessageSquareOff,
   Users,
} from "lucide-react";
import { useConnect } from "@/hooks/use-connect";
import Hint from "@/components/common/Hint";
interface ChatRoomProps {
   streamId: string;
}

export default function ChatRoom({ streamId }: ChatRoomProps) {
   const [type, setType] = useState<"chat" | "members">("chat");
   const { channel } = useStreamChatStore();

   const { userId } = useAuth();
   const { isConnecting, initChat } = useConnect(streamId);

   return (
      <ClerkLoaded>
         <SignedIn>
            {channel && (
               <Channel channel={channel}>
                  <div className="flex flex-col w-full">
                     <ChannelHeader
                        toggleType={() =>
                           setType((prev) =>
                              prev === "chat" ? "members" : "chat"
                           )
                        }
                        type={type}
                        watcherCount={channel.state.watcher_count}
                     />

                     {type === "chat" && (
                        <>
                           {/*手搓一个 message list */}
                           <MessageList
                              disableDateSeparator
                              hideNewMessageSeparator
                              showUnreadNotificationAlways={false}
                              Message={() => (
                                 <MessagesBody
                                    streamerId={
                                       channel.data?.created_by?.id || ""
                                    }
                                    // streamId={streamId}
                                 />
                              )}
                           />

                           <MessageInput Input={CustomMessageInput} />
                        </>
                     )}
                     {type === "members" && (
                        <MembersList
                           streamId={streamId}
                           isHost={channel.data?.created_by?.id === userId}
                           userId={userId ?? ""}
                        />
                     )}
                  </div>
               </Channel>
            )}
            {!channel && (
               <div className="h-full w-full flex justify-center items-center">
                  {isConnecting && "Connecting..."}
                  {!isConnecting && (
                     <Button onClick={initChat} disabled={isConnecting}>
                        Refresh
                     </Button>
                  )}
               </div>
            )}
         </SignedIn>
         <SignedOut>
            <div className="h-full w-full flex justify-center items-center  bg-gray-100 rounded-lg">
               Please sign in to chat
            </div>
         </SignedOut>
      </ClerkLoaded>
   );
}

function ChannelHeader({
   toggleType,
   type,
   watcherCount,
}: {
   toggleType: () => void;
   type: "chat" | "members";
   watcherCount: number;
}) {
   return (
      <div className="flex justify-between items-center py-2 px-4">
         <p className="text-lg font-semibold text-muted-foreground">
            {watcherCount} watching
         </p>
         <Hint label={type === "chat" ? "Members" : "Chat"}>
            <Button asChild size="icon" variant="ghost">
               <div onClick={toggleType}>
                  {type === "chat" ? <Users /> : <MessageCircle />}
               </div>
            </Button>
         </Hint>
      </div>
   );
}

function MessagesBody({
   streamerId,
}: // streamId,
{
   streamerId: string;
   // streamId: string;
}) {
   const { message } = useMessageContext();

   return (
      <div
         data-message-id={message.id}
         key={message.id}
         className={cn(
            "flex  my-2  gap-2 items-center  rounded-md",
            message.user?.id === streamerId && " bg-slate-100"
         )}
      >
         <UserAvatar
            imageUrl={message.user?.image || ""}
            name={message.user?.name || ""}
         />
         <span className=" text-muted-foreground">
            {message.user?.name || ""}
         </span>
         : {message?.text}
      </div>
   );
}

function CustomMessageInput() {
   const { handleSubmit } = useMessageInputContext();
   return (
      <div className=" mt-2 justify-self-end w-full flex  ">
         <TextareaComposer
            {...{
               className:
                  "w-full h-full! rounded-lg border-none outline-none box-border p-2 scrollbar-none focus:border-black focus:outline-black",
            }}
            containerClassName="border border-gray-200 rounded-lg shadow-sm flex-1  pb-[-5.6px] "
         />
         <SendButton sendMessage={handleSubmit} />
      </div>
   );
}

function MembersList({
   streamId,
   isHost,
   userId,
}: {
   streamId: string;
   isHost: boolean;
   userId: string;
}) {
   const { channel } = useStreamChatStore();
   // console.log(channel);
   const block = trpc.blocks.create.useMutation();
   const unblock = trpc.blocks.delete.useMutation();
   const toggleMute = trpc.streams.toggleMute.useMutation();

   const sortedMembers = Object.values(channel?.state.members || {}).sort(
      (a, b) => {
         if (a.user?.online && !b.user?.online) return -1;
         if (!a.user?.online && b.user?.online) return 1;
         return 0;
      }
   );

   return (
      <ScrollArea className=" gap-y-2 mt-4">
         {sortedMembers.map((member) => (
            <div
               key={member.user_id}
               className={cn(
                  "group flex items-center justify-between w-full p-2 rounded-md text-sm hover:bg-white/5",
                  block.isPending && "opacity-50 pointer-events-none",
                  !member.user?.online && "opacity-50"
               )}
            >
               <div className="flex items-center gap-x-2">
                  <div className="relative">
                     <UserAvatar
                        imageUrl={member.user?.image || ""}
                        name={member.user?.name || ""}
                        size="sm"
                     />
                     {member.user?.online && (
                        <div className="absolute -bottom-1 -right-2 -translate-x-1/2 transform">
                           <div
                              className={cn(
                                 "bg-green-500 p-1 rounded-md border border-background"
                              )}
                           ></div>
                        </div>
                     )}
                  </div>
                  {member.user?.name || "Unknown"}
               </div>
               {isHost && userId !== member.user?.id && (
                  <div className="flex items-center gap-x-2">
                     <Hint label={member.banned ? "Unmute" : "Mute"}>
                        <Button
                           asChild
                           size="icon"
                           className="w-6 h-6 p-1 bg-transparent text-black hover:bg-slate-300 shadow-md rounded-full"
                           variant="ghost"
                           disabled={toggleMute.isPending}
                           onClick={() => {
                              toggleMute.mutate({
                                 id: member.user?.id ?? "",
                                 channelId: streamId,
                              });
                           }}
                        >
                           {member.banned ? (
                              <MessageSquareOff className="size-10" />
                           ) : (
                              <MessageSquare className="size-10" />
                           )}
                        </Button>
                     </Hint>

                     <BlockButton
                        onClick={() => {
                           if (member.banned)
                              unblock.mutate({
                                 clerkId: member.user?.id,
                              });
                           else
                              block.mutate({
                                 clerkId: member.user?.id,
                              });
                        }}
                        style="icon"
                        disabled={block.isPending || unblock.isPending}
                        isBlocked={false}
                        className="w-6 h-6 bg-transparent text-black hover:bg-slate-300"
                     />
                  </div>
               )}
            </div>
         ))}
      </ScrollArea>
   );
}

export function ChatRoomSkeleton() {
   return (
      <Skeleton className="h-full w-full flex justify-center items-center"></Skeleton>
   );
}
