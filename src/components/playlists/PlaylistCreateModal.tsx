import ResponsiveModal from "@/components/common/ResponsiveModal";
import { Button } from "@/components/ui/button";
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
} from "@/components/ui/form";
import { trpc } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Input } from "../ui/input";

interface PlaylistCreateModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
   name: z.string().min(10),
});

export default function PlaylistCreateModal({
   open,
   onOpenChange,
}: PlaylistCreateModalProps) {
   const utils = trpc.useUtils();
   const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
         name: "",
      },
   });

   const create = trpc.playlists.create.useMutation({
      onSuccess: () => {
         toast.success("Playlist created");
         utils.playlists.getMany.invalidate();
      },
      onError: (error) => {
         toast.error(error.message);
      },
   });

   function onSubmit(values: z.infer<typeof formSchema>) {
      create.mutate({ name: values.name });
      form.reset();
      onOpenChange(false);
      // utils.studio.getOne.invalidate({ id: videoId });
      // utils.studio.getMany.invalidate();
   }
   return (
      <ResponsiveModal
         title="Create Playlist"
         open={open}
         onOpenChange={onOpenChange}
      >
         <Form {...form}>
            <form
               className=" flex flex-col gap-4"
               onSubmit={form.handleSubmit(onSubmit)}
            >
               <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                           <Input
                              {...field}
                              placeholder="Input a name for your playlist"
                           />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />
               <div className=" flex justify-end">
                  <Button type="submit" disabled={create.isPending}>
                     Create
                  </Button>
               </div>
            </form>
         </Form>
      </ResponsiveModal>
   );
}
