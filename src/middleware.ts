// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// route PUBLIC (tanpa login)
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/healthz",
]);

export default clerkMiddleware(async (auth, req) => {
  const a = await auth();
  // kalau route bukan public & belum login → redirect ke Sign In
  if (!isPublicRoute(req) && !a.userId) {
    return a.redirectToSignIn();
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
