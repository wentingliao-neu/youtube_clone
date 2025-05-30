import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../ui/drawer";

interface ResponsiveDialogProps {
   children: React.ReactNode;
   open: boolean;
   title: string;
   onOpenChange: (open: boolean) => void;
}

export default function ResponsiveModal({
   children,
   onOpenChange,
   open,
   title,
}: ResponsiveDialogProps) {
   const isMobile = useIsMobile();
   return isMobile ? (
      <Drawer open={open} onOpenChange={onOpenChange}>
         <DrawerContent>
            <DrawerHeader>
               <DrawerTitle>{title}</DrawerTitle>
            </DrawerHeader>
            {children}
         </DrawerContent>
      </Drawer>
   ) : (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            {children}
         </DialogContent>
      </Dialog>
   );
}
