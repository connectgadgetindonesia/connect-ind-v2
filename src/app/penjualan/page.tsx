"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

// ---------- Types ----------
type SaleRow = {
  id: number;
  tanggal: string; // YYYY-MM-DD
  nama_pembeli: string | null;
  no_wa: string | null;
  alamat: string | null;
  harga_modal: number;
  harga_jual: number;
  laba: number;
  referal: string | null;
  dilayani_oleh: string;
  created_at: string;

  // joined from stok_unit
  stok_id: number;
  nama_produk: string;
  serial_number: string | null;
  imei: string | null;
  storage: string | null;
  warna: string | null;
};

type ApiRes = {
  ok: boolean;
  data: SaleRow[];
  page: number;
  pageSize: number;
  total: number;
  error?: string;
};

// ---------- Helpers ----------
const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0
  );

// ---------- Page ----------
export default function PenjualanPage() {
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [total, setTotal] = useState(0);

  // filters
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const load = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      ...(q ? { q } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    });

    const res = await fetch(`/api/penjualan?${params.toString()}`, { cache: "no-store" });
    const json: ApiRes = await res.json();

    if (json.ok) {
      setRows(json.data);
      setTotal(json.total);
    } else {
      setRows([]);
      setTotal(0);
      // optional: tampilkan toast dari json.error
      // console.error(json.error);
    }
  }, [page, pageSize, q, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-xl font-semibold">Penjualan</h1>

      {/* Filter bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Cari (produk/SN/IMEI/pelayan/referal)"
          className="border rounded-md px-3 py-2"
        />
        <input
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(1);
          }}
          className="border rounded-md px-3 py-2"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setPage(1);
          }}
          className="border rounded-md px-3 py-2"
        />
        <button
          onClick={() => void load()}
          className="border rounded-md px-3 py-2 hover:bg-neutral-50"
        >
          Terapkan
        </button>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-neutral-50">
            <tr className="[&>th]:text-left [&>th]:py-2 [&>th]:px-3">
              <th>Tanggal</th>
              <th>Produk</th>
              <th>SN / IMEI</th>
              <th>Pembeli</th>
              <th>Harga Jual</th>
              <th>Modal</th>
              <th>Laba</th>
              <th>Dilayani</th>
              <th>Referal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="[&>td]:py-2 [&>td]:px-3 border-t">
                <td>{r.tanggal}</td>
                <td>
                  <div className="font-medium">{r.nama_produk}</div>
                  <div className="text-neutral-500">
                    {[r.storage, r.warna].filter(Boolean).join(" · ")}
                  </div>
                </td>
                <td>
                  {[r.serial_number, r.imei].filter(Boolean).join(" / ") || "-"}
                </td>
                <td>{r.nama_pembeli || "-"}</td>
                <td className="text-right">{rupiah(r.harga_jual)}</td>
                <td className="text-right">{rupiah(r.harga_modal)}</td>
                <td className="text-right font-semibold">{rupiah(r.laba)}</td>
                <td>{r.dilayani_oleh}</td>
                <td>{r.referal || "-"}</td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-10 text-neutral-500">
                  Tidak ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-neutral-600">
          Total {total} data • Hal {page} / {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="border rounded-md px-3 py-2 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="border rounded-md px-3 py-2 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
