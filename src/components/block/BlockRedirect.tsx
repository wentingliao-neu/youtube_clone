"use client";
import { useRouter } from "next/navigation";

export default function BlockRedirect() {
   const router = useRouter();
   router.push("/not-found");
   return null;
}
