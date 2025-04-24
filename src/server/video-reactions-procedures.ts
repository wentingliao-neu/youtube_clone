import db from "@/db";
import { videoReactions } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

export const videoReactionsRouter = createTRPCRouter({
   like: protectedProcedure
      .input(z.object({ videoId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
         const { id: userId } = ctx.user;
         const { videoId } = input;
         // Check if the user has already reacted to the video with a like
         const [existingReaction] = await db
            .select()
            .from(videoReactions)
            .where(
               and(
                  eq(videoReactions.userId, userId),
                  eq(videoReactions.videoId, videoId),
                  eq(videoReactions.type, "like")
               )
            );
         // If the user has already reacted with a like, delete the reaction
         if (existingReaction) {
            const [deletedReaction] = await db
               .delete(videoReactions)
               .where(
                  and(
                     eq(videoReactions.userId, userId),
                     eq(videoReactions.videoId, videoId)
                  )
               )
               .returning();
            return deletedReaction;
         }
         // If the user has not reacted with a like, insert a new reaction

         const [newReaction] = await db
            .insert(videoReactions)
            .values({
               userId,
               videoId,
               type: "like",
            })
            .onConflictDoUpdate({
               target: [videoReactions.userId, videoReactions.videoId],
               set: {
                  type: "like",
               },
            }) //If the user has reacted with a dislike, update the reaction to like
            .returning();
         return newReaction;
      }),

   dislike: protectedProcedure
      .input(z.object({ videoId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
         const { id: userId } = ctx.user;
         const { videoId } = input;
         const [existingReaction] = await db
            .select()
            .from(videoReactions)
            .where(
               and(
                  eq(videoReactions.userId, userId),
                  eq(videoReactions.videoId, videoId),
                  eq(videoReactions.type, "dislike")
               )
            );
         if (existingReaction) {
            const [deletedReaction] = await db
               .delete(videoReactions)
               .where(
                  and(
                     eq(videoReactions.userId, userId),
                     eq(videoReactions.videoId, videoId)
                  )
               )
               .returning();
            return deletedReaction;
         }

         const [newReaction] = await db
            .insert(videoReactions)
            .values({
               userId,
               videoId,
               type: "dislike",
            })
            .onConflictDoUpdate({
               target: [videoReactions.userId, videoReactions.videoId],
               set: {
                  type: "dislike",
               },
            })
            .returning();
         return newReaction;
      }),
});
