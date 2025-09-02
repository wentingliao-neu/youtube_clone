import db from "@/db";
import { blocks, commentReactions, comments, users } from "@/db/schema";
import {
   baseProcedure,
   createTRPCRouter,
   protectedProcedure,
} from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import {
   desc,
   eq,
   getTableColumns,
   and,
   or,
   lt,
   count,
   inArray,
   isNull,
   isNotNull,
} from "drizzle-orm";
import { z } from "zod";

export const commentsRouter = createTRPCRouter({
   create: protectedProcedure
      .input(
         z.object({
            parentId: z.string().uuid().nullish(),
            videoId: z.string().uuid(),
            value: z.string(),
         })
      )
      .mutation(async ({ ctx, input }) => {
         const { id: userId } = ctx.user;
         const { videoId, value, parentId } = input;

         const [existingComment] = await db
            .select()
            .from(comments)
            .where(inArray(comments.id, parentId ? [parentId] : []));

         if (parentId) {
            // Check if the parent comment exists and is not a reply
            if (!existingComment)
               throw new TRPCError({
                  code: "NOT_FOUND",
                  message: "Parent comment not found",
               });
            if (existingComment.parentId)
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Cannot reply to a reply",
               });
         }

         const [newComment] = await db
            .insert(comments)
            .values({
               userId,
               videoId,
               value,
               parentId,
            })
            .returning();
         return newComment;
      }),

   remove: protectedProcedure
      .input(
         z.object({
            id: z.string().uuid(),
         })
      )
      .mutation(async ({ ctx, input }) => {
         const { id: userId } = ctx.user;
         const { id } = input;

         const [comment] = await db
            .delete(comments)
            .where(and(eq(comments.id, id), eq(comments.userId, userId)))
            .returning();
         if (!comment)
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "Comment not found",
            });
         return comment;
      }),

   getMany: baseProcedure
      .input(
         z.object({
            videoId: z.string().uuid(),
            parentId: z.string().uuid().nullish(),
            cursor: z
               .object({
                  id: z.string().uuid(),
                  updatedAt: z.date(),
               })
               .nullish(),
            limit: z.number().min(1).max(100),
         })
      )
      .query(async ({ input, ctx }) => {
         const { clerkUserId } = ctx;
         const { videoId, cursor, limit, parentId } = input;

         let userId;
         const [user] = await db
            .select()
            .from(users)
            .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []));
         if (user) userId = user.id;

         const viewerReactions = db.$with("viewer_reactions").as(
            db
               .select({
                  commentId: commentReactions.commentId,
                  type: commentReactions.type,
               })
               .from(commentReactions)
               .where(inArray(commentReactions.userId, userId ? [userId] : []))
         );

         const repliesCount = db.$with("replies").as(
            db
               .select({
                  parentId: comments.parentId,
                  count: count(comments.id).as("count"),
               })
               .from(comments)
               .where(isNotNull(comments.parentId))
               .groupBy(comments.parentId)
         );

         const [totalData, data] = await Promise.all([
            await db
               .select({ count: count() })
               .from(comments)
               .where(eq(comments.videoId, videoId)),

            await db
               .with(viewerReactions, repliesCount)
               .select({
                  ...getTableColumns(comments),
                  user: users,
                  viewerReaction: viewerReactions.type,
                  replyCount: repliesCount.count,
                  likeCount: db.$count(
                     commentReactions,
                     and(
                        eq(commentReactions.commentId, comments.id),
                        eq(commentReactions.type, "like")
                     )
                  ),
                  dislikeCount: db.$count(
                     commentReactions,
                     and(
                        eq(commentReactions.commentId, comments.id),
                        eq(commentReactions.type, "dislike")
                     )
                  ),
               })
               .from(comments)
               .where(
                  and(
                     eq(comments.videoId, videoId),
                     isNull(blocks.blockedId), // 如果当前用户屏蔽了这条评论的发起者，当前用户看不到这条评论
                     parentId
                        ? eq(comments.parentId, parentId)
                        : isNull(comments.parentId),
                     cursor
                        ? or(
                             lt(comments.updatedAt, cursor.updatedAt),
                             and(
                                eq(comments.updatedAt, cursor.updatedAt),
                                lt(comments.id, cursor.id)
                             )
                          )
                        : undefined
                  )
               )
               .innerJoin(users, eq(comments.userId, users.id))
               .leftJoin(
                  viewerReactions,
                  eq(viewerReactions.commentId, comments.id)
               )
               .leftJoin(repliesCount, eq(repliesCount.parentId, comments.id))
               .leftJoin(
                  blocks,
                  and(
                     eq(blocks.blockerId, userId || ""),
                     eq(blocks.blockedId, comments.userId)
                  )
               )
               .orderBy(desc(comments.updatedAt), desc(comments.id))
               .limit(limit + 1),
         ]);

         const haseMore = data.length > limit;
         const items = haseMore ? data.slice(0, -1) : data;
         const lastItem = items[items.length - 1];
         const nextCursor = haseMore
            ? { updatedAt: lastItem.updatedAt, id: lastItem.id }
            : null;
         return { items, nextCursor, totalCount: totalData[0].count };
      }),
});
