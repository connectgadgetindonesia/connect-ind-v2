import { Suspense } from "react";
import Client from "./Client";

export const dynamic = "force-dynamic"; // hindari SSG agar aman di Vercel

export default function Page() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-6">Memuat…</div>}>
      <Client />
    </Suspense>
  );
}
