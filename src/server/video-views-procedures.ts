import db from "@/db";
import { videoViews } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

export const videoViewsRouter = createTRPCRouter({
   create: protectedProcedure
      .input(z.object({ videoId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
         const { id: userId } = ctx.user;
         const { videoId } = input;
         const [existingView] = await db
            .select()
            .from(videoViews)
            .where(
               and(
                  eq(videoViews.userId, userId),
                  eq(videoViews.videoId, videoId)
               )
            );
         if (existingView) {
            return existingView;
         }
         const [newView] = await db
            .insert(videoViews)
            .values({
               userId,
               videoId,
            })
            .returning();
         return newView;
      }),
});
