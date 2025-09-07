import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Dashboard CONNECT.IND v2</h1>
      <p className="text-sm text-gray-600">Login berhasil. Menu akan kita lengkapi bertahap.</p>
    </main>
  );
}
