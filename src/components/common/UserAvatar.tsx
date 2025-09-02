import { cn } from "@/lib/utils";
import { Avatar, AvatarImage } from "../ui/avatar";
import { cva, type VariantProps } from "class-variance-authority";
import LiveBadge from "../stream/LiveBadge";
import { Skeleton } from "../ui/skeleton";

const avatarVariants = cva("", {
   variants: {
      size: {
         default: " h-9 w-9",
         xs: " h-4 w-4",
         xl: " h-[160px] w-[160px]",
         sm: " h-6 w-6",
         lg: " h-10 w-10",
      },
   },
   defaultVariants: {
      size: "default",
   },
});

interface Props extends VariantProps<typeof avatarVariants> {
   imageUrl: string;
   name: string;
   className?: string;
   onClick?: () => void;
   isLive?: boolean;
}

export default function UserAvatar({
   imageUrl,
   name,
   className,
   onClick,
   size,
   isLive = false,
}: Props) {
   return (
      <div className=" relative">
         <Avatar
            className={cn(avatarVariants({ size, className }))}
            onClick={onClick}
         >
            <AvatarImage src={imageUrl} alt={name} />
         </Avatar>
         {isLive && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 transform">
               <LiveBadge />
            </div>
         )}
      </div>
   );
}

export function UserAvatarSkeleton({
   size,
}: {
   size: VariantProps<typeof avatarVariants>["size"];
}) {
   return <Skeleton className={cn("rounded-full", avatarVariants({ size }))} />;
}
