"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

// ---------- Types ----------
type StockRow = {
  id: number;
  nama_produk: string;
  serial_number: string | null;
  imei: string | null;
  storage: string | null;
  warna: string | null;
  garansi: string | null;
  asal_produk: string | null;
  harga_modal: number;
  tanggal_masuk: string; // YYYY-MM-DD
  status: "READY" | "SOLD";
  created_at: string;
};

type StockApiRes = {
  ok: boolean;
  data: StockRow[];
  page: number;
  pageSize: number;
  total: number;
  error?: string;
};

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0
  );

export default function StokPage() {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [total, setTotal] = useState(0);

  // filters
  const [status, setStatus] = useState<"" | "READY" | "SOLD">("");
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
      ...(status ? { status } : {}),
      ...(q ? { q } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    });

    const res = await fetch(`/api/stok?${params.toString()}`, { cache: "no-store" });
    const json: StockApiRes = await res.json();

    if (json.ok) {
      setRows(json.data);
      setTotal(json.total);
    } else {
      setRows([]);
      setTotal(0);
      // console.error(json.error);
    }
  }, [page, pageSize, status, q, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-xl font-semibold">Stok Unit</h1>

      {/* Filter bar */}
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as "" | "READY" | "SOLD");
            setPage(1);
          }}
          className="border rounded-md px-3 py-2"
        >
          <option value="">Semua status</option>
          <option value="READY">READY</option>
          <option value="SOLD">SOLD</option>
        </select>

        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Cari (produk/SN/IMEI/storage/warna)"
          className="border rounded-md px-3 py-2 sm:col-span-2"
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
              <th>Produk</th>
              <th>SN / IMEI</th>
              <th>Varian</th>
              <th>Garansi</th>
              <th>Asal</th>
              <th>Modal</th>
              <th>Tgl Masuk</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="[&>td]:py-2 [&>td]:px-3 border-t">
                <td className="font-medium">{r.nama_produk}</td>
                <td>{[r.serial_number, r.imei].filter(Boolean).join(" / ") || "-"}</td>
                <td>{[r.storage, r.warna].filter(Boolean).join(" · ") || "-"}</td>
                <td>{r.garansi || "-"}</td>
                <td>{r.asal_produk || "-"}</td>
                <td className="text-right">{rupiah(r.harga_modal)}</td>
                <td>{r.tanggal_masuk}</td>
                <td>{r.status}</td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-neutral-500">
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
