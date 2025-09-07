import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  publicRoutes: ["/sign-in(.*)", "/sign-up(.*)", "/healthz"],
});

export const config = {
  matcher: ["/((?!_next|.*\\..*|favicon.ico).*)"],
};
