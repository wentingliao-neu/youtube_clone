"use client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_URL } from "@/constants";
import { SearchIcon, XIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

export default function SearchInput() {
   return (
      <Suspense fallback={<Skeleton className=" h-10 w-full" />}>
         <SearchInputSuspense />
      </Suspense>
   );
}
function SearchInputSuspense() {
   const router = useRouter();
   const searchParams = useSearchParams();
   const [query, setQuery] = useState<string>(searchParams.get("query") || "");

   function handleSearch(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const url = new URL("/search", APP_URL);
      if (query.trim() !== "")
         url.searchParams.set("query", encodeURIComponent(query.trim()));
      else url.searchParams.delete("query");
      if (searchParams.get("categoryId"))
         url.searchParams.set("categoryId", searchParams.get("categoryId")!);
      setQuery(query.trim());
      router.push(url.toString());
   }
   return (
      <form className=" flex w-full max-w-[600px]" onSubmit={handleSearch}>
         <div className=" relative w-full">
            <input
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               type="text"
               className=" w-full pl-4 py-2 pr-12 rounded-l-full border focus:outline-none focus: border-blue-500"
               placeholder="Search"
            />
            {query && (
               <Button
                  onClick={() => setQuery("")}
                  type="button"
                  variant={"ghost"}
                  size={"icon"}
                  className=" absolute right-2 top-1.5 h-full rounded-full -translate-y-1/2"
               >
                  <XIcon className=" text-gray-500" />
               </Button>
            )}
         </div>
         <button
            disabled={!query.trim()}
            type="submit"
            className=" px-5 py-2.5 bg-gray-100 border border-l-0 rounded-r-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed "
         >
            <SearchIcon className="size-5" />
         </button>
      </form>
   );
}
