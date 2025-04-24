//import { relations } from "drizzle-orm";
import {
   foreignKey,
   integer,
   pgEnum,
   pgTable,
   primaryKey,
   text,
   timestamp,
   uniqueIndex,
   uuid,
} from "drizzle-orm/pg-core";
import {
   createInsertSchema,
   createSelectSchema,
   createUpdateSchema,
} from "drizzle-zod";
//import { relations } from "drizzle-orm";

export const videoVisibility = pgEnum("video_visibility", [
   "public",
   "private",
]);

export const users = pgTable(
   "users",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      clerkId: text("clerk_id").unique().notNull(),
      name: text("name").notNull(),
      imageUrl: text("image_url").notNull(),
      bannerUrl: text("banner_url"),
      bannerKey: text("banner_key"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow(),
   },
   (t) => [uniqueIndex("clerk_id_idx").on(t.clerkId)]
);

export const categories = pgTable(
   "categories",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      name: text("name").notNull().unique(),
      description: text("description"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow(),
   },
   (t) => [uniqueIndex("name_idx").on(t.name)]
);

export const videos = pgTable("videos", {
   id: uuid("id").primaryKey().defaultRandom(),
   title: text("title").notNull(),
   description: text("description"),
   muxStatus: text("mux_status"),
   muxAssetId: text("mux_asset_id").unique(),
   muxUploadId: text("mux_upload_id").unique(),
   muxPlaybackId: text("mux_playback_id").unique(),
   muxTrackId: text("mux_track_id").unique(),
   muxTrackStatus: text("mux_track_status"),
   thumbnailUrl: text("thumbnail_url"),
   thumbnailKey: text("thumbnail_key"),
   previewUrl: text("preview_url"),
   previewKey: text("preview_key"),
   duration: integer("duration").default(0).notNull(),
   visibility: videoVisibility("visibility").notNull().default("private"),
   userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
   categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
   }),

   createdAt: timestamp("created_at").notNull().defaultNow(),
   updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const videoInsertSchema = createInsertSchema(videos);
export const videoUpdateSchema = createUpdateSchema(videos);
export const videoSelectSchema = createSelectSchema(videos);

export const comments = pgTable(
   "comments",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      videoId: uuid("video_id")
         .notNull()
         .references(() => videos.id, { onDelete: "cascade" }),
      userId: uuid("user_id")
         .notNull()
         .references(() => users.id, { onDelete: "cascade" }),
      parentId: uuid("parent_id"),
      value: text("value").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow(),
   },
   (t) => [
      foreignKey({
         columns: [t.parentId],
         foreignColumns: [t.id],
         name: "comments_parent_id_fkey",
      }).onDelete("cascade"),
   ]
);

export const commentInsertSchema = createInsertSchema(comments);
export const commentUpdateSchema = createUpdateSchema(comments);
export const commentSelectSchema = createSelectSchema(comments);

export const videoViews = pgTable(
   "video_views",
   {
      userId: uuid("user_id")
         .notNull()
         .references(() => users.id, { onDelete: "cascade" }),
      videoId: uuid("video_id")
         .notNull()
         .references(() => videos.id, { onDelete: "cascade" }),

      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow(),
   },
   (t) => [
      primaryKey({
         name: "video_views_pk",
         columns: [t.userId, t.videoId],
      }),
   ]
);

export const videoViewInsertSchema = createInsertSchema(videoViews);
export const videoViewUpdateSchema = createUpdateSchema(videoViews);
export const videoViewSelectSchema = createSelectSchema(videoViews);

export const reactionType = pgEnum("reaction_type", ["like", "dislike"]);
export const videoReactions = pgTable(
   "video_reactions",
   {
      userId: uuid("user_id")
         .notNull()
         .references(() => users.id, { onDelete: "cascade" }),
      videoId: uuid("video_id")
         .notNull()
         .references(() => videos.id, { onDelete: "cascade" }),
      type: reactionType("type").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow(),
   },
   (t) => [
      primaryKey({
         name: "video_reactions_pk",
         columns: [t.userId, t.videoId],
      }),
   ]
);

export const videoReactionInsertSchema = createInsertSchema(videoReactions);
export const videoReactionUpdateSchema = createUpdateSchema(videoReactions);
export const videoReactionSelectSchema = createSelectSchema(videoReactions);

export const subscriptions = pgTable(
   "subscriptions",
   {
      viewerId: uuid("viewer_id")
         .notNull()
         .references(() => users.id, { onDelete: "cascade" }),
      creatorId: uuid("creator_id")
         .notNull()
         .references(() => users.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow(),
   },
   (t) => [
      primaryKey({
         name: "subscriptions_pk",
         columns: [t.viewerId, t.creatorId],
      }),
   ]
);

export const commentReactions = pgTable(
   "comment_reactions",
   {
      userId: uuid("user_id")
         .notNull()
         .references(() => users.id, { onDelete: "cascade" }),
      commentId: uuid("comment_id")
         .notNull()
         .references(() => comments.id, { onDelete: "cascade" }),
      type: reactionType("type").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow(),
   },
   (t) => [
      primaryKey({
         name: "comment_reactions_pk",
         columns: [t.userId, t.commentId],
      }),
   ]
);

export const playlists = pgTable("playlists", {
   id: uuid("id").primaryKey().defaultRandom(),
   name: text("name").notNull(),
   description: text("description"),
   userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
   createdAt: timestamp("created_at").notNull().defaultNow(),
   updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const playlistVideos = pgTable(
   "playlist_videos",
   {
      playlistId: uuid("playlist_id")
         .notNull()
         .references(() => playlists.id, { onDelete: "cascade" }),
      videoId: uuid("video_id")
         .notNull()
         .references(() => videos.id, { onDelete: "cascade" }),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow(),
   },
   (t) => [
      primaryKey({
         name: "playlist_videos_pk",
         columns: [t.playlistId, t.videoId],
      }),
   ]
);

// non relation database

// export const videoRelations = relations(videos, ({ one ,many}) => ({
//    user: one(users, {
//       fields: [videos.userId],
//       references: [users.id],
//    }),
//    category: one(categories, {
//       fields: [videos.categoryId],
//       references: [categories.id],
//    }),
//    views: many(videoViews)
//    reactions: many(videoReactions),
// }));

//export const userRelations =relations(users,( {many} ) => ({
//    videos: many(videos),
//    videoViews: many(videoViews),
//    videoReactions: many(videoReactions),
// }));

// export const videoViewRelations = relations(videoViews, ({ one }) => ({
//    users: one(users, {
//       fields: [videoViews.userId],
//       references: [users.id],
//    }),
//    videos: one(videos, {
//       fields: [videoViews.videoId],
//       references: [videos.id],
//    }),
// }));

// export const videoReactionRelations = relations(videoReactions, ({ one }) => ({
//    users: one(users, {
//       fields: [videoReactions.userId],
//       references: [users.id],
//    }),
//    videos: one(videos, {
//       fields: [videoReactions.videoId],
//       references: [videos.id],
//    }),
// }));
