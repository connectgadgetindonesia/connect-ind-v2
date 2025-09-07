// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// daftar route PUBLIC (tanpa login)
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/healthz",
]);

export default clerkMiddleware(async (auth, req) => {
  // auth adalah fungsi async → harus di-await dulu
  const a = await auth();

  // kalau bukan public, wajib login
  if (!isPublicRoute(req)) {
    a.protect();
  }
});

// jalankan middleware untuk semua route kecuali asset statis & _next
export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
