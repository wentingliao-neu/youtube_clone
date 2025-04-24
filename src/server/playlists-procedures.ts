import db from "@/db";
import {
   playlists,
   playlistVideos,
   users,
   videoReactions,
   videos,
   videoViews,
} from "@/db/schema";
import {
   baseProcedure,
   createTRPCRouter,
   protectedProcedure,
} from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, getTableColumns, lt, or, sql } from "drizzle-orm";
import { z } from "zod";

export const playlistsRouter = createTRPCRouter({
   create: protectedProcedure
      .input(z.object({ name: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
         const { id: userId } = ctx.user;
         const { name } = input;
         const playlistId = crypto.randomUUID();
         const [createdPlaylist] = await db
            .insert(playlists)
            .values({ id: playlistId, name, userId })
            .returning();
         if (!createdPlaylist)
            throw new TRPCError({
               code: "INTERNAL_SERVER_ERROR",
               message: "Failed to create playlist",
            });
         return createdPlaylist;
      }),

   addVideo: protectedProcedure
      .input(
         z.object({ playlistId: z.string().uuid(), videoId: z.string().uuid() })
      )
      .mutation(async ({ input, ctx }) => {
         const { id: userId } = ctx.user;
         const { playlistId, videoId } = input;

         const [playlist] = await db
            .select()
            .from(playlists)
            .where(
               and(eq(playlists.id, playlistId), eq(playlists.userId, userId))
            );

         if (!playlist)
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "Playlist not found",
            });

         const [video] = await db
            .select()
            .from(videos)
            .where(eq(videos.id, videoId));
         if (!video)
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "Video not found",
            });

         const [existingVideo] = await db
            .select()
            .from(playlistVideos)
            .where(
               and(
                  eq(playlistVideos.playlistId, playlistId),
                  eq(playlistVideos.videoId, videoId)
               )
            );
         if (existingVideo)
            throw new TRPCError({
               code: "CONFLICT",
               message: "Video already exists in playlist",
            });

         const [createdPlaylistVideo] = await db
            .insert(playlistVideos)
            .values({ playlistId, videoId })
            .returning();
         if (!createdPlaylistVideo)
            throw new TRPCError({
               code: "INTERNAL_SERVER_ERROR",
               message: "Failed to add video to playlist",
            });
         return createdPlaylistVideo;
      }),

   removeVideo: protectedProcedure
      .input(
         z.object({ playlistId: z.string().uuid(), videoId: z.string().uuid() })
      )
      .mutation(async ({ input, ctx }) => {
         const { id: userId } = ctx.user;
         const { playlistId, videoId } = input;

         const [playlist] = await db
            .select()
            .from(playlists)
            .where(
               and(eq(playlists.id, playlistId), eq(playlists.userId, userId))
            );

         if (!playlist)
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "Playlist not found",
            });

         const [video] = await db
            .select()
            .from(videos)
            .where(eq(videos.id, videoId));
         if (!video)
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "Video not found",
            });

         const [existingVideo] = await db
            .select()
            .from(playlistVideos)
            .where(
               and(
                  eq(playlistVideos.playlistId, playlistId),
                  eq(playlistVideos.videoId, videoId)
               )
            );
         if (!existingVideo)
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "Video not found in playlist",
            });

         const [deletedPlaylistVideo] = await db
            .delete(playlistVideos)
            .where(
               and(
                  eq(playlistVideos.playlistId, playlistId),
                  eq(playlistVideos.videoId, videoId)
               )
            )
            .returning();
         if (!deletedPlaylistVideo)
            throw new TRPCError({
               code: "INTERNAL_SERVER_ERROR",
               message: "Failed to delete video from playlist",
            });
         return deletedPlaylistVideo;
      }),
   getLiked: protectedProcedure
      .input(
         z.object({
            cursor: z
               .object({
                  likedAt: z.date(),
                  id: z.string().uuid(),
               })
               .nullish(),
            limit: z.number().min(1).max(10).default(5),
         })
      )
      .query(async ({ input, ctx }) => {
         const { id: userId } = ctx.user;
         const { cursor, limit } = input;

         const viewerVideoReactions = db.$with("viewer_video_reactions").as(
            db
               .select({
                  videoId: videoReactions.videoId,
                  likedAt: videoReactions.updatedAt,
               })
               .from(videoReactions)
               .where(
                  and(
                     eq(videoReactions.userId, userId),
                     eq(videoReactions.type, "like")
                  )
               )
         );
         const viewCountSubquery = db.$count(
            videoViews,
            eq(videoViews.videoId, videos.id)
         );

         const data = await db
            .with(viewerVideoReactions)
            .select({
               ...getTableColumns(videos),
               viewCount: viewCountSubquery,
               likedAt: viewerVideoReactions.likedAt,
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
               viewerVideoReactions,
               eq(videos.id, viewerVideoReactions.videoId)
            )
            .where(
               and(
                  eq(videos.visibility, "public"),
                  cursor
                     ? or(
                          lt(viewerVideoReactions.likedAt, cursor.likedAt),
                          and(
                             eq(viewerVideoReactions.likedAt, cursor.likedAt),
                             lt(videos.id, cursor.id)
                          )
                       )
                     : undefined
               )
            )
            .orderBy(desc(viewerVideoReactions.likedAt), desc(videos.id))
            .limit(limit + 1);
         const haseMore = data.length > limit;
         const items = haseMore ? data.slice(0, -1) : data;
         const lastItem = items[items.length - 1];
         const nextCursor = haseMore
            ? {
                 likedAt: lastItem.likedAt,
                 id: lastItem.id,
              }
            : null;
         return { items, nextCursor };
      }),

   getHistory: protectedProcedure
      .input(
         z.object({
            cursor: z
               .object({
                  viewedAt: z.date(),
                  id: z.string().uuid(),
               })
               .nullish(),
            limit: z.number().min(1).max(10).default(5),
         })
      )
      .query(async ({ input, ctx }) => {
         const { id: userId } = ctx.user;
         const { cursor, limit } = input;

         const viewerVideoViews = db.$with("viewer_video_views").as(
            db
               .select({
                  videoId: videoViews.videoId,
                  viewedAt: videoViews.updatedAt,
               })
               .from(videoViews)
               .where(eq(videoViews.userId, userId))
         );
         const viewCountSubquery = db.$count(
            videoViews,
            eq(videoViews.videoId, videos.id)
         );

         const data = await db
            .with(viewerVideoViews)
            .select({
               ...getTableColumns(videos),
               viewCount: viewCountSubquery,
               viewedAt: viewerVideoViews.viewedAt,
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
               viewerVideoViews,
               eq(videos.id, viewerVideoViews.videoId)
            )
            .where(
               and(
                  eq(videos.visibility, "public"),
                  cursor
                     ? or(
                          lt(viewerVideoViews.viewedAt, cursor.viewedAt),
                          and(
                             eq(viewerVideoViews.viewedAt, cursor.viewedAt),
                             lt(videos.id, cursor.id)
                          )
                       )
                     : undefined
               )
            )
            .orderBy(desc(viewerVideoViews.viewedAt), desc(videos.id))
            .limit(limit + 1);
         const haseMore = data.length > limit;
         const items = haseMore ? data.slice(0, -1) : data;
         const lastItem = items[items.length - 1];
         const nextCursor = haseMore
            ? {
                 viewedAt: lastItem.viewedAt,
                 id: lastItem.id,
              }
            : null;
         return { items, nextCursor };
      }),

   getVideos: baseProcedure
      .input(
         z.object({
            playlistId: z.string().uuid(),
            cursor: z
               .object({
                  updatedAt: z.date(),
                  id: z.string().uuid(),
               })
               .nullish(),
            limit: z.number().min(1).max(10).default(5),
         })
      )
      .query(async ({ input }) => {
         //const { id: userId } = ctx.user;
         const { cursor, limit, playlistId } = input;

         const videosFromPlaylist = db.$with("playlist_videos").as(
            db
               .select({
                  videoId: playlistVideos.videoId,
               })
               .from(playlistVideos)
               .where(eq(playlistVideos.playlistId, playlistId))
         );
         const viewCountSubquery = db.$count(
            videoViews,
            eq(videoViews.videoId, videos.id)
         );

         const data = await db
            .with(videosFromPlaylist)
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
               videosFromPlaylist,
               eq(videos.id, videosFromPlaylist.videoId)
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
            .orderBy(desc(videos.updatedAt), desc(videos.id))
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

   getOne: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
         const { id: userId } = ctx.user;
         const { id: playlistId } = input;
         const [existingPlaylist] = await db
            .select()
            .from(playlists)
            .where(
               and(eq(playlists.id, playlistId), eq(playlists.userId, userId))
            );
         if (!existingPlaylist)
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "Playlist not found",
            });
         return existingPlaylist;
      }),

   remove: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
         const { id: userId } = ctx.user;
         const { id: playlistId } = input;

         const [deletedPlaylist] = await db
            .delete(playlists)
            .where(
               and(eq(playlists.id, playlistId), eq(playlists.userId, userId))
            )
            .returning();

         if (!deletedPlaylist)
            throw new TRPCError({
               code: "INTERNAL_SERVER_ERROR",
               message: "Failed to delete playlist",
            });
         return deletedPlaylist;
      }),

   getMany: protectedProcedure
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
         const { id: userId } = ctx.user;
         const { cursor, limit } = input;

         const data = await db
            .select({
               ...getTableColumns(playlists),
               videoCount: db.$count(
                  playlistVideos,
                  eq(playlistVideos.playlistId, playlists.id)
               ),
               user: users,
               thumbnailUrl: sql<
                  string | null
               >`(select v.thumbnail_url from ${playlistVideos} pv join ${videos} v on v.id = pv.video_id where pv.playlist_id=${playlists.id} order by pv.updated_at desc limit 1)`,
            })
            .from(playlists)
            .innerJoin(users, eq(users.id, playlists.userId))
            .where(
               and(
                  eq(playlists.userId, userId),
                  cursor
                     ? or(
                          lt(playlists.updatedAt, cursor.updatedAt),
                          and(
                             eq(playlists.updatedAt, cursor.updatedAt),
                             lt(playlists.id, cursor.id)
                          )
                       )
                     : undefined
               )
            )
            .orderBy(desc(playlists.updatedAt), desc(playlists.id))
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

   getManyVideo: protectedProcedure
      .input(
         z.object({
            videoId: z.string().uuid(),
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
         const { id: userId } = ctx.user;
         const { cursor, limit, videoId } = input;

         const data = await db
            .select({
               ...getTableColumns(playlists),
               videoCount: db.$count(
                  playlistVideos,
                  eq(playlistVideos.playlistId, playlists.id)
               ),
               user: users,
               containsVideo: videoId
                  ? sql<boolean>`(select exists(select 1 from ${playlistVideos} pv where pv.playlist_id=${playlists.id} and pv.video_id=${videoId}))`
                  : sql<boolean>`false`,
            })
            .from(playlists)
            .innerJoin(users, eq(users.id, playlists.userId))
            .where(
               and(
                  eq(playlists.userId, userId),
                  cursor
                     ? or(
                          lt(playlists.updatedAt, cursor.updatedAt),
                          and(
                             eq(playlists.updatedAt, cursor.updatedAt),
                             lt(playlists.id, cursor.id)
                          )
                       )
                     : undefined
               )
            )
            .orderBy(desc(playlists.updatedAt), desc(playlists.id))
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
