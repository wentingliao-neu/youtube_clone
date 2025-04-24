import StudioNavbar from "@/components/studio/studio-navbar";
import StudioSidebar from "@/components/studio/studio-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
export const dynamic = "force-dynamic";

interface Props {
   children: React.ReactNode;
}

export default function layout({ children }: Props) {
   return (
      <SidebarProvider>
         <div className=" w-full">
            <StudioNavbar />
            <div className=" flex min-h-screen pt-[4rem]">
               <StudioSidebar />
               <main className=" flex-1 overflow-y-auto">{children}</main>
            </div>
         </div>
      </SidebarProvider>
   );
   // return <StudioLayout>{children}</StudioLayout>;
}
