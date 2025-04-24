import {
   SidebarHeader,
   SidebarMenuButton,
   SidebarMenuItem,
   useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import UserAvatar from "@/components/common/UserAvatar";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function StudioSidebarHeader() {
   const { user } = useUser();
   const { state } = useSidebar();

   return (
      <SidebarHeader className=" flex justify-center items-center pb-4">
         {user ? (
            state === "collapsed" ? (
               <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Your profile">
                     <Link prefetch href="/user/current">
                        <UserAvatar
                           imageUrl={user.imageUrl}
                           name={user.fullName ?? "User"}
                           size="sm"
                           className="hover:opacity-80 transition-opacity"
                        />
                        <span className=" text-sm">Your profile</span>
                     </Link>
                  </SidebarMenuButton>
               </SidebarMenuItem>
            ) : (
               <>
                  <Link prefetch href="/user/current">
                     <UserAvatar
                        imageUrl={user?.imageUrl}
                        name={user.fullName ?? "User"}
                        className=" size-[112px] hover:opacity-80 transition-opacity"
                     />
                  </Link>
                  <div className=" flex flex-col items-center mt-2 gap-y-1">
                     <p className=" text-sm font-medium">Your profile</p>
                     <p className=" text-xs text-muted-foreground">
                        {user.fullName}
                     </p>
                  </div>
               </>
            )
         ) : (
            <>
               <Skeleton className=" size-[112px] rounded-full " />
               <div className=" flex flex-col items-center mt-2 gap-y-2">
                  <Skeleton className=" w-20 h-4 " />
                  <Skeleton className=" w-24 h-4 " />
               </div>
            </>
         )}
      </SidebarHeader>
   );
}
