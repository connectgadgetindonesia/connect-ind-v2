"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
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
  status: string;
  created_at: string;
};

export default function StokPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  // form state
  const [f, setF] = useState({
    nama_produk: "",
    serial_number: "",
    imei: "",
    storage: "",
    warna: "",
    garansi: "",
    asal_produk: "",
    harga_modal: "",
    tanggal_masuk: "",
  });

  const fmtRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  async function load() {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    sp.set("pageSize", "100");
    const r = await fetch(`/api/stok?${sp.toString()}`, { cache: "no-store" });
    const j = await r.json();
    setRows(j.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function update<K extends keyof typeof f>(k: K, v: string) {
    setF((s) => ({ ...s, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const body = {
      ...f,
      harga_modal: Number(f.harga_modal || 0),
      // kosongkan string "" menjadi null untuk kolom opsional
      serial_number: f.serial_number.trim() || null,
      imei: f.imei.trim() || null,
      storage: f.storage.trim() || null,
      warna: f.warna.trim() || null,
      garansi: f.garansi.trim() || null,
      asal_produk: f.asal_produk.trim() || null,
    };

    const r = await fetch("/api/stok", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!j.ok) {
      alert(j.error || "Gagal simpan");
      return;
    }
    // reset form
    setF({
      nama_produk: "",
      serial_number: "",
      imei: "",
      storage: "",
      warna: "",
      garansi: "",
      asal_produk: "",
      harga_modal: "",
      tanggal_masuk: "",
    });
    await load();
  }

  const totalReady = useMemo(
    () => rows.filter(r => r.status === "READY").length,
    [rows]
  );

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold mb-4">Stok Unit</h1>

      {/* FORM */}
      <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 p-4 border rounded-2xl mb-6">
        <input className="border p-2 rounded" placeholder="Nama produk"
               value={f.nama_produk} onChange={e => update("nama_produk", e.target.value)} required />
        <input className="border p-2 rounded" placeholder="Serial number (opsional)"
               value={f.serial_number} onChange={e => update("serial_number", e.target.value)} />

        <input className="border p-2 rounded" placeholder="IMEI (opsional)"
               value={f.imei} onChange={e => update("imei", e.target.value)} />
        <input className="border p-2 rounded" placeholder="Storage (contoh: 128GB)"
               value={f.storage} onChange={e => update("storage", e.target.value)} />

        <input className="border p-2 rounded" placeholder="Warna"
               value={f.warna} onChange={e => update("warna", e.target.value)} />
        <input className="border p-2 rounded" placeholder="Garansi (contoh: 3 bulan)"
               value={f.garansi} onChange={e => update("garansi", e.target.value)} />

        <input className="border p-2 rounded" placeholder="Asal produk (supplier/TTB)"
               value={f.asal_produk} onChange={e => update("asal_produk", e.target.value)} />
        <input className="border p-2 rounded" type="number" placeholder="Harga modal"
               value={f.harga_modal} onChange={e => update("harga_modal", e.target.value)} required />

        <input className="border p-2 rounded" type="date" placeholder="Tanggal masuk"
               value={f.tanggal_masuk} onChange={e => update("tanggal_masuk", e.target.value)} required />

        <div className="col-span-2">
          <button className="bg-black text-white rounded px-4 py-2">Simpan</button>
        </div>
      </form>

      {/* FILTER CARI */}
      <div className="flex items-center gap-2 mb-3">
        <input
          className="border p-2 rounded w-72"
          placeholder="Cari nama/SN/IMEI…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <button className="border px-3 py-2 rounded" onClick={load}>Cari</button>
        <div className="text-sm text-gray-600 ml-auto">READY: <b>{totalReady}</b></div>
      </div>

      {/* TABEL */}
      {loading ? (
        <div>Memuat…</div>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-[900px] w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border text-left">Nama</th>
                <th className="p-2 border text-left">SN</th>
                <th className="p-2 border text-left">IMEI</th>
                <th className="p-2 border text-left">Storage</th>
                <th className="p-2 border text-left">Warna</th>
                <th className="p-2 border text-left">Garansi</th>
                <th className="p-2 border text-left">Asal</th>
                <th className="p-2 border text-right">Modal</th>
                <th className="p-2 border text-left">Tgl Masuk</th>
                <th className="p-2 border text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="p-2 border">{r.nama_produk}</td>
                  <td className="p-2 border">{r.serial_number || "-"}</td>
                  <td className="p-2 border">{r.imei || "-"}</td>
                  <td className="p-2 border">{r.storage || "-"}</td>
                  <td className="p-2 border">{r.warna || "-"}</td>
                  <td className="p-2 border">{r.garansi || "-"}</td>
                  <td className="p-2 border">{r.asal_produk || "-"}</td>
                  <td className="p-2 border text-right">{fmtRp(r.harga_modal)}</td>
                  <td className="p-2 border">{r.tanggal_masuk}</td>
                  <td className="p-2 border">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
