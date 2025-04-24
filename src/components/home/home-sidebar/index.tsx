import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import Section from "./Section";
import { SignedIn } from "@clerk/nextjs";
import SubscriptionsSection from "./SubscriptionsSection";

export default function HomeSidebar() {
   return (
      <Sidebar className=" pt-16 z-40 border-none" collapsible="icon">
         <SidebarContent className=" bg-background">
            <Section type="main" />
            <Separator />
            <Section type="personal" />
            <SignedIn>
               <>
                  <Separator />
                  <SubscriptionsSection />
               </>
            </SignedIn>
         </SidebarContent>
      </Sidebar>
   );
}
