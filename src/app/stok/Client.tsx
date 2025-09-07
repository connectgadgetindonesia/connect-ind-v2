"use client";

import React, { useCallback, useEffect, useMemo, useState, FormEvent } from "react";

/* ===== Helpers ===== */
function rupiah(n?: number | null) {
  if (n == null) return "-";
  return new Intl.NumberFormat("id-ID").format(n);
}
function isoToDmy(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}
function dmyToISO(dmy?: string) {
  if (!dmy) return undefined;
  const [dd, mm, yyyy] = dmy.split("/");
  if (!dd || !mm || !yyyy) return undefined;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}
async function fetchJSON<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const json = (await res.json()) as T;
  return json;
}

/* ===== Types ===== */
type Status = "ALL" | "READY" | "SOLD";

type Row = {
  id: number;
  nama_produk: string | null;
  sn: string | null;
  imei: string | null;
  storage: string | null;
  warna: string | null;
  garansi: string | null;
  asal_produk: string | null;
  harga_modal: number | null;
  tanggal_masuk: string | null; // ISO
  status: string | null;
};

type ListResp = {
  ok: boolean;
  data?: Row[];
  page?: number;
  pageSize?: number;
  total?: number;
  error?: string;
};
type MutResp = { ok: boolean; id?: number; error?: string };

/* ===== Page Client ===== */
export default function Client() {
  const [status, setStatus] = useState<Status>("ALL");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState(""); // dd/mm/yyyy
  const [to, setTo] = useState(""); // dd/mm/yyyy
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const pageSize = 10;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (status !== "ALL") sp.set("status", status);
      if (q.trim()) sp.set("q", q.trim());
      const fIso = dmyToISO(from);
      const tIso = dmyToISO(to);
      if (fIso) sp.set("from", fIso);
      if (tIso) sp.set("to", tIso);
      sp.set("page", String(page));
      sp.set("pageSize", String(pageSize));

      const resp = await fetchJSON<ListResp>(`/api/stok?${sp.toString()}`);
      if (!resp.ok) throw new Error(resp.error || "Gagal memuat data");
      setRows(resp.data ?? []);
      setTotal(resp.total ?? 0);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [status, q, from, to, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const onChangeStatus = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value as Status);
    setPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Stok Unit</h1>
        <button
          className="rounded-md bg-black text-white px-3 py-2 text-sm"
          onClick={() => setShowAdd(true)}
        >
          + Tambah Stok
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={status}
          onChange={onChangeStatus}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="ALL">Semua status</option>
          <option value="READY">READY</option>
          <option value="SOLD">SOLD</option>
        </select>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari (produk/SN/IMEI/storage/warna)"
          className="border rounded px-3 py-2 text-sm w-[280px]"
        />
        <input
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="dd/mm/yyyy"
          className="border rounded px-3 py-2 text-sm w-[120px]"
        />
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="dd/mm/yyyy"
          className="border rounded px-3 py-2 text-sm w-[120px]"
        />
        <button onClick={() => setPage(1)} className="border rounded px-3 py-2 text-sm">
          Terapkan
        </button>
      </div>

      {/* Tabel */}
      <div className="border rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="[&>th]:text-left [&>th]:p-2 border-b bg-gray-50">
              <th>Produk</th>
              <th>SN</th>
              <th>IMEI</th>
              <th>Varian</th>
              <th>Garansi</th>
              <th>Asal</th>
              <th>Modal</th>
              <th>Tgl Masuk</th>
              <th>Status</th>
              <th className="text-center">Aksi</th>
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
                <tr key={r.id} className="[&>td]:p-2 border-t">
                  <td>{r.nama_produk || "-"}</td>
                  <td>{r.sn || "-"}</td>
                  <td>{r.imei || "-"}</td>
                  <td>{r.storage || "-"}</td>
                  <td>{r.garansi || "-"}</td>
                  <td>{r.asal_produk || "-"}</td>
                  <td className="text-right">{rupiah(r.harga_modal)}</td>
                  <td>{isoToDmy(r.tanggal_masuk)}</td>
                  <td>{r.status || "-"}</td>
                  <td className="text-center">
                    <div className="inline-flex gap-2">
                      <button
                        className="border px-2 py-1 rounded"
                        onClick={() => setEditRow(r)}
                      >
                        Edit
                      </button>
                      <button
                        className="border px-2 py-1 rounded text-red-600"
                        onClick={() => setDeleting(r.id)}
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

      {/* Pagination */}
      <div className="flex items-center justify-between mt-3 text-sm">
        <div>
          Total {total} data • Hal {page} / {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            className="border px-3 py-1 rounded disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <button
            className="border px-3 py-1 rounded disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Modals */}
      {showAdd && (
        <AddModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); void load(); }} />
      )}
      {editRow && (
        <EditModal row={editRow} onClose={() => setEditRow(null)} onSaved={() => { setEditRow(null); void load(); }} />
      )}
      {deleting != null && (
        <DeleteModal id={deleting} onClose={() => setDeleting(null)} onDeleted={() => { setDeleting(null); void load(); }} />
      )}
    </div>
  );
}

