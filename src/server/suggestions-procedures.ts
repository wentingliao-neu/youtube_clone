import db from "@/db";
import { users, videoReactions, videos, videoViews } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { eq, and, or, lt, desc, getTableColumns, not } from "drizzle-orm";
import { z } from "zod";
export const suggestionsRouter = createTRPCRouter({
   getMany: baseProcedure
      .input(
         z.object({
            cursor: z
               .object({ updatedAt: z.date(), id: z.string().uuid() })
               .nullish(),
            limit: z.number().min(1).max(10).default(5),
            videoId: z.string().uuid(),
         })
      )
      .query(async ({ input }) => {
         const { cursor, limit, videoId } = input;
         //const { id: userId } = ctx.user;

         const [video] = await db
            .select()
            .from(videos)
            .where(eq(videos.id, videoId));
         if (!video)
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "Video not found",
            });

         const data = await db
            .select({
               ...getTableColumns(videos),
               viewCount: db.$count(
                  videoViews,
                  eq(videoViews.videoId, videos.id)
               ),
               user: users,
               likeCount: db.$count(
                  videoReactions,
                  and(
                     eq(videoReactions.videoId, videos.id),
                     eq(videoReactions.type, "like")
                  )
               ),
               dislikeCount: db.$count(
                  videoReactions,
                  and(
                     eq(videoReactions.videoId, videos.id),
                     eq(videoReactions.type, "dislike")
                  )
               ),
            })
            .from(videos)
            .innerJoin(users, eq(users.id, videos.userId))
            .where(
               and(
                  not(eq(videos.id, videoId)),
                  eq(videos.visibility, "public"),
                  video.categoryId
                     ? eq(videos.categoryId, video.categoryId)
                     : undefined,
                  cursor
                     ? or(
                          lt(videos.updatedAt, cursor.updatedAt),
                          and(
                             eq(videos.updatedAt, cursor.updatedAt),
                             lt(videos.id, cursor.id)
                          )
                       )
                     : undefined
               )
            )
            .orderBy(desc(videos.updatedAt), desc(videos.id))
            .limit(limit + 1);
         const haseMore = data.length > limit;
         const items = haseMore ? data.slice(0, -1) : data;
         const lastItem = items[items.length - 1];
         const nextCursor = haseMore
            ? { updatedAt: lastItem.updatedAt, id: lastItem.id }
            : null;
         return { items, nextCursor };
      }),
});
