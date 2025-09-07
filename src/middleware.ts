// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// daftar route PUBLIC (tanpa login)
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/healthz",
]);

export default clerkMiddleware((auth, req) => {
  // kalau bukan public, wajib login
  if (!isPublicRoute(req)) auth().protect();
});

// jalankan middleware untuk semua route kecuali asset statis & _next
export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
