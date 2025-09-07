"use client";

import React, { useEffect, useState } from "react";

type Status = "READY" | "SOLD";

type StokRow = {
  id: number;
  nama_produk: string;
  sn: string | null;
  imei: string | null;
  storage: string | null;
  warna: string | null;
  garansi: string | null;
  asal: string | null;
  harga_modal: number | null;
  tanggal_masuk: string | null; // ISO
  status: Status;
};

type FormState = {
  nama_produk: string;
  sn: string;
  imei: string;
  storage: string;
  warna: string;
  garansi: string;
  asal: string;
  harga_modal: string; // as text; convert to number on submit
  tanggal_masuk: string; // yyyy-mm-dd
};

export default function Client() {
  const [rows, setRows] = useState<StokRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // filters (sederhana)
  const [q, setQ] = useState<string>("");
  const [status, setStatus] = useState<"" | Status>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  // modal
  const [open, setOpen] = useState<boolean>(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [saving, setSaving] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState<FormState>({
    nama_produk: "",
    sn: "",
    imei: "",
    storage: "",
    warna: "",
    garansi: "",
    asal: "",
    harga_modal: "",
    tanggal_masuk: "",
  });

  function resetForm() {
    setForm({
      nama_produk: "",
      sn: "",
      imei: "",
      storage: "",
      warna: "",
      garansi: "",
      asal: "",
      harga_modal: "",
      tanggal_masuk: "",
    });
  }

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/stok?${params.toString()}`, { cache: "no-store" });
    const json: { ok: boolean; data: StokRow[] } = await res.json();
    if (json.ok) setRows(json.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startAdd() {
    resetForm();
    setMode("add");
    setEditId(null);
    setOpen(true);
  }

  function startEdit(r: StokRow) {
    setEditId(r.id); // penting: simpan id baris yang akan diupdate
    setForm({
      nama_produk: r.nama_produk ?? "",
      sn: r.sn ?? "",
      imei: r.imei ?? "",
      storage: r.storage ?? "",
      warna: r.warna ?? "",
      garansi: r.garansi ?? "",
      asal: r.asal ?? "",
      harga_modal: r.harga_modal != null ? String(r.harga_modal) : "",
      tanggal_masuk: (r.tanggal_masuk ?? "").slice(0, 10),
    });
    setMode("edit");
    setOpen(true);
  }

  async function submitAdd() {
    setSaving(true);
    try {
      const res = await fetch("/api/stok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_produk: form.nama_produk,
          sn: form.sn || null,
          imei: form.imei || null,
          storage: form.storage || null,
          warna: form.warna || null,
          garansi: form.garansi || null,
          asal: form.asal || null,
          harga_modal: form.harga_modal ? Number(form.harga_modal) : null,
          tanggal_masuk: form.tanggal_masuk || null,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Gagal menyimpan");
      setOpen(false);
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function submitEdit() {
    if (!editId) {
      alert("id wajib");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/stok", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId, // <- kirim id ke API
          nama_produk: form.nama_produk || undefined,
          sn: form.sn || undefined,
          imei: form.imei || undefined,
          storage: form.storage || undefined,
          warna: form.warna || undefined,
          garansi: form.garansi || undefined,
          asal: form.asal || undefined,
          harga_modal: form.harga_modal ? Number(form.harga_modal) : undefined,
          tanggal_masuk: form.tanggal_masuk || undefined,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Gagal menyimpan");
      setOpen(false);
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function removeRow(id: number) {
    if (!confirm("Hapus stok ini?")) return;
    const res = await fetch("/api/stok", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const json = await res.json();
    if (!json.ok) {
      alert(json.error || "Gagal menghapus");
      return;
    }
    await load();
  }

  return (
    <div className="max-w-6xl px-4 py-6 mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Stok Unit</h1>
        <button
          onClick={startAdd}
          className="rounded-md bg-black px-3 py-2 text-sm text-white"
        >
          + Tambah Stok
        </button>
      </div>

      {/* Filters ringkas */}
      <div className="mb-4 flex gap-2 flex-wrap">
        <select
          className="rounded-md border px-2 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as "" | Status)}
        >
          <option value="">Semua status</option>
          <option value="READY">READY</option>
          <option value="SOLD">SOLD</option>
        </select>
        <input
          className="rounded-md border px-3 py-2 text-sm min-w-[260px]"
          placeholder="Cari (produk/SN/IMEI/storage/warna)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          type="date"
          className="rounded-md border px-3 py-2 text-sm"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <input
          type="date"
          className="rounded-md border px-3 py-2 text-sm"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <button
          onClick={load}
          className="rounded-md border px-3 py-2 text-sm"
        >
          Terapkan
        </button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Produk</th>
              <th className="p-2 text-left">SN</th>
              <th className="p-2 text-left">IMEI</th>
              <th className="p-2 text-left">Varian</th>
              <th className="p-2 text-left">Garansi</th>
              <th className="p-2 text-left">Asal</th>
              <th className="p-2 text-right">Modal</th>
              <th className="p-2 text-left">Tgl Masuk</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3 text-center" colSpan={10}>
                  Memuat...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-3 text-center" colSpan={10}>
                  Tidak ada data.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.nama_produk}</td>
                  <td className="p-2">{r.sn || "-"}</td>
                  <td className="p-2">{r.imei || "-"}</td>
                  <td className="p-2">{[r.storage, r.warna].filter(Boolean).join(" / ") || "-"}</td>
                  <td className="p-2">{r.garansi || "-"}</td>
                  <td className="p-2">{r.asal || "-"}</td>
                  <td className="p-2 text-right">
                    {r.harga_modal != null ? r.harga_modal.toLocaleString("id-ID") : "-"}
                  </td>
                  <td className="p-2">{(r.tanggal_masuk ?? "").slice(0, 10) || "-"}</td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(r)}
                        className="rounded border px-2 py-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeRow(r.id)}
                        className="rounded border border-red-400 px-2 py-1 text-red-600"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center z-50">
          <div className="w-[720px] max-w-[92vw] rounded-md bg-white p-4 shadow">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-base font-semibold">
                {mode === "add" ? "Tambah Stok" : "Edit Stok"}
              </div>
              <button onClick={() => setOpen(false)} className="text-sm opacity-70">Tutup</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                value={form.nama_produk}
                onChange={(v) => setForm((s) => ({ ...s, nama_produk: v }))}
                placeholder="Nama produk *"
              />
              <Input
                value={form.sn}
                onChange={(v) => setForm((s) => ({ ...s, sn: v }))}
                placeholder="SN"
              />

              <Input
                value={form.imei}
                onChange={(v) => setForm((s) => ({ ...s, imei: v }))}
                placeholder="IMEI"
              />
              <Input
                value={form.storage}
                onChange={(v) => setForm((s) => ({ ...s, storage: v }))}
                placeholder="Storage"
              />

              <Input
                value={form.warna}
                onChange={(v) => setForm((s) => ({ ...s, warna: v }))}
                placeholder="Warna"
              />
              <Input
                value={form.garansi}
                onChange={(v) => setForm((s) => ({ ...s, garansi: v }))}
                placeholder="Garansi"
              />

              <Input
                value={form.asal}
                onChange={(v) => setForm((s) => ({ ...s, asal: v }))}
                placeholder="Asal produk"
              />
              <Input
                value={form.harga_modal}
                onChange={(v) => setForm((s) => ({ ...s, harga_modal: v }))}
                placeholder="Harga modal"
                type="number"
              />

              <input
                type="date"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={form.tanggal_masuk}
                onChange={(e) => setForm((s) => ({ ...s, tanggal_masuk: e.target.value }))}
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded border px-3 py-2 text-sm"
                disabled={saving}
              >
                Batal
              </button>
              {mode === "edit" ? (
                <button
                  onClick={submitEdit}
                  disabled={saving}
                  className="rounded bg-black px-3 py-2 text-sm text-white"
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              ) : (
                <button
                  onClick={submitAdd}
                  disabled={saving}
                  className="rounded bg-black px-3 py-2 text-sm text-white"
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Input(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "number";
}) {
  return (
    <input
      type={props.type ?? "text"}
      className="w-full rounded-md border px-3 py-2 text-sm"
      placeholder={props.placeholder}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
    />
  );
}
