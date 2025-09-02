"use client";
import {
   Sidebar,
   SidebarContent,
   SidebarGroup,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { Clapperboard, LogOutIcon, UsersIcon, VideoIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import StudioSidebarHeader from "./StudioSidebarHeader";

const menuItems = [
   {
      label: "Content",
      tooltip: "View Contents",
      icon: VideoIcon,
      href: "/studio",
   },
   {
      label: "Black List",
      tooltip: "Manage Black List",
      icon: UsersIcon,
      href: "/studio/blacklist",
   },
   {
      label: "Stream",
      tooltip: "Manage Stream",
      icon: Clapperboard,
      href: "/studio/stream",
   },
];

export default function StudioSidebar() {
   const pathname = usePathname();
   return (
      <Sidebar className=" pt-16 z-40 " collapsible="icon">
         <SidebarContent className=" bg-background">
            <SidebarGroup>
               <SidebarMenu>
                  <StudioSidebarHeader />
                  {menuItems.map((item) => (
                     <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                           isActive={pathname === item.href}
                           tooltip={item.tooltip}
                           asChild
                        >
                           <Link prefetch href={item.href}>
                              <item.icon className="size-5" />
                              <span className=" text-sm">{item.label}</span>
                           </Link>
                        </SidebarMenuButton>
                     </SidebarMenuItem>
                  ))}

                  <Separator />
                  <SidebarMenuItem>
                     <SidebarMenuButton tooltip="Exit studio" asChild>
                        <Link prefetch href="/">
                           <LogOutIcon className="size-5" />
                           <span className=" text-sm">Exit studio</span>
                        </Link>
                     </SidebarMenuButton>
                  </SidebarMenuItem>
               </SidebarMenu>
            </SidebarGroup>
         </SidebarContent>
      </Sidebar>
   );
}
