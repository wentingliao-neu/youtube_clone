import db from "@/db";
import { commentReactions } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

export const commentReactionsRouter = createTRPCRouter({
   like: protectedProcedure
      .input(z.object({ commentId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
         const { id: userId } = ctx.user;
         const { commentId } = input;
         // Check if the user has already reacted to the comment with a like
         const [existingReaction] = await db
            .select()
            .from(commentReactions)
            .where(
               and(
                  eq(commentReactions.userId, userId),
                  eq(commentReactions.commentId, commentId),
                  eq(commentReactions.type, "like")
               )
            );
         // If the user has already reacted with a like, delete the reaction
         if (existingReaction) {
            const [deletedReaction] = await db
               .delete(commentReactions)
               .where(
                  and(
                     eq(commentReactions.userId, userId),
                     eq(commentReactions.commentId, commentId)
                  )
               )
               .returning();
            return deletedReaction;
         }
         // If the user has not reacted with a like, insert a new reaction

         const [newReaction] = await db
            .insert(commentReactions)
            .values({
               userId,
               commentId,
               type: "like",
            })
            .onConflictDoUpdate({
               target: [commentReactions.userId, commentReactions.commentId],
               set: {
                  type: "like",
               },
            }) //If the user has reacted with a dislike, update the reaction to like
            .returning();
         return newReaction;
      }),

   dislike: protectedProcedure
      .input(z.object({ commentId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
         const { id: userId } = ctx.user;
         const { commentId } = input;
         const [existingReaction] = await db
            .select()
            .from(commentReactions)
            .where(
               and(
                  eq(commentReactions.userId, userId),
                  eq(commentReactions.commentId, commentId),
                  eq(commentReactions.type, "dislike")
               )
            );
         if (existingReaction) {
            const [deletedReaction] = await db
               .delete(commentReactions)
               .where(
                  and(
                     eq(commentReactions.userId, userId),
                     eq(commentReactions.commentId, commentId)
                  )
               )
               .returning();
            return deletedReaction;
         }

         const [newReaction] = await db
            .insert(commentReactions)
            .values({
               userId,
               commentId,
               type: "dislike",
            })
            .onConflictDoUpdate({
               target: [commentReactions.userId, commentReactions.commentId],
               set: {
                  type: "dislike",
               },
            })
            .returning();
         return newReaction;
      }),
});
