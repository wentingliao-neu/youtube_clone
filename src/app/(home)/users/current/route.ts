import db from "@/db";
import { users } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function GET() {
   const { userId } = await auth();
   if (!userId) return redirect("/sign-in");

   const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId));
   if (!user) return redirect("/sign-in");
   return redirect(`/users/${user.id}`);
}
