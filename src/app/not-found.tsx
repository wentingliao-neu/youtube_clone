import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
   return (
      <div className=" h-screen flex flex-col space-y-4 items-center justify-center text-muted-foreground">
         <h1 className=" text-4xl">404</h1>
         <p>We could&apos;t find the resource you were looking for.</p>
         <Button variant="secondary" asChild>
            <Link prefetch href="/">
               Go back home
            </Link>
         </Button>
      </div>
   );
}
