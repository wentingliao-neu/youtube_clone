"use client";
import PlaylistCreateModal from "@/components/playlists/PlaylistCreateModal";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
export default function PlaylisyView() {
   const [createModalOpen, setCreateModalOpen] = useState(false);
   return (
      <div className=" max-w-[2400px] mx-auto mb-10 px-4 pt-2.5 flex flex-col gap-y-6">
         <PlaylistCreateModal
            open={createModalOpen}
            onOpenChange={setCreateModalOpen}
         />
         <div className=" flex justify-between items-center ">
            <div>
               <h1 className=" text-2xl font-bold">Playlists</h1>
               <p className=" text-xs text-muted-foreground">
                  Collections you have created
               </p>
            </div>
            <Button
               className=" rounded-full"
               size={"icon"}
               variant={"outline"}
               onClick={() => setCreateModalOpen(true)}
            >
               <PlusIcon />
            </Button>
         </div>
      </div>
   );
}
