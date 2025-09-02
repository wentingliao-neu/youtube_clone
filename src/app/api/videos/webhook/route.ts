import db from "@/db";
import { streams, users, videos } from "@/db/schema";
import { mux } from "@/lib/mux";
import { pusher } from "@/lib/pusher";
import { streamClient } from "@/lib/stream";
import {
   VideoAssetCreatedWebhookEvent,
   VideoAssetErroredWebhookEvent,
   VideoAssetReadyWebhookEvent,
   VideoAssetTrackReadyWebhookEvent,
   VideoAssetDeletedWebhookEvent,
   VideoLiveStreamActiveWebhookEvent,
   VideoLiveStreamIdleWebhookEvent,
   VideoLiveStreamConnectedWebhookEvent,
   VideoAssetLiveStreamCompletedWebhookEvent,
   VideoLiveStreamDisconnectedWebhookEvent,
} from "@mux/mux-node/resources/webhooks.mjs";
import { eq, getTableColumns } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

const SIGNING_SECRET = process.env.MUX_WEBHOOK_SECRET;

type WebhookEvent =
   | VideoAssetCreatedWebhookEvent
   | VideoAssetReadyWebhookEvent
   | VideoAssetErroredWebhookEvent
   | VideoAssetTrackReadyWebhookEvent
   | VideoAssetDeletedWebhookEvent
   | VideoLiveStreamConnectedWebhookEvent
   | VideoLiveStreamActiveWebhookEvent
   | VideoLiveStreamIdleWebhookEvent
   | VideoAssetLiveStreamCompletedWebhookEvent
   | VideoLiveStreamDisconnectedWebhookEvent;
