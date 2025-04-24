import { useUser, useClerk } from "@clerk/nextjs";
import UserAvatar from "../common/UserAvatar";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { commentInsertSchema } from "@/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormMessage,
} from "../ui/form";

interface CommentFormProps {
   videoId: string;
   onSuccess?: () => void;
   onCancel?: () => void;
   parentId?: string;
}

export default function CommentForm({
   videoId,
   onSuccess,
   onCancel,
   parentId,
}: CommentFormProps) {
   const { user } = useUser();
   const clerk = useClerk();
   const utils = trpc.useUtils();
   const create = trpc.comments.create.useMutation({
      onSuccess: () => {
         utils.comments.getMany.invalidate({ videoId });
         utils.comments.getMany.invalidate({ videoId, parentId }); //necessary?
         form.reset();
         toast.success("Comment added successfully!");
         onSuccess?.();
      },
      onError: (error) => {
         if (error.data?.code === "UNAUTHORIZED") clerk.openSignIn();
         else toast.error("Failed to add comment. Please try again.");
      },
   });
   const form = useForm<z.infer<typeof commentInsertSchema>>({
      resolver: zodResolver(commentInsertSchema.omit({ userId: true })),
      defaultValues: {
         videoId,
         value: "",
         parentId,
      },
   });

   function handleSubmit(values: z.infer<typeof commentInsertSchema>) {
      create.mutate(values);
   }

   function handleCancel() {
      form.reset();
      onCancel?.();
   }

   return (
      <Form {...form}>
         <form
            className=" flex gap-4 group"
            onSubmit={form.handleSubmit(handleSubmit)}
         >
            <UserAvatar
               size={"lg"}
               imageUrl={user?.imageUrl || "/user-placeholder.svg"}
               name={user?.fullName || "User"}
            />
            <div className=" flex-1">
               <FormField
                  name="value"
                  control={form.control}
                  render={({ field }) => (
                     <FormItem>
                        <FormControl>
                           <Textarea
                              {...field}
                              placeholder={
                                 // variant === "comment"
                                 !parentId ? " Add a comment..." : "Reply..."
                              }
                              className=" resize-none bg-transparent overflow-hidden min-h-0"
                           />
                        </FormControl>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <div className=" justify-end gap-2 mt-2 flex">
                  {onCancel && (
                     <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={handleCancel}
                     >
                        Cancel
                     </Button>
                  )}
                  <Button size="sm" type="submit" disabled={create.isPending}>
                     {parentId ? "Reply" : "Comment"}
                  </Button>
               </div>
            </div>
         </form>
      </Form>
   );
}
