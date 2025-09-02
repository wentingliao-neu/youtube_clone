import db from "@/db";
import { streams, users, videos } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";
import { z } from "zod";

const f = createUploadthing();

export const ourFileRouter = {
   thumbnailUploader: f({
      image: {
         maxFileSize: "4MB",
         maxFileCount: 1,
      },
   })
      .input(z.object({ videoId: z.string().uuid() }))
      .middleware(async ({ input }) => {
         const { userId: clerkUserId } = await auth();

         if (!clerkUserId) throw new UploadThingError("Unauthorized");

         const [user] = await db
            .select()
            .from(users)
            .where(eq(users.clerkId, clerkUserId));

         if (!user) throw new UploadThingError("Unauthorized");

         const [video] = await db
            .select({ thumbnailKey: videos.thumbnailKey })
            .from(videos)
            .where(
               and(eq(videos.id, input.videoId), eq(videos.userId, user.id))
            );

         if (!video) throw new UploadThingError("Video not found");

         if (video.thumbnailKey) {
            const utapi = new UTApi();
            await utapi.deleteFiles(video.thumbnailKey);
            await db
               .update(videos)
               .set({ thumbnailKey: null, thumbnailUrl: null })
               .where(
                  and(eq(videos.id, input.videoId), eq(videos.userId, user.id))
               );
         }

         return { user, ...input };
      })
      .onUploadComplete(async ({ metadata, file }) => {
         // This code RUNS ON YOUR SERVER after upload
         await db
            .update(videos)
            .set({ thumbnailUrl: file.ufsUrl, thumbnailKey: file.key })
            .where(
               and(
                  eq(videos.id, metadata.videoId),
                  eq(videos.userId, metadata.user.id)
               )
            );

         // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
         return { uploadedBy: metadata.user.id };
      }),

   bannerUploader: f({
      image: {
         maxFileSize: "4MB",
         maxFileCount: 1,
      },
   })
      .middleware(async () => {
         const { userId: clerkUserId } = await auth();

         if (!clerkUserId) throw new UploadThingError("Unauthorized");

         const [user] = await db
            .select()
            .from(users)
            .where(eq(users.clerkId, clerkUserId));

         if (!user) throw new UploadThingError("Not found");
         if (user.bannerKey) {
            const utapi = new UTApi();
            await utapi.deleteFiles(user.bannerKey);
            await db
               .update(users)
               .set({ bannerKey: null, bannerUrl: null })
               .where(eq(users.clerkId, clerkUserId));
         }

         return { userId: user.id };
      })
      .onUploadComplete(async ({ metadata, file }) => {
         // This code RUNS ON YOUR SERVER after upload
         await db
            .update(users)
            .set({ bannerUrl: file.ufsUrl, bannerKey: file.key })
            .where(eq(videos.userId, metadata.userId));

         // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
         return { uploadedBy: metadata.userId };
      }),

   roomThumbnailUploader: f({
      image: {
         maxFileSize: "4MB",
         maxFileCount: 1,
      },
   })
      .input(z.object({ streamId: z.string().uuid() }))
      .middleware(async ({ input }) => {
         const { userId: clerkUserId } = await auth();

         if (!clerkUserId) throw new UploadThingError("Unauthorized");
         const [user] = await db
            .select()
            .from(users)
            .where(eq(users.clerkId, clerkUserId));
         if (!user) throw new UploadThingError("Not found");
         const [stream] = await db
            .select()
            .from(streams)
            .where(
               and(eq(streams.id, input.streamId), eq(streams.userId, user.id))
            );

         if (stream.thumbnailKey) {
            const utapi = new UTApi();
            await utapi.deleteFiles(stream.thumbnailKey);
            await db
               .update(streams)
               .set({ thumbnailKey: null, thumbnailUrl: null })
               .where(eq(users.clerkId, clerkUserId));
         }

         return { streamId: stream.id, userId: user.id };
      })
      .onUploadComplete(async ({ metadata, file }) => {
         // This code RUNS ON YOUR SERVER after upload
         await db
            .update(streams)
            .set({ thumbnailUrl: file.ufsUrl, thumbnailKey: file.key })
            .where(
               and(
                  eq(streams.id, metadata.streamId),
                  eq(streams.userId, metadata.userId)
               )
            );

         // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
         return { uploadedBy: metadata.userId };
      }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
