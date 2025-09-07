"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  invoice_id: string;
  tanggal: string;
  jenis: "UNIT" | "AKSESORIS";
  sn_sku: string;
  nama_produk: string;
  warna: string | null;
  storage: string | null;
  harga_modal: number;
  harga_jual: number;
  laba: number;
  dilayani_oleh: string | null;
  referal: string | null;
  created_at: string;
};

export default function RiwayatPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(p = page) {
    setLoading(true);
    const sp = new URLSearchParams();
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    if (q.trim()) sp.set("q", q.trim());
    sp.set("page", String(p));
    sp.set("pageSize", String(pageSize));
    const r = await fetch(`/api/penjualan?${sp.toString()}`, { cache: "no-store" });
    const j = await r.json();
    setRows(j.data ?? []);
    setTotal(j.total ?? 0);
    setPage(j.page ?? p);
    setLoading(false);
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onApply() {
    load(1);
  }

  const totalLaba = useMemo(
    () => rows.reduce((acc, it) => acc + (Number(it.laba) || 0), 0),
    [rows]
  );

  const fmt = (n: number) => n.toLocaleString("id-ID");

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Riwayat Penjualan</h1>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-sm">Dari tanggal</label>
          <input type="date" className="border p-2 rounded" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Sampai tanggal</label>
          <input type="date" className="border p-2 rounded" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <div className="grow min-w-[220px]">
          <label className="block text-sm">Cari (invoice / produk / SN / dilayani / referal)</label>
          <input type="text" className="border p-2 rounded w-full" placeholder="ketik kata kunci..."
            value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <button className="px-4 py-2 rounded bg-black text-white" onClick={onApply}>
          Terapkan
        </button>
      </div>

      <div className="text-sm text-gray-600">
        Total {total} transaksi • Laba halaman ini: <b>Rp {fmt(totalLaba)}</b>
      </div>

      <div className="overflow-auto">
        {loading ? (
          <div>Memuat...</div>
        ) : (
          <table className="min-w-[1100px] w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Tanggal</th>
                <th className="p-2 border">Invoice</th>
                <th className="p-2 border">Jenis</th>
                <th className="p-2 border">Produk</th>
                <th className="p-2 border">SN/SKU</th>
                <th className="p-2 border">Jual</th>
                <th className="p-2 border">Modal</th>
                <th className="p-2 border">Laba</th>
                <th className="p-2 border">Dilayani</th>
                <th className="p-2 border">Referal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="p-2 border">{r.tanggal}</td>
                  <td className="p-2 border">{r.invoice_id}</td>
                  <td className="p-2 border">{r.jenis}</td>
                  <td className="p-2 border">{r.nama_produk}</td>
                  <td className="p-2 border">{r.sn_sku}</td>
                  <td className="p-2 border">Rp {fmt(r.harga_jual)}</td>
                  <td className="p-2 border">Rp {fmt(r.harga_modal)}</td>
                  <td className="p-2 border font-medium">Rp {fmt(r.laba)}</td>
                  <td className="p-2 border">{r.dilayani_oleh ?? "-"}</td>
                  <td className="p-2 border">{r.referal ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          onClick={() => load(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          ← Prev
        </button>
        <div className="text-sm">Hal {page} / {totalPages}</div>
        <button
          className="px-3 py-1 border rounded disabled:opacity-50"
          onClick={() => load(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
