import { z } from "zod";
import {
   baseProcedure,
   createTRPCRouter,
   protectedProcedure,
} from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import {
   blocks,
   streams,
   streamVisibility,
   subscriptions,
   users,
} from "@/db/schema";
import db from "@/db";

import {
   eq,
   getTableColumns,
   and,
   desc,
   lt,
   or,
   inArray,
   isNotNull,
} from "drizzle-orm";
import { mux } from "@/lib/mux";
import { streamClient } from "@/lib/stream";

export const streamsRouter = createTRPCRouter({
   create: protectedProcedure
      .input(
         z.object({
            name: z.string().min(1).max(255),
            description: z.string().optional(),
         })
      )
      .mutation(async ({ ctx, input }) => {
         const { id: userId, clerkId } = ctx.user;
         const { name, description } = input;

         const muxStream = await mux.video.liveStreams.create({
            playback_policy: ["signed"], //set policy as signed by default and control accessment by token
            new_asset_settings: {},
         });

         if (!muxStream.playback_ids?.[0]?.id) {
            throw new TRPCError({
               code: "INTERNAL_SERVER_ERROR",
               message: "Failed to create stream",
            });
         }

         const [newStream] = await db
            .insert(streams)
            .values({
               muxStreamId: muxStream.id,
               srtPassphrase: muxStream.srt_passphrase || "",
               userId,
               name,
               description,
               streamKey: muxStream.stream_key,
               visibility: "public",
               playbackId: muxStream.playback_ids[0].id,
            })
            .returning();

         const channel = streamClient.channel("messaging", newStream.id, {
            created_by_id: clerkId,
         });
         await channel.create();

         return newStream;
      }),

   getMany: baseProcedure
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
         const { clerkUserId } = ctx;
         let userId;
         const [user] = await db
            .select()
            .from(users)
            .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []));
         if (user) userId = user.id;

         const viewerSubscriptions = db.$with("viewer_subscriptions").as(
            db
               .select({ creatorId: subscriptions.creatorId })
               .from(subscriptions)
               .where(inArray(subscriptions.viewerId, userId ? [userId] : []))
         );
         const data = await db
            .with(viewerSubscriptions)
            .select({
               ...getTableColumns(streams),
               viewerSubscribed: isNotNull(
                  viewerSubscriptions.creatorId
               ).mapWith(Boolean),
               user: users,
            })
            .from(streams)
            .innerJoin(users, eq(streams.userId, users.id))
            .leftJoin(
               viewerSubscriptions,
               eq(streams.userId, viewerSubscriptions.creatorId)
            )
            .where(
               cursor
                  ? or(
                       lt(streams.updatedAt, cursor.updatedAt),
                       and(
                          eq(streams.updatedAt, cursor.updatedAt),
                          lt(streams.id, cursor.id)
                       )
                    )
                  : undefined
            )
            .orderBy(
               desc(streams.isLive),
               desc(streams.updatedAt),
               desc(streams.id)
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

         const watchers: Map<string, number> = new Map();
         try {
            const filter = {
               type: "messaging",
               frozen: false,
               id: { $in: items.map((item) => item.id) },
            };
            const sort = [{ updated_at: -1 }];
            const channels = await streamClient.queryChannels(filter, sort, {
               state: true,
            });
            channels.forEach((channel) => {
               if (channel.id)
                  watchers.set(channel.id, channel.state.watcher_count || 0);
            });
         } catch (error) {
            console.error("error getting watchers", (error as Error).message);
         }

         return { items, nextCursor, watchers };
      }),

   getOneByUserId: baseProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
         const { clerkUserId } = ctx;
         const { id } = input;

         let userId;
         const [user] = await db
            .select()
            .from(users)
            .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []));
         if (user) userId = user.id;

         const viewerBlocked = db.$with("viewer_blocked").as(
            db
               .select()
               .from(blocks)
               .where(inArray(blocks.blockedId, userId ? [userId] : []))
         );
         const viewerSubscriptions = db.$with("viewer_subscriptions").as(
            db
               .select()
               .from(subscriptions)
               .where(inArray(subscriptions.viewerId, userId ? [userId] : []))
         );

         const isViewerHost = db.$with("is_viewer_host").as(
            db
               .select()
               .from(streams)
               .where(inArray(streams.userId, userId ? [userId] : []))
         );

         const [stream] = await db
            .with(viewerSubscriptions, viewerBlocked, isViewerHost)
            .select({
               ...getTableColumns(streams),
               user: users,
               isHost: isNotNull(isViewerHost.userId).mapWith(Boolean),

               viewerSubscribed: isNotNull(
                  viewerSubscriptions.creatorId
               ).mapWith(Boolean),
               viewerBlocked: isNotNull(viewerBlocked.blockedId).mapWith(
                  Boolean
               ),
            })
            .from(streams)
            .innerJoin(users, eq(streams.userId, users.id))
            .leftJoin(
               viewerSubscriptions,
               eq(streams.userId, viewerSubscriptions.creatorId)
            )
            .leftJoin(
               viewerBlocked,
               eq(streams.userId, viewerBlocked.blockerId)
            )
            .leftJoin(isViewerHost, eq(streams.userId, isViewerHost.userId))
            .where(eq(streams.userId, id))
            .limit(1);

         if (!stream)
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "Stream not found",
            });

         if (
            (stream.visibility === "subscribers" &&
               !stream.viewerSubscribed &&
               !stream.isHost) ||
            stream.viewerBlocked
         )
            throw new TRPCError({
               code: "UNAUTHORIZED",
               message: "You are not authorized to watch this stream",
            });

         const channel = streamClient.channel("messaging", stream.id);

         if (clerkUserId) await channel.addMembers([clerkUserId]);

         return stream;
      }),

   update: protectedProcedure
      .input(
         z.object({
            id: z.string().uuid(),
            data: z.object({
               title: z.string(),
               description: z.string(),
               visibility: z.enum(streamVisibility.enumValues),
            }),
         })
      )
      .mutation(async ({ ctx, input }) => {
         const { id, data } = input;
         const { id: userId } = ctx.user;
         const [stream] = await db
            .update(streams)
            .set(data)
            .where(and(eq(streams.id, id), eq(streams.userId, userId)))
            .returning();

         return stream;
      }),

   toggleMute: protectedProcedure
      .input(z.object({ id: z.string(), channelId: z.string() }))
      .mutation(async ({ ctx, input }) => {
         const { id, channelId } = input;
         const { user } = ctx;
         const channel = streamClient.channel("messaging", channelId);
         const { bans } = await streamClient.queryBannedUsers({
            channel_cid: channel.cid,
            banned_by_id: user.clerkId,
            user_id: id,
         });
         console.log("bannedUsers", bans);

         if (bans && bans.length > 0) {
            await channel.unbanUser(id);
         } else {
            await channel.banUser(id, {
               reason: "muted by streamer",
               banned_by_id: user.clerkId,
            });
         }
      }),

   getStreamToken: baseProcedure.mutation(async ({ ctx }) => {
      const { clerkUserId } = ctx;
      let chatToken = "";
      try {
         chatToken = streamClient.createToken(
            clerkUserId || "guest",
            Math.floor(Date.now() / 1000) + 60 * 60 * 12
         );
      } catch (error) {
         console.error("error upserting user", (error as Error).message);
      }
      return { token: chatToken };
   }),

   generateToken: protectedProcedure
      .input(
         z.object({
            id: z.string().uuid().nullable(),
         })
      )
      .mutation(async ({ ctx, input }) => {
         const { id } = input;
         const { user: self } = ctx;

         let token = "";

         if (!id) {
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "Stream not found",
            });
         }
         const [result] = await db
            .select({
               streamId: streams.id,
               playbackId: streams.playbackId,
               userId: streams.userId,
               visibility: streams.visibility,

               isUserFanOfStreamer: isNotNull(subscriptions.viewerId).mapWith(
                  Boolean
               ),
               isUserBlockedByStreamer: isNotNull(blocks.blockedId).mapWith(
                  Boolean
               ),
            })
            .from(streams)
            .leftJoin(
               subscriptions,
               and(
                  eq(subscriptions.viewerId, self.id),
                  eq(subscriptions.creatorId, streams.userId)
               )
            )
            .leftJoin(
               blocks,
               and(
                  eq(blocks.blockedId, self.id),
                  eq(blocks.blockerId, streams.userId)
               )
            )
            .where(eq(streams.id, id))
            .limit(1);

         if (
            result.isUserBlockedByStreamer ||
            (!result.isUserFanOfStreamer && result.visibility === "subscribers")
         )
            throw new TRPCError({
               code: "UNAUTHORIZED",
               message: "You are not authorized to watch this stream",
            });

         token = await mux.jwt.signPlaybackId(result.playbackId, {
            keyId: process.env.MUX_SIGNING_KEY_ID,
            keySecret: process.env.MUX_SIGNING_SECRET,
            expiration: "12h",
         });

         return { token };
      }),

   remove: protectedProcedure.mutation(async ({ ctx }) => {
      const { id: userId } = ctx.user;

      const [stream] = await db
         .delete(streams)
         .where(eq(streams.userId, userId))
         .returning();

      try {
         if (!stream.muxStreamId) {
            throw new TRPCError({
               code: "INTERNAL_SERVER_ERROR",
               message: "Mux stream id not found",
            });
         }
         await mux.video.liveStreams.delete(stream.muxStreamId);
         const channel = streamClient.channel("messaging", stream.id);
         await channel.delete();
      } catch (error) {
         console.error(error);
      }
      return stream;
   }),
});
