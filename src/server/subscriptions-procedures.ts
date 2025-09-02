import db from "@/db";
import { streams, subscriptions, users } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, getTableColumns, lt, or, sql } from "drizzle-orm";
import { z } from "zod";

export const subscriptionsRouter = createTRPCRouter({
   create: protectedProcedure
      .input(z.object({ userId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
         const { userId } = input;
         if (userId === ctx.user.id)
            throw new TRPCError({ code: "BAD_REQUEST" });

         const [subscription] = await db
            .insert(subscriptions)
            .values({
               creatorId: userId,
               viewerId: ctx.user.id,
            })
            .returning();
         return subscription;
      }),

   remove: protectedProcedure
      .input(z.object({ userId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
         const { userId } = input;
         if (userId === ctx.user.id)
            throw new TRPCError({ code: "BAD_REQUEST" });

         const [subscription] = await db
            .delete(subscriptions)
            .where(
               and(
                  eq(subscriptions.creatorId, userId),
                  eq(subscriptions.viewerId, ctx.user.id)
               )
            )
            .returning();
         return subscription;
      }),

   getMany: protectedProcedure
      .input(
         z.object({
            cursor: z
               .object({
                  updatedAt: z.date(),
                  creatorId: z.string().uuid(),
               })
               .nullish(),
            limit: z.number().min(1).max(10).default(5),
         })
      )
      .query(async ({ input, ctx }) => {
         const { cursor, limit } = input;
         const { id: userId } = ctx.user;
         // const viewCountSubquery = db.$count(
         //    videoViews,
         //    eq(videoViews.videoId, videos.id)
         // );

         const viewerSubscriptions = db
            .$with("viewer_subscriptions")
            .as(
               db
                  .select({ userId: subscriptions.creatorId })
                  .from(subscriptions)
                  .where(eq(subscriptions.viewerId, userId))
            );

         const data = await db
            .with(viewerSubscriptions)
            .select({
               ...getTableColumns(subscriptions),
               user: {
                  ...getTableColumns(users),
                  subscriberCount: db.$count(
                     subscriptions,
                     eq(subscriptions.creatorId, users.id)
                  ),
                  isLive:
                     sql<boolean>`COALESCE(${streams.isLive}, false)`.mapWith(
                        Boolean
                     ),
               },
            })
            .from(subscriptions)
            .innerJoin(users, eq(users.id, subscriptions.creatorId))
            // .innerJoin(videos, eq(videos.userId, subscriptions.creatorId))
            .leftJoin(streams, eq(streams.userId, subscriptions.creatorId))
            .where(
               and(
                  eq(subscriptions.viewerId, userId),
                  cursor
                     ? or(
                          lt(subscriptions.updatedAt, cursor.updatedAt),
                          and(
                             eq(subscriptions.updatedAt, cursor.updatedAt),
                             lt(subscriptions.creatorId, cursor.creatorId)
                          )
                       )
                     : undefined
               )
            )
            .orderBy(
               // desc(viewCountSubquery),
               desc(subscriptions.updatedAt),
               desc(subscriptions.creatorId)
            )
            .limit(limit + 1);
         const haseMore = data.length > limit;
         const items = haseMore ? data.slice(0, -1) : data;
         const lastItem = items[items.length - 1];
         const nextCursor = haseMore
            ? {
                 updatedAt: lastItem.updatedAt,
                 creatorId: lastItem.creatorId,
              }
            : null;
         return { items, nextCursor };
      }),
});
