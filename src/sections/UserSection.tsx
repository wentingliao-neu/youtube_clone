"use client";
import { Separator } from "@/components/ui/separator";
import UserPageBanner, {
   UserPageBannerSkeleton,
} from "@/components/users/UserPageBanner";
import UserPageInfo, {
   UserPageInfoSkeleton,
} from "@/components/users/UserPageInfo";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface UserSectionProps {
   userId: string;
}
export default function UserSection({ userId }: UserSectionProps) {
   return (
      <Suspense>
         <ErrorBoundary fallback={<UserSectionSkeleton />}>
            <UserSectionSuspense userId={userId} />
         </ErrorBoundary>
      </Suspense>
   );
}

function UserSectionSuspense({ userId }: UserSectionProps) {
   const [user] = trpc.users.getOne.useSuspenseQuery({
      id: userId,
   });
   return (
      <div className="flex flex-col ">
         <UserPageBanner user={user} />
         <UserPageInfo user={user} /> <Separator />
      </div>
   );
}

function UserSectionSkeleton() {
   return (
      <div className="flex flex-col ">
         <UserPageBannerSkeleton />
         <UserPageInfoSkeleton /> <Separator />
      </div>
   );
}
