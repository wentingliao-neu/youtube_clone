import Link from "next/link";

export default function NotFound() {
   return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
         <h1>404 - Page Not Found</h1>
         <p>Sorry, the page you are looking for does not exist.</p>
         <Link prefetch href="/">
            Go back to Home
         </Link>
      </div>
   );
}
