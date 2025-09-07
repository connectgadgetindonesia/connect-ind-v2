import { Suspense } from "react";
import dynamic from "next/dynamic";

export const dynamic = "force-dynamic";

const Client = dynamic(() => import("./Client"), { ssr: false });

export default function Page() {
  return (
    <Suspense
      fallback={<div className="max-w-6xl mx-auto px-4 py-6">Memuat...</div>}
    >
      <Client />
    </Suspense>
  );
}
