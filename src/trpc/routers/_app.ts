import { studioRouter } from "@/server/studio-procedures";
import { createTRPCRouter } from "../init";
import { categoriesRouter } from "@/server/categories-procedures";
import { videosRouter } from "@/server/videos-procedures";
import { videoViewsRouter } from "@/server/video-views-procedures";
import { videoReactionsRouter } from "@/server/video-reactions-procedures";
import { subscriptionsRouter } from "@/server/subscriptions-procedures";
import { commentsRouter } from "@/server/comments-procedures";
import { commentReactionsRouter } from "@/server/comment-reactions-procedures";
import { suggestionsRouter } from "@/server/suggestions-procedures";
import { searchRouter } from "@/server/search-procedures";
import { playlistsRouter } from "@/server/playlists-procedures";
import { usersRouter } from "@/server/users-procedures";

export const appRouter = createTRPCRouter({
   categories: categoriesRouter,
   studio: studioRouter,
   videos: videosRouter,
   videoViews: videoViewsRouter,
   videoReactions: videoReactionsRouter,
   subscriptions: subscriptionsRouter,
   comments: commentsRouter,
   commentReactions: commentReactionsRouter,
   suggestions: suggestionsRouter,
   search: searchRouter,
   playlists: playlistsRouter,
   users: usersRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
