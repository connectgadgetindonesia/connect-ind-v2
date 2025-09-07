import { Suspense } from "react";
import PenjualanClient from "./Client";

export default function Page() {
  return (
    <Suspense>
      <PenjualanClient />
    </Suspense>
  );
}
