import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Page() {
  const user = await currentUser();
  const nama = user?.firstName || user?.fullName || "Admin";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border p-6">
        <h1 className="text-2xl font-semibold">Selamat datang, {nama} 👋</h1>
        <p className="text-gray-600 mt-1">
          Pilih menu di atas atau gunakan pintasan di bawah untuk mulai bekerja.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { href: "/penjualan", title: "Tambah Penjualan", desc: "Catat transaksi baru" },
          { href: "/stok", title: "Stok Unit", desc: "Kelola stok handphone" },
          { href: "/aksesoris", title: "Stok Aksesoris", desc: "Kelola aksesori & stok" },
          { href: "/riwayat", title: "Riwayat", desc: "Lihat transaksi & laba" },
          { href: "/settings", title: "Pengaturan", desc: "Preferensi & pengguna" },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border p-4 hover:bg-gray-50 transition"
          >
            <div className="font-medium">{card.title}</div>
            <div className="text-sm text-gray-600">{card.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
