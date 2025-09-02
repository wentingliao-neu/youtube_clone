"use client";

import {
   SidebarGroup,
   SidebarGroupLabel,
   SidebarGroupContent,
   SidebarMenu,
   SidebarMenuItem,
   SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useAuth, useClerk } from "@clerk/nextjs";
import {
   HomeIcon,
   PlaySquareIcon,
   FlameIcon,
   HistoryIcon,
   ThumbsUpIcon,
   ListVideoIcon,
   TvIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
const routes = {
   main: [
      { title: "Home", icon: HomeIcon, url: "/", auth: false },
      {
         title: "Subscriptions",
         icon: PlaySquareIcon,
         url: "/feed/subscriptions",
         auth: true,
      },
      {
         title: "Trending",
         icon: FlameIcon,
         url: "/feed/trending",
         auth: false,
      },
      {
         title: "Streams",
         icon: TvIcon,
         url: "/feed/streams",
         auth: false,
      },
   ],
   personal: [
      {
         title: "History",
         icon: HistoryIcon,
         url: "/playlists/history",
         auth: true,
      },
      {
         title: "Liked videos",
         icon: ThumbsUpIcon,
         url: "/playlists/liked",
         auth: true,
      },
      {
         title: "All playlists",
         icon: ListVideoIcon,
         url: "/playlists",
         auth: true,
      },
   ],
};

export default function Section({ type }: { type: "main" | "personal" }) {
   const { isSignedIn } = useAuth();
   const clerk = useClerk();
   const pathname = usePathname();
   return (
      <SidebarGroup>
         {type === "personal" && <SidebarGroupLabel>You</SidebarGroupLabel>}
         <SidebarGroupContent>
            <SidebarMenu>
               {routes[type].map((item, index) => (
                  <SidebarMenuItem key={index}>
                     <SidebarMenuButton
                        tooltip={item.title}
                        asChild
                        isActive={pathname === item.url}
                        onClick={(e) => {
                           if (!isSignedIn && item.auth) {
                              e.preventDefault();
                              return clerk.openSignIn();
                           }
                        }}
                     >
                        <Link
                           href={item.url}
                           className=" flex items-center gap-4"
                        >
                           <item.icon />
                           <span className=" text-sm">{item.title}</span>
                        </Link>
                     </SidebarMenuButton>
                  </SidebarMenuItem>
               ))}
            </SidebarMenu>
         </SidebarGroupContent>
      </SidebarGroup>
   );
}
