// src/middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Konfigurasi paling aman:
 * - Semua route dilindungi kecuali asset statis (_next, file dengan ekstensi) dan halaman auth.
 * - /healthz dibiarkan public biar liveness check OK.
 */
export default clerkMiddleware({
  publicRoutes: ["/sign-in(.*)", "/sign-up(.*)", "/healthz"],
});

export const config = {
  // Jalankan middleware untuk semua route kecuali asset statis
  matcher: [
    "/((?!.*\\..*|_next).*)", // semua selain file statis & _next
    "/",                      // root
    "/(api|trpc)(.*)",        // API routes
  ],
};
