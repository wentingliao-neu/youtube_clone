"use client";

import { Button } from "@/components/ui/button";
import {
   ClerkLoaded,
   ClerkLoading,
   SignedIn,
   SignedOut,
   SignInButton,
   UserButton,
} from "@clerk/nextjs";
import { ClapperboardIcon, UserCircleIcon, UserIcon } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

export default function AuthButton() {
   return (
      <>
         <ClerkLoaded>
            <SignedOut>
               <SignInButton mode="modal">
                  <Button
                     variant="outline"
                     className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500 border-blue-500/20 rounded-full shadow-none "
                  >
                     <UserCircleIcon />
                     Sign In
                  </Button>
               </SignInButton>
            </SignedOut>
            <SignedIn>
               <UserButton>
                  <UserButton.MenuItems>
                     <UserButton.Link
                        label="My profile"
                        href="/users/current"
                        labelIcon={<UserIcon className=" size-4" />}
                     />
                     <UserButton.Link
                        label="Studio"
                        href="/studio"
                        labelIcon={<ClapperboardIcon className=" size-4" />}
                     />
                  </UserButton.MenuItems>
               </UserButton>
            </SignedIn>
         </ClerkLoaded>
         <ClerkLoading>
            <Skeleton className=" size-10 rounded-full" />
         </ClerkLoading>
      </>
   );
}
