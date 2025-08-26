// import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// //protect the following routes when the user is unautheniticated
// const isProtectedRoute = createRouteMatcher(["/generate-program", "/profile"]);
// export default clerkMiddleware(async (auth, req) => {
//   if (isProtectedRoute(req)) await auth.protect();
// });

// export const config = {
//   matcher: [
//     // Skip Next.js internals and all static files, unless found in search params
//     "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
//     // Always run for API routes
//     "/(api|trpc)(.*)",
//   ],
// };

// src/middleware.ts
import { NextResponse } from "next/server";

export function middleware() {
  // Do nothing, just continue the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    // You can keep this or simplify it
    "/((?!_next|.*\\..*).*)",
  ],
};