/* ===== Add Modal ===== */
function AddModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [nama, setNama] = useState("");
  const [sn, setSn] = useState("");
  const [imei, setImei] = useState("");
  const [storage, setStorage] = useState("");
  const [warna, setWarna] = useState("");
  const [garansi, setGaransi] = useState("");
  const [asal, setAsal] = useState("");
  const [modal, setModal] = useState("");
  const [tgl, setTgl] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nama || !modal) return alert("Nama produk & harga modal wajib diisi");
    setSaving(true);
    try {
      const body = {
        nama_produk: nama,
        sn,
        imei,
        storage,
        warna,
        garansi,
        asal_produk: asal,
        harga_modal: Number(modal || 0),
        tanggal_masuk: dmyToISO(tgl),
      };
      const resp = await fetchJSON<MutResp>("/api/stok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error(resp.error || "Gagal menambah stok");
      onSaved();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 grid place-items-center bg-black/50 z-50">
      <div className="bg-white rounded-xl p-4 w-[720px] max-w-[95vw]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Tambah Stok</h3>
          <button onClick={onClose}>Tutup</button>
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Nama produk *" value={nama} onChange={(e) => setNama(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Serial Number" value={sn} onChange={(e) => setSn(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="IMEI" value={imei} onChange={(e) => setImei(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Storage" value={storage} onChange={(e) => setStorage(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Warna" value={warna} onChange={(e) => setWarna(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Garansi" value={garansi} onChange={(e) => setGaransi(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Asal produk" value={asal} onChange={(e) => setAsal(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Harga modal *" inputMode="numeric" value={modal} onChange={(e) => setModal(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="dd/mm/yyyy" value={tgl} onChange={(e) => setTgl(e.target.value)} />

          <div className="col-span-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="border px-4 py-2 rounded">
              Batal
            </button>
            <button type="submit" className="bg-black text-white px-4 py-2 rounded disabled:opacity-50" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ===== Edit Modal ===== */
function EditModal({
  row,
  onClose,
  onSaved,
}: {
  row: Row;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nama, setNama] = useState(row.nama_produk ?? "");
  const [sn, setSn] = useState(row.sn ?? "");
  const [imei, setImei] = useState(row.imei ?? "");
  const [storage, setStorage] = useState(row.storage ?? "");
  const [warna, setWarna] = useState(row.warna ?? "");
  const [garansi, setGaransi] = useState(row.garansi ?? "");
  const [asal, setAsal] = useState(row.asal_produk ?? "");
  const [modal, setModal] = useState(
    row.harga_modal != null ? String(row.harga_modal) : ""
  );
  const [tgl, setTgl] = useState(isoToDmy(row.tanggal_masuk));
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nama || !modal) return alert("Nama produk & harga modal wajib diisi");
    setSaving(true);
    try {
      const body = {
        nama_produk: nama,
        sn,
        imei,
        storage,
        warna,
        garansi,
        asal_produk: asal,
        harga_modal: Number(modal || 0),
        tanggal_masuk: dmyToISO(tgl),
      };
      const resp = await fetchJSON<MutResp>(`/api/stok?id=${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error(resp.error || "Gagal menyimpan");
      onSaved();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 grid place-items-center bg-black/50 z-50">
      <div className="bg-white rounded-xl p-4 w-[720px] max-w-[95vw]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Edit Stok</h3>
          <button onClick={onClose}>Tutup</button>
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Nama produk *" value={nama} onChange={(e) => setNama(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Serial Number" value={sn} onChange={(e) => setSn(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="IMEI" value={imei} onChange={(e) => setImei(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Storage" value={storage} onChange={(e) => setStorage(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Warna" value={warna} onChange={(e) => setWarna(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Garansi" value={garansi} onChange={(e) => setGaransi(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Asal produk" value={asal} onChange={(e) => setAsal(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Harga modal *" inputMode="numeric" value={modal} onChange={(e) => setModal(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="dd/mm/yyyy" value={tgl} onChange={(e) => setTgl(e.target.value)} />

          <div className="col-span-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="border px-4 py-2 rounded">
              Batal
            </button>
            <button type="submit" disabled={saving} className="bg-black text-white px-4 py-2 rounded disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ===== Delete Modal ===== */
function DeleteModal({
  id,
  onClose,
  onDeleted,
}: {
  id: number;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  async function doDelete() {
    setBusy(true);
    try {
      const resp = await fetchJSON<MutResp>(`/api/stok?id=${id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error(resp.error || "Gagal menghapus");
      onDeleted();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="fixed inset-0 grid place-items-center bg-black/50 z-50">
      <div className="bg-white rounded-xl p-5 w-[420px] max-w-[95vw]">
        <h3 className="font-semibold mb-2">Hapus Data</h3>
        <p className="text-sm mb-4">Yakin ingin menghapus item ini?</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="border px-4 py-2 rounded">Batal</button>
          <button onClick={doDelete} disabled={busy} className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50">
            {busy ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}
