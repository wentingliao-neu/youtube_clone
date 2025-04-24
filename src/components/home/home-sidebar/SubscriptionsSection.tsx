"use client";

import UserAvatar from "@/components/common/UserAvatar";
import {
   SidebarGroup,
   SidebarGroupLabel,
   SidebarGroupContent,
   SidebarMenu,
   SidebarMenuItem,
   SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_LIMIT } from "@/constants";
import { trpc } from "@/trpc/client";
import { ListIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SubscriptionsSection() {
   const { data, isLoading } = trpc.subscriptions.getMany.useInfiniteQuery(
      { limit: DEFAULT_LIMIT },
      {
         getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
   );
   const pathname = usePathname();
   return (
      <SidebarGroup>
         <SidebarGroupLabel>Subscriptions</SidebarGroupLabel>
         <SidebarGroupContent>
            <SidebarMenu>
               {isLoading && <SubscriptionsSectionSkeleton />}
               {!isLoading &&
                  data?.pages
                     .flatMap((page) => page.items)
                     .map((item) => (
                        <SidebarMenuItem
                           key={`${item.creatorId}-${item.viewerId}`}
                        >
                           <SidebarMenuButton
                              tooltip={item.user.name}
                              asChild
                              isActive={pathname === `/users/${item.user.id}`}
                           >
                              <Link
                                 href={`/users/${item.user.id}`}
                                 className=" flex items-center gap-4"
                              >
                                 <UserAvatar
                                    size={"xs"}
                                    imageUrl={item.user.imageUrl}
                                    name={item.user.name}
                                 />
                                 <span className=" text-sm">
                                    {item.user.name}
                                 </span>
                              </Link>
                           </SidebarMenuButton>
                        </SidebarMenuItem>
                     ))}

               {!isLoading && (
                  <SidebarMenuItem>
                     <SidebarMenuButton
                        asChild
                        isActive={pathname === "subscriptions"}
                     >
                        <Link
                           href="/subscriptions"
                           className=" flex items-center gap-4"
                        >
                           <ListIcon className=" size-4" />
                           <span className=" text-sm">All subscriptions</span>
                        </Link>
                     </SidebarMenuButton>
                  </SidebarMenuItem>
               )}
            </SidebarMenu>
         </SidebarGroupContent>
      </SidebarGroup>
   );
}

export function SubscriptionsSectionSkeleton() {
   return (
      <>
         {Array.from({ length: 5 }).map((_, index) => (
            <SidebarMenuItem key={index}>
               <SidebarMenuButton disabled>
                  <Skeleton className=" size-6 rounded-full shrink-0" />
                  <Skeleton className=" h-4 w-full" />
               </SidebarMenuButton>
            </SidebarMenuItem>
         ))}
      </>
   );
}
