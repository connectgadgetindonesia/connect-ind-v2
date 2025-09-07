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

type ReadyStockOption = {
  id: number;
  nama_produk: string;
  serial_number: string | null;
  imei: string | null;
  storage: string | null;
  warna: string | null;
  garansi: string | null;
  harga_modal: number;
};

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
    }
  }, [page, pageSize, q, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  // ---------- Add Modal ----------
  const [openAdd, setOpenAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [invoice, setInvoice] = useState("");
  const [tgl, setTgl] = useState(() => new Date().toISOString().slice(0, 10));
  const [hargaJual, setHargaJual] = useState<number | "">("");
  const [referal, setReferal] = useState("");
  const [pembeli, setPembeli] = useState("");
  const [noWa, setNoWa] = useState("");
  const [alamat, setAlamat] = useState("");

  const [ready, setReady] = useState<ReadyStockOption[]>([]);
  const [selectedId, setSelectedId] = useState<number | "">("");

  const loadReady = useCallback(async () => {
    const res = await fetch("/api/stok?status=READY&page=1&pageSize=100", { cache: "no-store" });
    const j: { ok: boolean; data: StockMinimal[] } | any = await res.json();

    type StockMinimal = {
      id: number;
      nama_produk: string;
      serial_number: string | null;
      imei: string | null;
      storage: string | null;
      warna: string | null;
      garansi: string | null;
      harga_modal: number;
    };

    if (j.ok) {
      const map: ReadyStockOption[] = j.data.map((r: StockMinimal) => ({
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
    if (openAdd) void loadReady();
  }, [openAdd, loadReady]);

  const selected = useMemo(
    () => ready.find((r) => r.id === (typeof selectedId === "number" ? selectedId : -1)),
    [ready, selectedId]
  );

  const submitAdd = async () => {
    if (!invoice || !tgl || !hargaJual || !selected) {
      alert("Invoice, tanggal, unit READY, dan harga jual wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      // API penjualan minta field lengkap—kita isi dari stok terpilih.
      const body = {
        invoice_id: invoice,
        jenis: "UNIT" as const,
        sn_sku: selected.serial_number || selected.imei || String(selected.id), // pengenal
        tanggal: tgl,
        nama_pembeli: pembeli || null,
        alamat: alamat || null,
        no_wa: noWa || null,
        nama_produk: selected.nama_produk,
        warna: selected.warna,
        storage: selected.storage,
        garansi: selected.garansi,
        harga_jual: Number(hargaJual),
        referal: referal || null,
      };

      const res = await fetch("/api/penjualan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j: { ok: boolean; error?: string } = await res.json();
      if (!j.ok) {
        alert(j.error || "Gagal menyimpan penjualan.");
        return;
      }
      setOpenAdd(false);
      // reset form
      setInvoice("");
      setHargaJual("");
      setReferal("");
      setPembeli("");
      setNoWa("");
      setAlamat("");
      setSelectedId("");
      await load();
    } catch (e) {
      alert(String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Penjualan</h1>
        <button
          className="bg-black text-white rounded-md px-4 py-2"
          onClick={() => setOpenAdd(true)}
        >
          + Tambah Penjualan
        </button>
      </div>

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
                <td>{[r.serial_number, r.imei].filter(Boolean).join(" / ") || "-"}</td>
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

      {/* Modal Tambah */}
      {openAdd && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Tambah Penjualan (UNIT)</h2>
              <button onClick={() => setOpenAdd(false)} className="text-sm text-neutral-600">
                ✕ Tutup
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <input className="border rounded-md px-3 py-2" placeholder="No. Invoice *" value={invoice} onChange={(e) => setInvoice(e.target.value)} />
              <input className="border rounded-md px-3 py-2" type="date" value={tgl} onChange={(e) => setTgl(e.target.value)} />

              <select
                className="border rounded-md px-3 py-2 sm:col-span-2"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value === "" ? "" : Number(e.target.value))}
              >
                <option value="">Pilih Unit READY (SN / IMEI)</option>
                {ready.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nama_produk} — {[r.serial_number, r.imei].filter(Boolean).join(" / ") || r.id} •{" "}
                    {[r.storage, r.warna].filter(Boolean).join(" · ")} • Modal {rupiah(r.harga_modal)}
                  </option>
                ))}
              </select>

              <input className="border rounded-md px-3 py-2" type="number" placeholder="Harga jual *" value={hargaJual} onChange={(e) => setHargaJual(e.target.value === "" ? "" : Number(e.target.value))} />
              <input className="border rounded-md px-3 py-2" placeholder="Referal (opsional)" value={referal} onChange={(e) => setReferal(e.target.value)} />
              <input className="border rounded-md px-3 py-2" placeholder="Nama pembeli" value={pembeli} onChange={(e) => setPembeli(e.target.value)} />
              <input className="border rounded-md px-3 py-2" placeholder="No. WA" value={noWa} onChange={(e) => setNoWa(e.target.value)} />
              <input className="border rounded-md px-3 py-2 sm:col-span-2" placeholder="Alamat" value={alamat} onChange={(e) => setAlamat(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button className="border rounded-md px-4 py-2" onClick={() => setOpenAdd(false)}>Batal</button>
              <button
                className="bg-black text-white rounded-md px-4 py-2 disabled:opacity-50"
                onClick={() => void submitAdd()}
                disabled={saving}
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
