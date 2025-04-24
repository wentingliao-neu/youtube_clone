import HomeNavbar from "@/components/home/home-navbar";
import HomeSidebar from "@/components/home/home-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

interface Props {
   children: React.ReactNode;
}

export default function Layout({ children }: Props) {
   return (
      <SidebarProvider>
         <div className="w-full">
            <HomeNavbar />
            <div className=" flex min-h-screen pt-[4rem]">
               <HomeSidebar />
               <main className=" flex-1 overflow-y-auto">{children}</main>
            </div>
         </div>
      </SidebarProvider>
   );
   //return <HomeLayout>{children}</HomeLayout>;
}
