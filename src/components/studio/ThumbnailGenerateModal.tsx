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
import { Textarea } from "@/components/ui/textarea";

import { trpc } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface ThumbnailGenerateModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   videoId: string;
}

const formSchema = z.object({
   prompt: z.string().min(10),
});

export default function ThumbnailGenerateModal({
   open,
   onOpenChange,
   videoId,
}: ThumbnailGenerateModalProps) {
   //const utils = trpc.useUtils();
   const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
         prompt: "",
      },
   });

   const generateThumbnail = trpc.videos.generateThumbnail.useMutation({
      onSuccess: () => {
         toast.success("Generation started", {
            description: "This may take a few minutes",
         });
      },
      onError: (error) => {
         toast.error(error.message);
      },
   });

   function onSubmit(values: z.infer<typeof formSchema>) {
      generateThumbnail.mutate({ id: videoId, prompt: values.prompt });
      form.reset();
      onOpenChange(false);
      // utils.studio.getOne.invalidate({ id: videoId });
      // utils.studio.getMany.invalidate();
   }
   return (
      <ResponsiveModal
         title="Upload a thumbnail"
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
                  name="prompt"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel>Prompt</FormLabel>
                        <FormControl>
                           <Textarea
                              {...field}
                              className=" resize-none"
                              cols={30}
                              rows={5}
                              placeholder="A description of thumbnail"
                           />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />
               <div className=" flex justify-end">
                  <Button type="submit" disabled={generateThumbnail.isPending}>
                     Generate
                  </Button>
               </div>
            </form>
         </Form>
      </ResponsiveModal>
   );
}
