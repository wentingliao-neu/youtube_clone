import db from "@/db";
import { blocks, users } from "@/db/schema";
import { streamClient } from "@/lib/stream";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, getTableColumns, lt, or } from "drizzle-orm";
import { z } from "zod";

export const blocksRouter = createTRPCRouter({
   // 检查当前用户是否被某个用户屏蔽
   isBlockedByUser: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
         const { id } = input;
         const { user: self } = ctx;

         // 检查目标用户是否存在
         const [otherUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, id));

         if (!otherUser) {
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "User not found",
            });
         }

         // 如果是同一个用户，返回 false
         if (otherUser.id === self.id) return false;

         // 检查是否被该用户屏蔽
         const [existingBlock] = await db
            .select()
            .from(blocks)
            .where(
               and(
                  eq(blocks.blockerId, otherUser.id),
                  eq(blocks.blockedId, self.id)
               )
            );

         return !!existingBlock;
      }),

   // 获取当前用户屏蔽的所有用户
   getMany: protectedProcedure
      .input(
         z.object({
            cursor: z
               .object({
                  updatedAt: z.date(),
                  blockedId: z.string().uuid(),
               })
               .nullish(),
            limit: z.number().min(1).max(10).default(5),
         })
      )
      .query(async ({ ctx, input }) => {
         const { cursor, limit } = input;
         const { id: userId } = ctx.user;

         const blockedUsers = await db
            .select({
               ...getTableColumns(blocks),
               blocked: {
                  ...getTableColumns(users),
               },
            })
            .from(blocks)
            .innerJoin(users, eq(users.id, blocks.blockedId))
            .where(
               and(
                  eq(blocks.blockerId, userId),
                  cursor
                     ? or(
                          lt(blocks.updatedAt, cursor.updatedAt),
                          and(
                             eq(blocks.updatedAt, cursor.updatedAt),
                             lt(blocks.blockedId, cursor.blockedId)
                          )
                       )
                     : undefined
               )
            )
            .orderBy(desc(blocks.updatedAt), desc(blocks.blockedId))
            .limit(limit + 1);

         const haseMore = blockedUsers.length > limit;
         const items = haseMore ? blockedUsers.slice(0, -1) : blockedUsers;
         const lastItem = items[items.length - 1];
         const nextCursor = haseMore
            ? { updatedAt: lastItem.updatedAt, blockedId: lastItem.blockedId }
            : null;
         return { items, nextCursor };
      }),

   // 屏蔽用户
   create: protectedProcedure
      .input(
         z.object({
            id: z.string().uuid().optional(),
            clerkId: z.string().optional(),
         })
      )
      .mutation(async ({ ctx, input }) => {
         const { id, clerkId } = input;
         const { user: self } = ctx;

         // 不能屏蔽自己
         if (self.id === id || self.clerkId === clerkId) {
            throw new TRPCError({
               code: "BAD_REQUEST",
               message: "Cannot block yourself",
            });
         }

         // 检查目标用户是否存在
         const [otherUser] = await db
            .select({
               ...getTableColumns(users),
               blocks: blocks,
            })
            .from(users)
            .leftJoin(
               blocks,
               // 3. JOIN 的条件，这是关键
               and(
                  // 条件a: blocks表的被屏蔽者ID === users表的用户ID
                  eq(blocks.blockedId, users.id),
                  // 条件b: 并且 blocks表的屏蔽者ID === 当前操作者的ID
                  eq(blocks.blockerId, self.id)
               )
            )
            .where(
               or(
                  id ? eq(users.id, id) : undefined,
                  clerkId ? eq(users.clerkId, clerkId) : undefined
               )
            );

         if (!otherUser) {
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "User not found",
            });
         }

         // 检查是否已经屏蔽

         if (otherUser.blocks) {
            throw new TRPCError({
               code: "CONFLICT",
               message: "Already blocked this user",
            });
         }

         // 创建屏蔽记录
         await db
            .insert(blocks)
            .values({
               blockerId: self.id,
               blockedId: otherUser.id,
            })
            .returning();
         try {
            const [channel] = await streamClient.queryChannels({
               created_by_id: self.clerkId,
            });
            await channel.banUser(otherUser.clerkId, {
               reason: "blocked by streamer",
               banned_by_id: self.clerkId,
            });
            await channel.removeMembers([otherUser.clerkId]);
         } catch (error) {
            console.error(
               "error banning user in stream channel",
               (error as Error).message
            );
         }

         // 返回简化的屏蔽记录信息
         return {
            id: otherUser.id,
            clerkId: otherUser.clerkId,
            name: otherUser.name,
         };
      }),

   // 取消屏蔽用户
   delete: protectedProcedure
      .input(
         z.object({
            id: z.string().uuid().optional(),
            clerkId: z.string().optional(),
         })
      )
      .mutation(async ({ ctx, input }) => {
         const { id, clerkId } = input;
         const { user: self } = ctx;

         // 不能取消屏蔽自己
         if (self.id === id || self.clerkId === clerkId) {
            throw new TRPCError({
               code: "BAD_REQUEST",
               message: "Cannot unblock yourself",
            });
         }

         // 检查目标用户是否存在
         const [otherUser] = await db
            .select({ ...getTableColumns(users), blocks: blocks })
            .from(users)
            .leftJoin(
               blocks,
               and(
                  eq(blocks.blockedId, users.id),
                  eq(blocks.blockerId, self.id)
               )
            )
            .where(
               or(
                  id ? eq(users.id, id) : undefined,
                  clerkId ? eq(users.clerkId, clerkId) : undefined
               )
            );

         if (!otherUser?.blocks) {
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "User is not blocked by you",
            });
         }

         // 删除屏蔽记录
         await db
            .delete(blocks)
            .where(
               and(
                  eq(blocks.blockerId, self.id),
                  eq(blocks.blockedId, otherUser.id)
               )
            );

         try {
            const [channel] = await streamClient.queryChannels({
               created_by_id: self.clerkId,
            });
            await channel.unbanUser(otherUser.clerkId);
         } catch (error) {
            console.error(
               "error unbanning user in stream channel",
               (error as Error).message
            );
         }

         // 返回简化的取消屏蔽信息
         return {
            id: otherUser.id,
            clerkId: otherUser.clerkId,
            name: otherUser.name,
         };
      }),
});
