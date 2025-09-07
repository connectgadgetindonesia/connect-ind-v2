"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/stok", label: "Stok" },
  { href: "/aksesoris", label: "Aksesoris" },
  { href: "/penjualan", label: "Penjualan" },
  { href: "/riwayat", label: "Riwayat" },
];

export default function MainNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="flex items-center gap-1 text-sm">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={[
            "px-3 py-2 rounded-md transition",
            isActive(l.href)
              ? "bg-black text-white"
              : "text-gray-700 hover:bg-gray-100"
          ].join(" ")}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
