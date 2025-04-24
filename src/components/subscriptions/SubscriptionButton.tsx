import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubscriptionButtonProps {
   onClick: ButtonProps["onClick"];
   disabled: boolean;
   isSubscribed: boolean;
   className?: string;
   size?: ButtonProps["size"];
}

export default function SubscriptionButton({
   onClick,
   disabled,
   isSubscribed,
   className,
   size,
}: SubscriptionButtonProps) {
   return (
      <Button
         disabled={disabled}
         onClick={onClick}
         className={cn(" rounded-full", className)}
         size={size}
         variant={isSubscribed ? "secondary" : "default"}
      >
         {isSubscribed ? "Unsubscribe" : "Subscribe"}
      </Button>
   );
}
