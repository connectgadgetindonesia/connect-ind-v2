import { Suspense } from "react";
import Client from "./Client";

// halaman stok dipaksa CSR agar aman pakai useSearchParams di client
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="max-w-6xl px-4 py-6 mx-auto">Memuat...</div>}>
      <Client />
    </Suspense>
  );
}
