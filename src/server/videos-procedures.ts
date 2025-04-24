import db from "@/db";
import {
   subscriptions,
   users,
   videoReactions,
   videos,
   videoUpdateSchema,
   videoViews,
} from "@/db/schema";
import { mux } from "@/lib/mux";
import { workflow } from "@/lib/workflow";
import {
   baseProcedure,
   createTRPCRouter,
   protectedProcedure,
} from "@/trpc/init";
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
} from "drizzle-orm";

import { UTApi } from "uploadthing/server";
import { z } from "zod";

export const videosRouter = createTRPCRouter({
   //AI-based generation
   generateTitle: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
         const { id: userId } = ctx.user;
         const { workflowRunId } = await workflow.trigger({
            url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/title`,
            body: {
               userId,
               videoId: input.id,
            },
         });
         return workflowRunId;
      }),

   generateDescription: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
         const { id: userId } = ctx.user;
         const { workflowRunId } = await workflow.trigger({
            url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/description`,
            body: {
               userId,
               videoId: input.id,
            },
         });
         return workflowRunId;
      }),

   generateThumbnail: protectedProcedure
      .input(z.object({ id: z.string().uuid(), prompt: z.string().min(10) }))
      .mutation(async ({ ctx, input }) => {
         const { id: userId } = ctx.user;
         const { workflowRunId } = await workflow.trigger({
            url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/thumbnail`,
            body: {
               userId,
               videoId: input.id,
               prompt: input.prompt,
            },
         });
         return workflowRunId;
      }),

   restoreThumbnail: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
         const { id: userId } = ctx.user;
         if (!input.id) throw new TRPCError({ code: "BAD_REQUEST" });

         const [video] = await db
            .select()
            .from(videos)
            .where(and(eq(videos.id, input.id), eq(videos.userId, userId)));

         if (!video) throw new TRPCError({ code: "NOT_FOUND" });

         if (video.thumbnailKey) {
            const utapi = new UTApi();
            await utapi.deleteFiles(video.thumbnailKey);
            await db
               .update(videos)
               .set({ thumbnailKey: null, thumbnailUrl: null })
               .where(and(eq(videos.id, input.id), eq(videos.userId, userId)));
         }

         if (!video.muxPlaybackId) throw new TRPCError({ code: "BAD_REQUEST" });

         const thumbnailUrl0 = `https://image.mux.com/${video.muxPlaybackId}/thumbnail.jpg`;

         const utapi = new UTApi();
         const uploadedThumbnail = await utapi.uploadFilesFromUrl([
            thumbnailUrl0,
         ]);
         if (!uploadedThumbnail[0]?.data)
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
         const { key: thumbnailKey, ufsUrl: thumbnailUrl } =
            uploadedThumbnail[0].data;

         const [updatedVideo] = await db
            .update(videos)
            .set({
               thumbnailUrl,
               thumbnailKey,
               updatedAt: new Date(),
            })
            .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
            .returning();

         if (!updatedVideo) throw new TRPCError({ code: "NOT_FOUND" });
         return updatedVideo;
      }),
   revalidate: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
         const { id: userId } = ctx.user;
         const [video] = await db
            .select()
            .from(videos)
            .where(and(eq(videos.id, input.id), eq(videos.userId, userId)));

         if (!video) throw new TRPCError({ code: "NOT_FOUND" });

         if (!video.muxUploadId) throw new TRPCError({ code: "BAD_REQUEST" });

         const upload = await mux.video.uploads.retrieve(video.muxUploadId);
         if (!upload || !upload.asset_id)
            throw new TRPCError({ code: "BAD_REQUEST" });

         const asset = await mux.video.assets.retrieve(upload.asset_id);
         if (!asset) throw new TRPCError({ code: "BAD_REQUEST" });

         const [updatedVideo] = await db
            .update(videos)
            .set({
               muxPlaybackId: asset.playback_ids?.[0].id,
               muxStatus: asset.status,
               muxAssetId: asset.id,
               duration: asset.duration ? Math.round(asset.duration * 1000) : 0,
            })
            .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
            .returning();
         return updatedVideo;
      }),

   //curd
   remove: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
         const { id: userId } = ctx.user;
         if (!input.id) throw new TRPCError({ code: "BAD_REQUEST" });
         const [removedVideo] = await db
            .delete(videos)
            .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
            .returning();
         if (!removedVideo) throw new TRPCError({ code: "NOT_FOUND" });
         return removedVideo;
      }),

   update: protectedProcedure
      .input(videoUpdateSchema)
      .mutation(async ({ ctx, input }) => {
         const { id: userId } = ctx.user;
         if (!input.id) throw new TRPCError({ code: "BAD_REQUEST" });
         const [updatedVideo] = await db
            .update(videos)
            .set({
               title: input.title,
               description: input.description,
               categoryId: input.categoryId,
               visibility: input.visibility,
               updatedAt: new Date(),
            })
            .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
            .returning();

         if (!updatedVideo) throw new TRPCError({ code: "NOT_FOUND" });
         return updatedVideo;
      }),

   create: protectedProcedure.mutation(async ({ ctx }) => {
      const { id: userId } = ctx.user;

      const upload = await mux.video.uploads.create({
         new_asset_settings: {
            passthrough: userId,
            playback_policy: ["public"],
            input: [
               {
                  generated_subtitles: [
                     {
                        language_code: "en",
                        name: "English",
                     },
                  ],
               },
            ],
         },
         cors_origin: "*",
      });
      const video = await db
         .insert(videos)
         .values({
            userId,
            title: "Untitled",
            muxStatus: "waiting",
            muxUploadId: upload.id,
         })
         .returning();

      return { video, url: upload.url };
   }),

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

         const viewerReactions = db.$with("viewer_reactions").as(
            db
               .select({
                  videoId: videoReactions.videoId,
                  type: videoReactions.type,
               })
               .from(videoReactions)
               .where(inArray(videoReactions.userId, userId ? [userId] : []))
         );

         const viewerSubscriptions = db.$with("viewer_subscriptions").as(
            db
               .select()
               .from(subscriptions)
               .where(inArray(subscriptions.viewerId, userId ? [userId] : []))
         );

         const [video] = await db
            .with(viewerReactions, viewerSubscriptions)
            .select({
               ...getTableColumns(videos),
               user: {
                  ...getTableColumns(users),
                  subscriberCount: db.$count(
                     subscriptions,
                     eq(subscriptions.creatorId, users.id)
                  ),
                  viewerSubscribed: isNotNull(
                     viewerSubscriptions.viewerId
                  ).mapWith(Boolean),
               },
               viewCount: db.$count(
                  videoViews,
                  eq(videoViews.videoId, videos.id)
               ),
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
               viewerReaction: viewerReactions.type,
            })
            .from(videos)
            .innerJoin(users, eq(users.id, videos.userId))
            .leftJoin(viewerReactions, eq(videos.id, viewerReactions.videoId))
            .leftJoin(
               viewerSubscriptions,
               eq(users.id, viewerSubscriptions.creatorId)
            )
            .where(eq(videos.id, input.id));

         if (!video) throw new TRPCError({ code: "NOT_FOUND" });
         return video;
      }),

   getMany: baseProcedure
      .input(
         z.object({
            userId: z.string().uuid().nullish(),
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
         const { cursor, limit, categoryId, isTrending, userId } = input;

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
                  userId ? eq(videos.userId, userId) : undefined,
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

   getTrending: baseProcedure
      .input(
         z.object({
            cursor: z
               .object({ viewCount: z.number(), id: z.string().uuid() })
               .nullish(),
            limit: z.number().min(1).max(10).default(5),
         })
      )
      .query(async ({ input }) => {
         const { cursor, limit } = input;

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
                  //categoryId ? eq(videos.categoryId, categoryId) : undefined,
                  eq(videos.visibility, "public"),
                  cursor
                     ? or(
                          lt(viewCountSubquery, cursor.viewCount),
                          and(eq(viewCountSubquery, cursor.viewCount))
                       )
                     : undefined
               )
            )
            .orderBy(desc(viewCountSubquery), desc(videos.id))
            .limit(limit + 1);
         const haseMore = data.length > limit;
         const items = haseMore ? data.slice(0, -1) : data;
         const lastItem = items[items.length - 1];
         const nextCursor = haseMore
            ? { viewCount: lastItem.viewCount, id: lastItem.id }
            : null;
         return { items, nextCursor };
      }),

   getManySubscribed: protectedProcedure
      .input(
         z.object({
            cursor: z
               .object({
                  updatedAt: z.date(),
                  id: z.string().uuid(),
               })
               .nullish(),
            limit: z.number().min(1).max(10).default(5),
         })
      )
      .query(async ({ input, ctx }) => {
         const { cursor, limit } = input;
         const { id: userId } = ctx.user;
         const viewCountSubquery = db.$count(
            videoViews,
            eq(videoViews.videoId, videos.id)
         );

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
            .innerJoin(
               viewerSubscriptions,
               eq(videos.userId, viewerSubscriptions.userId)
            )
            .where(
               and(
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
              }
            : null;
         return { items, nextCursor };
      }),
});
