import { Suspense } from "react";
import Client from "./Client";

// supaya route stok tidak diprerender & selalu dinamis
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-6">Memuat...</div>}>
      <Client />
    </Suspense>
  );
}
