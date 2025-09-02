import { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "@/trpc/routers/_app";
export type VideoGetOneOutput =
   inferRouterOutputs<AppRouter>["videos"]["getOne"];

export type VideoGetManyOutput =
   inferRouterOutputs<AppRouter>["suggestions"]["getMany"]["items"];

export type CommentsGetManyOutput =
   inferRouterOutputs<AppRouter>["comments"]["getMany"]["items"];

export type PlaylistsGetManyOutput =
   inferRouterOutputs<AppRouter>["playlists"]["getMany"]["items"];

export type UserGetOneOutput = inferRouterOutputs<AppRouter>["users"]["getOne"];

export type StreamGetManyOutput =
   inferRouterOutputs<AppRouter>["streams"]["getMany"]["items"];

export type StreamGetOneOutput =
   inferRouterOutputs<AppRouter>["streams"]["getOneByUserId"];
