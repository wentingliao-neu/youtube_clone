import db from "@/db";
import {
   subscriptions,
   users,
   videoReactions,
   videos,
   videoViews,
   streams,
   blocks,
} from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import {
   and,
   desc,
   eq,
   getTableColumns,
   inArray,
   isNotNull,
   lt,
   or,
   sql,
} from "drizzle-orm";

import { z } from "zod";

export const usersRouter = createTRPCRouter({
   getOne: baseProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
         //get the reaction of current user
         //把clerk id作为userId就啥事没有了
         const { clerkUserId } = ctx;
         let userId;
         const [user] = await db
            .select()
            .from(users)
            .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []));
         if (user) userId = user.id;

         const viewerSubscriptions = db.$with("viewer_subscriptions").as(
            db
               .select()
               .from(subscriptions)
               .where(inArray(subscriptions.viewerId, userId ? [userId] : []))
         );

         const [existingUser] = await db
            .with(viewerSubscriptions)
            .select({
               ...getTableColumns(users),
               subscriberCount: db.$count(
                  subscriptions,
                  eq(subscriptions.creatorId, users.id)
               ),
               viewerSubscribed: isNotNull(
                  viewerSubscriptions.viewerId
               ).mapWith(Boolean),
               viewerBlocked: sql<boolean>`EXISTS(
                  SELECT 1 FROM ${blocks} 
                  WHERE ${blocks.blockerId} = ${userId || null} 
                  AND ${blocks.blockedId} = ${users.id}
               )`.mapWith(Boolean),
               viewerBeBlocked: sql<boolean>`EXISTS(
                  SELECT 1 FROM ${blocks} 
                  WHERE ${blocks.blockerId} = ${users.id} 
                  AND ${blocks.blockedId} = ${userId || null}
               )`.mapWith(Boolean),
               videoCount: db.$count(videos, eq(videos.userId, users.id)),

               isLive: sql<boolean>`COALESCE(${streams.isLive}, false)`.mapWith(
                  Boolean
               ),
            })
            .from(users)
            .leftJoin(
               viewerSubscriptions,
               eq(users.id, viewerSubscriptions.creatorId)
            )
            .leftJoin(streams, eq(streams.userId, users.id))
            .where(eq(users.id, input.id));

         if (!existingUser) throw new TRPCError({ code: "NOT_FOUND" });
         return existingUser;
      }),

   getMany: baseProcedure
      .input(
         z.object({
            categoryId: z.string().uuid().nullish(),
            isTrending: z.boolean().default(false),
            cursor: z
               .object({
                  updatedAt: z.date(),
                  id: z.string().uuid(),
                  viewCount: z.number(),
               })
               .nullish(),
            limit: z.number().min(1).max(10).default(5),
         })
      )
      .query(async ({ input }) => {
         const { cursor, limit, categoryId, isTrending } = input;

         const viewCountSubquery = db.$count(
            videoViews,
            eq(videoViews.videoId, videos.id)
         );

         const data = await db
            .select({
               ...getTableColumns(videos),
               viewCount: viewCountSubquery,
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
                  categoryId ? eq(videos.categoryId, categoryId) : undefined,
                  eq(videos.visibility, "public"),
                  cursor
                     ? isTrending
                        ? or(
                             lt(viewCountSubquery, cursor.viewCount),
                             and(eq(viewCountSubquery, cursor.viewCount))
                          )
                        : or(
                             lt(videos.updatedAt, cursor.updatedAt),
                             and(
                                eq(videos.updatedAt, cursor.updatedAt),
                                lt(videos.id, cursor.id)
                             )
                          )
                     : undefined
               )
            )
            .orderBy(
               desc(viewCountSubquery),
               desc(videos.updatedAt),
               desc(videos.id)
            )
            .limit(limit + 1);
         const haseMore = data.length > limit;
         const items = haseMore ? data.slice(0, -1) : data;
         const lastItem = items[items.length - 1];
         const nextCursor = haseMore
            ? {
                 updatedAt: lastItem.updatedAt,
                 id: lastItem.id,
                 viewCount: lastItem.viewCount,
              }
            : null;
         return { items, nextCursor };
      }),
});
