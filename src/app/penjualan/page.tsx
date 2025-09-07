"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

// -------------------- Types --------------------
type SaleRow = {
  id: number;
  invoice_id: string;
  tanggal: string; // ISO date
  jenis: "UNIT" | "AKSESORIS";
  sn_sku: string;
  nama_produk: string;
  warna: string | null;
  storage: string | null;
  garansi: string | null;
  harga_modal: number;
  harga_jual: number;
  laba: number;
  dilayani_oleh: string | null;
  referal: string | null;
  created_at: string; // ISO datetime
};

type SaleListRes = {
  ok: boolean;
  data: SaleRow[];
  page: number;
  pageSize: number;
  total: number;
  error?: string;
};

export type ReadyStockOption = {
  id: number;
  nama_produk: string;
  serial_number: string | null;
  imei: string | null;
  storage: string | null;
  warna: string | null;
  garansi: string | null;
  harga_modal: number;
};

// — tipe response untuk /api/stok (READY) —
type StockMinimal = ReadyStockOption;

type StockListRes = {
  ok: boolean;
  data: StockMinimal[];
  page: number;
  pageSize: number;
  total: number;
  error?: string;
};

// -------------------- Utils --------------------
function rp(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
function fmtDate(d: string) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("id-ID");
}

// -------------------- Page --------------------
export default function PenjualanPage() {
  // filter
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // list state
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // ready stock (untuk modal input penjualan)
  const [ready, setReady] = useState<ReadyStockOption[]>([]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  // Ambil daftar penjualan
  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (q.trim()) p.set("q", q.trim());
      if (from) p.set("from", from);
      if (to) p.set("to", to);
      p.set("page", String(page));
      p.set("pageSize", String(pageSize));

      const res = await fetch(`/api/penjualan?${p.toString()}`, { cache: "no-store" });
      const j: SaleListRes = await res.json();
      if (j.ok) {
        setRows(j.data);
        setTotal(j.total);
      } else {
        setRows([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  }, [from, to, page, pageSize, q]);

  // Ambil stok READY untuk dipakai di form penjualan (tanpa any)
  const loadReady = useCallback(async () => {
    const res = await fetch("/api/stok?status=READY&page=1&pageSize=100", { cache: "no-store" });
    const j: StockListRes = await res.json();

    if (j.ok) {
      const map: ReadyStockOption[] = j.data.map((r) => ({
        id: r.id,
        nama_produk: r.nama_produk,
        serial_number: r.serial_number,
        imei: r.imei,
        storage: r.storage,
        warna: r.warna,
        garansi: r.garansi,
        harga_modal: r.harga_modal,
      }));
      setReady(map);
    } else {
      setReady([]);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    loadReady();
  }, [loadReady]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Penjualan</h1>

        {/* Tombol input penjualan */}
        <a
          href="/penjualan?aksi=tambah" // bisa diarahkan ke modal/halaman form
          className="inline-flex items-center rounded-md border border-black bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Tambah Penjualan
        </a>
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari (produk/SN/IMEI/pelayan)"
          className="w-72 rounded-md border px-3 py-2 text-sm outline-none"
        />
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm outline-none"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm outline-none"
        />
        <button
          onClick={() => { setPage(1); loadList(); }}
          className="rounded-md border border-black bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Terapkan
        </button>
      </div>

      {/* Tabel */}
      <div className="rounded-md border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-2 border-b">Tanggal</th>
              <th className="p-2 border-b">Produk</th>
              <th className="p-2 border-b">SN / IMEI</th>
              <th className="p-2 border-b">Pembeli</th>
              <th className="p-2 border-b">Harga Jual</th>
              <th className="p-2 border-b">Modal</th>
              <th className="p-2 border-b">Laba</th>
              <th className="p-2 border-b">Dilayani</th>
              <th className="p-2 border-b">Referal</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="p-6 text-center text-gray-500">Memuat...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={9} className="p-6 text-center text-gray-500">Tidak ada data.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="p-2 border-b">{fmtDate(r.tanggal)}</td>
                  <td className="p-2 border-b">{r.nama_produk}</td>
                  <td className="p-2 border-b">{r.sn_sku}</td>
                  <td className="p-2 border-b">{/* nama pembeli kalau disimpan */}</td>
                  <td className="p-2 border-b text-right">{rp(r.harga_jual)}</td>
                  <td className="p-2 border-b text-right">{rp(r.harga_modal)}</td>
                  <td className="p-2 border-b text-right">{rp(r.laba)}</td>
                  <td className="p-2 border-b">{r.dilayani_oleh ?? "-"}</td>
                  <td className="p-2 border-b">{r.referal ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer pagination */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
        <div>Total {total} data • Hal {page} / {totalPages}</div>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-md border px-3 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-md border px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* Data stok ready sudah tersedia di state `ready` bila dibutuhkan untuk form */}
      {/* Contoh akses: ready.map(r => r.nama_produk) */}
    </div>
  );
}
