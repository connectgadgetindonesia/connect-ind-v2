"use client";

import { useEffect, useMemo, useState } from "react";

type ReadyItem = {
  id: number;
  nama_produk: string;
  serial_number: string | null;
  imei: string | null;
  storage: string | null;
  warna: string | null;
  harga_modal: number;
};

export default function PenjualanPage() {
  const [ready, setReady] = useState<ReadyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [f, setF] = useState({
    stok_id: "",
    tanggal: "",
    nama_pembeli: "",
    no_wa: "",
    alamat: "",
    harga_jual: "",
    referal: "",
  });

  const selected = useMemo(
    () => ready.find((r) => String(r.id) === f.stok_id),
    [ready, f.stok_id]
  );

  const laba = useMemo(() => {
    const hj = Number(f.harga_jual || 0);
    const modal = selected?.harga_modal ?? 0;
    return hj - modal;
  }, [f.harga_jual, selected]);

  async function loadReady() {
    setLoading(true);
    const r = await fetch("/api/stok?status=READY&pageSize=1000", { cache: "no-store" });
    const j = await r.json();
    setReady(
      (j.data ?? []).map((x: any) => ({
        id: x.id,
        nama_produk: x.nama_produk,
        serial_number: x.serial_number,
        imei: x.imei,
        storage: x.storage,
        warna: x.warna,
        harga_modal: x.harga_modal,
      }))
    );
    setLoading(false);
  }

  useEffect(() => { loadReady(); }, []);

  function u<K extends keyof typeof f>(k: K, v: string) {
    setF((s) => ({ ...s, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.stok_id) return alert("Pilih unit stok dulu");
    if (!f.tanggal) return alert("Isi tanggal");
    if (!f.harga_jual) return alert("Isi harga jual");

    setSubmitting(true);
    const r = await fetch("/api/penjualan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...f,
        stok_id: Number(f.stok_id),
        harga_jual: Number(f.harga_jual),
      }),
    });
    const j = await r.json();
    setSubmitting(false);

    if (!j.ok) {
      alert(j.error || "Gagal menyimpan penjualan");
      return;
    }

    alert(`Berhasil! Laba: Rp ${Number(j.laba).toLocaleString("id-ID")}`);
    // reset form & refresh stok ready
    setF({
      stok_id: "",
      tanggal: "",
      nama_pembeli: "",
      no_wa: "",
      alamat: "",
      harga_jual: "",
      referal: "",
    });
    await loadReady();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold mb-4">Penjualan</h1>

      <form onSubmit={onSubmit} className="space-y-4 p-4 border rounded-2xl">
        {/* Pilih unit */}
        <div className="grid sm:grid-cols-2 gap-3">
          <select
            className="border p-2 rounded"
            value={f.stok_id}
            onChange={(e) => u("stok_id", e.target.value)}
            required
          >
            <option value="">Pilih unit (READY)</option>
            {ready.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nama_produk}
                {r.storage ? ` ${r.storage}` : ""} •
                {r.warna ? ` ${r.warna}` : ""} •
                {r.serial_number || r.imei ? ` SN/IMEI: ${r.serial_number || r.imei}` : ""}
              </option>
            ))}
          </select>

          <input
            type="date"
            className="border p-2 rounded"
            placeholder="Tanggal"
            value={f.tanggal}
            onChange={(e) => u("tanggal", e.target.value)}
            required
          />
        </div>

        {/* Info pembeli */}
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            className="border p-2 rounded"
            placeholder="Nama pembeli"
            value={f.nama_pembeli}
            onChange={(e) => u("nama_pembeli", e.target.value)}
          />
          <input
            className="border p-2 rounded"
            placeholder="No. WA"
            value={f.no_wa}
            onChange={(e) => u("no_wa", e.target.value)}
          />
        </div>
        <textarea
          className="border p-2 rounded w-full"
          placeholder="Alamat (opsional)"
          value={f.alamat}
          onChange={(e) => u("alamat", e.target.value)}
          rows={2}
        />

        {/* Harga & Referal */}
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            type="number"
            className="border p-2 rounded"
            placeholder="Harga jual"
            value={f.harga_jual}
            onChange={(e) => u("harga_jual", e.target.value)}
            required
          />
          <input
            className="border p-2 rounded"
            placeholder="Referal (opsional)"
            value={f.referal}
            onChange={(e) => u("referal", e.target.value)}
          />
          <div className="border p-2 rounded bg-gray-50 text-sm">
            <div>Modal: <b>Rp {Number(selected?.harga_modal ?? 0).toLocaleString("id-ID")}</b></div>
            <div>Laba: <b>Rp {Number(laba).toLocaleString("id-ID")}</b></div>
          </div>
        </div>

        <div className="pt-2">
          <button
            className="bg-black text-white rounded px-4 py-2 disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? "Menyimpan..." : "Simpan Penjualan"}
          </button>
        </div>
      </form>

      {loading && <div className="mt-4">Memuat stok READY…</div>}
    </div>
  );
}
