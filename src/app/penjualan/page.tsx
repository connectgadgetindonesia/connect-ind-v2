import { Suspense } from "react";
import PenjualanClient from "./Client";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Memuat…</div>}>
      <PenjualanClient />
    </Suspense>
  );
}
