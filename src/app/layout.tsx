import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { TRPCProvider } from "@/trpc/client";
import { Toaster } from "@/components/ui/sonner";
import { StreamChatClient } from "@/components/common/StreamChatClient";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
   title: "newTube",
   description: "clone of youtube",
};

export default function RootLayout({
   children,
}: Readonly<{
   children: React.ReactNode;
}>) {
   return (
      <html lang="en" suppressHydrationWarning>
         <body className={inter.className} suppressHydrationWarning>
            <ClerkProvider dynamic afterSignOutUrl="/">
               <TRPCProvider>
                  <Toaster />
                  <StreamChatClient>{children}</StreamChatClient>
               </TRPCProvider>
            </ClerkProvider>
         </body>
      </html>
   );
}
