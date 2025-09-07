"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  nama_produk: string;
  sn: string | null;
  status: "READY" | "SOLD";
  harga_modal: number;
  tanggal_masuk: string;
};

export default function StokPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nama_produk: "",
    sn: "",
    warna: "",
    storage: "",
    harga_modal: "",
    tanggal_masuk: "",
  });
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/stok", { cache: "no-store" });
    const j = await r.json();
    setRows(j.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const r = await fetch("/api/stok", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        harga_modal: Number(form.harga_modal || 0),
        tanggal_masuk: form.tanggal_masuk,
      }),
    });
    const j = await r.json();
    if (j.ok) {
      setMsg("Berhasil tambah stok");
      setForm({ nama_produk: "", sn: "", warna: "", storage: "", harga_modal: "", tanggal_masuk: "" });
      load();
    } else {
      setMsg(`Gagal: ${j.error}`);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Stok Unit</h1>

      <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 max-w-3xl p-4 border rounded-xl">
        <input className="border p-2 rounded" placeholder="Nama produk" value={form.nama_produk}
               onChange={e => setForm({ ...form, nama_produk: e.target.value })} required />
        <input className="border p-2 rounded" placeholder="SN (opsional)" value={form.sn}
               onChange={e => setForm({ ...form, sn: e.target.value })} />
        <input className="border p-2 rounded" placeholder="Warna" value={form.warna}
               onChange={e => setForm({ ...form, warna: e.target.value })} />
        <input className="border p-2 rounded" placeholder="Storage" value={form.storage}
               onChange={e => setForm({ ...form, storage: e.target.value })} />
        <input className="border p-2 rounded" type="number" placeholder="Harga modal"
               value={form.harga_modal} onChange={e => setForm({ ...form, harga_modal: e.target.value })} required />
        <input className="border p-2 rounded" type="date" placeholder="Tanggal masuk"
               value={form.tanggal_masuk} onChange={e => setForm({ ...form, tanggal_masuk: e.target.value })} required />

        <div className="col-span-2 flex items-center gap-3">
          <button className="px-4 py-2 rounded bg-black text-white">Simpan</button>
          {msg && <span className="text-sm text-gray-600">{msg}</span>}
        </div>
      </form>

      <div className="overflow-auto">
        {loading ? (
          <div>Memuat...</div>
        ) : (
          <table className="min-w-[800px] w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Tanggal</th>
                <th className="p-2 border">Produk</th>
                <th className="p-2 border">SN</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Modal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="p-2 border">{r.tanggal_masuk}</td>
                  <td className="p-2 border">{r.nama_produk}</td>
                  <td className="p-2 border">{r.sn ?? "-"}</td>
                  <td className="p-2 border">{r.status}</td>
                  <td className="p-2 border">{r.harga_modal.toLocaleString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
