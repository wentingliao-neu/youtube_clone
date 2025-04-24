import db from "@/db";
import { videos } from "@/db/schema";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";

interface InputType {
   userId: string;
   videoId: string;
   prompt: string;
}

export const { POST } = serve(async (context) => {
   const input = context.requestPayload as InputType;
   const utapi = new UTApi();
   const { userId, videoId, prompt } = input;
   const video = await context.run("get-video", async () => {
      const [data] = await db
         .select()
         .from(videos)
         .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));

      if (!data) throw new Error("Not found");
      return data;
   });

   const { body } = await context.call<{ data: Array<{ url: string }> }>(
      "generate-thumbnail",
      {
         url: "https://api.openai.com/v1/images/generations",
         method: "POST",
         headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY!}` },
         body: {
            prompt,
            n: "1",
            model: "dall-e-3",
            size: "1792x1024",
         },
      }
   );

   const imageUrl = body.data[0].url;
   if (!imageUrl) throw new Error("Bad request");

   const uploadedThumbnail = await context.run("upload-thumbnail", async () => {
      const { data } = await utapi.uploadFilesFromUrl(imageUrl);
      if (!data) throw new Error("Bad request");
      return data;
   });

   await context.run("cleanup-thumbnail", async () => {
      if (video.thumbnailKey) {
         await utapi.deleteFiles(video.thumbnailKey);
      }
      await db
         .update(videos)
         .set({ thumbnailUrl: null, thumbnailKey: null })
         .where(and(eq(videos.id, video.id), eq(videos.userId, video.userId)));
   });

   await context.run("update-thumbnail", async () => {
      await db
         .update(videos)
         .set({
            thumbnailUrl: uploadedThumbnail.ufsUrl,
            thumbnailKey: uploadedThumbnail.key,
         })
         .where(and(eq(videos.id, video.id), eq(videos.userId, video.userId)));
   });
});
