import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CircleCheckBig, CircleOff } from "lucide-react";
import Hint from "../common/Hint";

interface BlockButtonProps {
   onClick: ButtonProps["onClick"];
   disabled: boolean;
   isBlocked: boolean;
   className?: string;
   style: "full" | "icon";
   size?: ButtonProps["size"];
}

export default function BlockButton({
   onClick,
   disabled,
   isBlocked,
   className,
   size,
   style,
}: BlockButtonProps) {
   return (
      <Hint label={isBlocked ? "Unblock" : "Block"}>
         <Button
            disabled={disabled}
            onClick={onClick}
            className={cn("rounded-full", className)}
            size={size}
            variant={isBlocked ? "secondary" : "default"}
         >
            {style === "full" ? (
               isBlocked ? (
                  "Unblock"
               ) : (
                  "Block"
               )
            ) : isBlocked ? (
               <CircleCheckBig className="size-4" />
            ) : (
               <CircleOff className="size-4" />
            )}
         </Button>
      </Hint>
   );
}
