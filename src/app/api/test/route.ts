import { pusher } from "@/lib/pusher";
// import { streamClient } from "@/lib/stream";
import { NextResponse } from "next/server";

export async function GET() {
   await pusher.trigger(
      `stream-5ab8914b-6f33-4da2-b1cd-6e3323533147`,
      // "statusChanged",
      // {
      //    isLive: true,
      // }
      "test",
      {
         message: "test",
      }
   );
   console.log(
      "triggered pusher",
      `stream-5ab8914b-6f33-4da2-b1cd-6e3323533147`
   );
   return NextResponse.json({ message: "Hello, world!" });
}
