import db from "@/db";
import { blocks, users, videoReactions, videos, videoViews } from "@/db/schema";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";

import {
   eq,
   and,
   or,
   lt,
   desc,
   ilike,
   getTableColumns,
   inArray,
   notExists,
} from "drizzle-orm";
import { z } from "zod";
export const searchRouter = createTRPCRouter({
   getMany: baseProcedure
      .input(
         z.object({
            query: z.string().nullish(),
            categoryId: z.string().uuid().nullish(),
            cursor: z
               .object({ updatedAt: z.date(), id: z.string().uuid() })
               .nullish(),
            limit: z.number().min(1).max(10).default(5),
         })
      )
      .query(async ({ input, ctx }) => {
         const { cursor, limit, query, categoryId } = input;
         const { clerkUserId } = ctx;
         let currentUserId;
         if (clerkUserId) {
            const [user] = await db
               .select()
               .from(users)
               .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []));
            if (user) currentUserId = user.id;
         }

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
                  ilike(videos.title, `%${query}%`),
                  categoryId ? eq(videos.categoryId, categoryId) : undefined,
                  currentUserId
                     ? notExists(
                          db
                             .select()
                             .from(blocks)
                             .where(
                                and(
                                   eq(blocks.blockerId, currentUserId),
                                   eq(blocks.blockedId, videos.userId)
                                )
                             )
                       )
                     : undefined,
                  eq(videos.visibility, "public"),
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