export const POST = async (req: Request) => {
   if (!SIGNING_SECRET)
      return NextResponse.json(
         { message: "No signing secret" },
         { status: 500 }
      );

   const headersPayload = await headers();

   const muxSignature = headersPayload.get("mux-signature");
   if (!muxSignature)
      return NextResponse.json(
         { message: "No mux-signature header" },
         { status: 401 }
      );

   const payload = await req.json();
   const body = JSON.stringify(payload);
   mux.webhooks.verifySignature(
      body,
      { "mux-signature": muxSignature },
      SIGNING_SECRET
   );

   console.log("Received webhook", payload.type);
   switch (payload.type as WebhookEvent["type"]) {
      case "video.asset.created": {
         const data = payload.data as VideoAssetCreatedWebhookEvent["data"];
         if (!data.upload_id)
            return NextResponse.json(
               { message: "No upload_id in payload" },
               { status: 400 }
            );

         console.log("creating video asset", data.upload_id);
         await db
            .update(videos)
            .set({
               muxAssetId: data.id,
               muxStatus: data.status,
            })
            .where(eq(videos.muxUploadId, data.upload_id));
         break;
      }
      case "video.asset.ready": {
         const data = payload.data as VideoAssetReadyWebhookEvent["data"];
         const playbackId = data.playback_ids?.[0].id;
         if (!playbackId)
            return NextResponse.json(
               { message: "No playback id in payload" },
               { status: 400 }
            );
         if (!data.upload_id)
            return NextResponse.json(
               { message: "No upload_id in payload" },
               { status: 400 }
            );

         const tempThumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;
         const tempPreviewUrl = `https://image.mux.com/${playbackId}/animated.gif`;
         const duration = data.duration ? Math.round(data.duration * 1000) : 0;

         //把thumbnailUrl和previewUrl上传到uploadthing，但是没必要
         const utapi = new UTApi();
         const [thumbnailUrlData, previewUrlData] =
            await utapi.uploadFilesFromUrl([tempThumbnailUrl, tempPreviewUrl]);
         if (!thumbnailUrlData.data || !previewUrlData.data) {
            return NextResponse.json(
               { message: "Thumbnail URL data is null" },
               { status: 400 }
            );
         }
         const { key: thumbnailKey, ufsUrl: thumbnailUrl } =
            thumbnailUrlData.data;
         const { key: previewKey, ufsUrl: previewUrl } = previewUrlData.data;

         await db
            .update(videos)
            .set({
               muxStatus: data.status,
               muxPlaybackId: playbackId,
               muxAssetId: data.id,
               thumbnailUrl,
               previewUrl,
               duration,
               thumbnailKey,
               previewKey,
            })
            .where(eq(videos.muxUploadId, data.upload_id));
         break;
      }

      case "video.asset.errored": {
         const data = payload.data as VideoAssetErroredWebhookEvent["data"];
         if (!data.upload_id)
            return NextResponse.json(
               { message: "No upload_id in payload" },
               { status: 400 }
            );
         await db
            .update(videos)
            .set({
               muxStatus: data.status,
            })
            .where(eq(videos.muxUploadId, data.upload_id));
         break;
      }

      case "video.asset.deleted": {
         const data = payload.data as VideoAssetDeletedWebhookEvent["data"];
         if (!data.upload_id)
            return NextResponse.json(
               { message: "No asset id in payload" },
               { status: 400 }
            );
         console.log("deleting video asset", data.upload_id);
         await db.delete(videos).where(eq(videos.muxUploadId, data.upload_id));
         break;
      }

      case "video.asset.track.ready": {
         const data =
            payload.data as VideoAssetTrackReadyWebhookEvent["data"] & {
               asset_id: string;
            };
         const assetId = data.asset_id;
         const trackId = data.id;
         const status = data.status;
         if (!assetId)
            return NextResponse.json(
               { message: "No asset_id in payload" },
               { status: 400 }
            );

         await db
            .update(videos)
            .set({
               muxTrackId: trackId,
               muxTrackStatus: status,
            })
            .where(eq(videos.muxAssetId, assetId));
         break;
      }

      case "video.live_stream.active": {
         const data = payload.data as VideoLiveStreamActiveWebhookEvent["data"];
         if (!data.stream_key)
            return NextResponse.json(
               { message: "No stream_key in payload" },
               { status: 400 }
            );

         const [stream] = await db
            .select({
               ...getTableColumns(streams),
               userClerkId: users.clerkId,
               userName: users.name,
               userImage: users.imageUrl,
            })
            .from(streams)
            .innerJoin(users, eq(streams.userId, users.id))
            .where(eq(streams.streamKey, data.stream_key))
            .limit(1);

         if (!stream)
            return NextResponse.json(
               { message: "Stream not found" },
               { status: 404 }
            );

         const token =
            stream.visibility === "public"
               ? await mux.jwt.signPlaybackId(stream.playbackId, {
                    keyId: process.env.MUX_SIGNING_KEY_ID,
                    keySecret: process.env.MUX_SIGNING_SECRET,
                    expiration: "12h",
                 })
               : "";
         await db
            .update(streams)
            .set({
               isLive: true,
               publicToken: token,
            })
            .where(eq(streams.streamKey, data.stream_key));
         const channel = streamClient.channel("messaging", stream.id);
         try {
            await channel.truncate({ hard_delete: true });
            const members = Object.keys(channel.state.members);
            if (members.length > 0) await channel.removeMembers(members);
            await channel.update({ frozen: false });
         } catch {
            console.error("error in update channel");
         }

         try {
            await pusher.trigger(`stream-${stream.id}`, "statusChanged", {
               isLive: true,
            });
            console.log("triggered pusher", `stream-${stream.id}`);
         } catch (error) {
            console.error("error in trigger pusher", error);
         }

         break;
      }

      case "video.live_stream.disconnected": {
         const data =
            payload.data as VideoLiveStreamDisconnectedWebhookEvent["data"];
         if (!data.stream_key)
            return NextResponse.json(
               { message: "No stream_key in payload" },
               { status: 400 }
            );
         const [stream] = await db
            .update(streams)
            .set({
               isLive: false,
               publicToken: "",
            })
            .where(eq(streams.streamKey, data.stream_key))
            .returning();
         if (!stream)
            return NextResponse.json(
               { message: "Stream not found" },
               { status: 404 }
            );
         try {
            const channel = streamClient.channel("messaging", stream.id);
            await channel.update({ frozen: true });
         } catch (error) {
            console.error(error);
         }
         await pusher.trigger(`stream-${stream.id}`, "statusChanged", {
            isLive: false,
         });
         break;
      }

      case "video.asset.live_stream_completed": {
         const data =
            payload.data as VideoAssetLiveStreamCompletedWebhookEvent["data"];
         if (!data.id || !data.live_stream_id)
            return NextResponse.json(
               { message: "No id in payload" },
               { status: 400 }
            );
         try {
            const auth = Buffer.from(
               `${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`
            ).toString("base64");
            await fetch(`https://api.mux.com/video/v1/assets/${data.id}`, {
               method: "DELETE",
               headers: {
                  "Content-Type": "application/json",
                  Authorization: `Basic ${auth}`,
               },
            });
         } catch (error) {
            console.error("failed to delete stream video asset in mux", error);
         }
         break;
      }
   }

   return NextResponse.json({ message: "Webhook received" }, { status: 200 });
};
