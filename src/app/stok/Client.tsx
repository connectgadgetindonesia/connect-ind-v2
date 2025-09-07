"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

/* =======================
   Tipe Data
======================= */
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
  tanggal_masuk: string | null; // YYYY-MM-DD
  status: "READY" | "SOLD" | string;
};

type ListResp = {
  ok: boolean;
  data: StokRow[];
  page: number;
  pageSize: number;
  total: number;
};

type ApiResp =
  | { ok: true }
  | { ok: false; error?: string };

/* =======================
   Helper
======================= */
async function parseJsonSafe<T = unknown>(res: Response): Promise<T | null> {
  const text = await res.text();
  try {
    return text ? (JSON.parse(text) as T) : null;
  } catch {
    return null;
  }
}

function fmtCurrency(n: number | null | undefined) {
  if (n == null) return "-";
  try {
    return new Intl.NumberFormat("id-ID").format(n);
  } catch {
    return String(n);
  }
}

/* =======================
   Komponen Input Kecil
======================= */
type InputProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
};
function Input({ value, onChange, placeholder, type = "text" }: InputProps) {
  return (
    <input
      className="w-full rounded border px-3 py-2"
      placeholder={placeholder}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/* =======================
   State Form
======================= */
type FormState = {
  id?: number;
  nama_produk: string;
  sn: string;
  imei: string;
  storage: string;
  warna: string;
  garansi: string;
  asal: string;
  harga_modal: string;
  tanggal_masuk: string; // YYYY-MM-DD
};

const emptyForm: FormState = {
  nama_produk: "",
  sn: "",
  imei: "",
  storage: "",
  warna: "",
  garansi: "",
  asal: "",
  harga_modal: "",
  tanggal_masuk: "",
};

/* =======================
   Modal Wrapper
======================= */
type ModalProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};
function Modal({ title, open, onClose, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
      <div className="w-[680px] max-w-[92vw] rounded-lg bg-white shadow p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-lg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm opacity-70 hover:opacity-100"
          >
            Tutup ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* =======================
   MAIN CLIENT
======================= */
export default function Client() {
  const [rows, setRows] = useState<StokRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [f, setF] = useState<FormState>(emptyForm);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stok", { cache: "no-store" });
      const data = (await parseJsonSafe<ListResp>(res)) as ListResp | null;
      if (!res.ok || !data?.ok) throw new Error(data?.data ? "Gagal memuat" : "Gagal memuat");
      setRows(data.data);
    } catch (e) {
      console.error(e);
      setRows([]);
      // biarkan diam, UI sudah menampilkan kosong
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /* ------ tambah ------ */
  const openAdd = () => {
    setF(emptyForm);
    setAddOpen(true);
  };

  const saveNew = async () => {
    try {
      setSaving(true);

      const payload = {
        nama_produk: f.nama_produk || null,
        sn: f.sn || null,
        imei: f.imei || null,
        storage: f.storage || null,
        warna: f.warna || null,
        garansi: f.garansi || null,
        asal: f.asal || null,
        harga_modal: f.harga_modal ? Number(f.harga_modal) : null,
        tanggal_masuk: f.tanggal_masuk || null,
      };

      const res = await fetch("/api/stok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await parseJsonSafe<ApiResp>(res)) as ApiResp | null;
      if (!res.ok || !data?.ok) throw new Error((data as { error?: string })?.error || res.statusText);

      setAddOpen(false);
      await load();
    } catch (e) {
      alert((e as Error).message || "Gagal menyimpan stok.");
    } finally {
      setSaving(false);
    }
  };

  /* ------ edit ------ */
  const openEdit = (r: StokRow) => {
    setF({
      id: r.id,
      nama_produk: r.nama_produk || "",
      sn: r.sn || "",
      imei: r.imei || "",
      storage: r.storage || "",
      warna: r.warna || "",
      garansi: r.garansi || "",
      asal: r.asal || "",
      harga_modal: r.harga_modal != null ? String(r.harga_modal) : "",
      tanggal_masuk: r.tanggal_masuk || "",
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    try {
      if (!f.id) {
        alert("id wajib");
        return;
      }
      setSaving(true);

      const payload = {
        id: f.id, // wajib
        nama_produk: f.nama_produk || null,
        sn: f.sn || null,
        imei: f.imei || null,
        storage: f.storage || null,
        warna: f.warna || null,
        garansi: f.garansi || null,
        asal: f.asal || null,
        harga_modal: f.harga_modal ? Number(f.harga_modal) : null,
        tanggal_masuk: f.tanggal_masuk || null,
      };

      const res = await fetch("/api/stok", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await parseJsonSafe<ApiResp>(res)) as ApiResp | null;
      if (!res.ok || !data?.ok) throw new Error((data as { error?: string })?.error || res.statusText);

      setEditOpen(false);
      await load();
    } catch (e) {
      alert((e as Error).message || "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  /* ------ hapus ------ */
  const deleteRow = async (id: number) => {
    if (!confirm("Hapus stok ini?")) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/stok?id=${id}`, { method: "DELETE" });
      // DELETE kadang tanpa body → parse aman
      const data = (await parseJsonSafe<ApiResp>(res)) as ApiResp | null;
      if (!res.ok || !data?.ok) throw new Error((data as { error?: string })?.error || res.statusText);
      await load();
    } catch (e) {
      alert((e as Error).message || "Gagal menghapus.");
    } finally {
      setSaving(false);
    }
  };

  /* ------ render ------ */
  const empty = !loading && rows.length === 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Stok Unit</h1>
        <button
          type="button"
          onClick={openAdd}
          className="rounded bg-black text-white px-3 py-2 text-sm"
        >
          + Tambah Stok
        </button>
      </div>

      <div className="rounded border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 border">Produk</th>
              <th className="p-2 border">SN</th>
              <th className="p-2 border">IMEI</th>
              <th className="p-2 border">Varian</th>
              <th className="p-2 border">Garansi</th>
              <th className="p-2 border">Asal</th>
              <th className="p-2 border">Modal</th>
              <th className="p-2 border">Tgl Masuk</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="p-2 border">{r.nama_produk}</td>
                <td className="p-2 border">{r.sn || "-"}</td>
                <td className="p-2 border">{r.imei || "-"}</td>
                <td className="p-2 border">
                  {[
                    r.storage || undefined,
                    r.warna ? ` / ${r.warna}` : undefined,
                  ]
                    .filter(Boolean)
                    .join("") || "-"}
                </td>
                <td className="p-2 border">{r.garansi || "-"}</td>
                <td className="p-2 border">{r.asal || "-"}</td>
                <td className="p-2 border text-right">{fmtCurrency(r.harga_modal)}</td>
                <td className="p-2 border">
                  {r.tanggal_masuk ? r.tanggal_masuk : "-"}
                </td>
                <td className="p-2 border">{r.status}</td>
                <td className="p-2 border">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(r)}
                      className="rounded border px-2 py-1 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRow(r.id)}
                      className="rounded border border-red-300 text-red-600 px-2 py-1 text-xs"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {empty && (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={10}>
                  Tidak ada data.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={10}>
                  Memuat...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah */}
      <Modal title="Tambah Stok" open={addOpen} onClose={() => setAddOpen(false)}>
        <div className="grid grid-cols-2 gap-3">
          <Input value={f.nama_produk} onChange={(v) => setF({ ...f, nama_produk: v })} placeholder="Nama produk *" />
          <Input value={f.sn} onChange={(v) => setF({ ...f, sn: v })} placeholder="Serial number (SN)" />
          <Input value={f.imei} onChange={(v) => setF({ ...f, imei: v })} placeholder="IMEI" />
          <Input value={f.storage} onChange={(v) => setF({ ...f, storage: v })} placeholder="Storage" />
          <Input value={f.warna} onChange={(v) => setF({ ...f, warna: v })} placeholder="Warna" />
          <Input value={f.garansi} onChange={(v) => setF({ ...f, garansi: v })} placeholder="Garansi" />
          <Input value={f.asal} onChange={(v) => setF({ ...f, asal: v })} placeholder="Asal produk" />
          <Input value={f.harga_modal} onChange={(v) => setF({ ...f, harga_modal: v })} placeholder="Harga modal" type="number" />
          <Input value={f.tanggal_masuk} onChange={(v) => setF({ ...f, tanggal_masuk: v })} placeholder="YYYY-MM-DD" type="date" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => setAddOpen(false)}>
            Batal
          </button>
          <button
            type="button"
            onClick={saveNew}
            disabled={saving}
            className="rounded bg-black text-white px-3 py-2 text-sm disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </Modal>

      {/* Modal Edit */}
      <Modal title="Edit Stok" open={editOpen} onClose={() => setEditOpen(false)}>
        <div className="grid grid-cols-2 gap-3">
          <Input value={f.nama_produk} onChange={(v) => setF({ ...f, nama_produk: v })} placeholder="Nama produk *" />
          <Input value={f.sn} onChange={(v) => setF({ ...f, sn: v })} placeholder="Serial number (SN)" />
          <Input value={f.imei} onChange={(v) => setF({ ...f, imei: v })} placeholder="IMEI" />
          <Input value={f.storage} onChange={(v) => setF({ ...f, storage: v })} placeholder="Storage" />
          <Input value={f.warna} onChange={(v) => setF({ ...f, warna: v })} placeholder="Warna" />
          <Input value={f.garansi} onChange={(v) => setF({ ...f, garansi: v })} placeholder="Garansi" />
          <Input value={f.asal} onChange={(v) => setF({ ...f, asal: v })} placeholder="Asal produk" />
          <Input value={f.harga_modal} onChange={(v) => setF({ ...f, harga_modal: v })} placeholder="Harga modal" type="number" />
          <Input value={f.tanggal_masuk} onChange={(v) => setF({ ...f, tanggal_masuk: v })} placeholder="YYYY-MM-DD" type="date" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => setEditOpen(false)}>
            Batal
          </button>
          <button
            type="button"
            onClick={saveEdit}
            disabled={saving}
            className="rounded bg-black text-white px-3 py-2 text-sm disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
