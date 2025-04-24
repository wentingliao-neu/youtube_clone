import db from "@/db";
import {
   comments,
   users,
   videoReactions,
   videos,
   videoViews,
} from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { eq, and, or, lt, desc, getTableColumns } from "drizzle-orm";
import { z } from "zod";
export const studioRouter = createTRPCRouter({
   getOne: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
         const { id: userId } = ctx.user;
         const { id } = input;
         const [video] = await db
            .select()
            .from(videos)
            .where(and(eq(videos.id, id), eq(videos.userId, userId)));
         if (!video) {
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "Video not found",
            });
         }
         return video;
      }),
   getMany: protectedProcedure
      .input(
         z.object({
            cursor: z
               .object({ updatedAt: z.date(), id: z.string().uuid() })
               .nullish(),
            limit: z.number().min(1).max(10).default(5),
         })
      )
      .query(async ({ ctx, input }) => {
         const { cursor, limit } = input;
         const { id: userId } = ctx.user;
         const data = await db
            .select({
               ...getTableColumns(videos),
               user: users,
               viewCount: db.$count(
                  videoViews,
                  eq(videoViews.videoId, videos.id)
               ),
               commentCount: db.$count(
                  comments,
                  eq(comments.videoId, videos.id)
               ),
               likeCount: db.$count(
                  videoReactions,
                  and(
                     eq(videoReactions.type, "like"),
                     eq(videoReactions.videoId, videos.id)
                  )
               ),
            })
            .from(videos)
            .innerJoin(users, eq(videos.userId, users.id))
            .where(
               and(
                  eq(videos.userId, userId),
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
