"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  FormEvent,
} from "react";

/* =========================
   Helpers (format & fetch)
   ========================= */

function formatMoney(n: number | null | undefined) {
  if (n == null) return "-";
  return new Intl.NumberFormat("id-ID").format(n);
}

// "2025-09-07" -> "07/09/2025"
function isoToDmy(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear());
  return `${dd}/${mm}/${yy}`;
}

// "07/09/2025" -> "2025-09-07"
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

/* =========================
   Types
   ========================= */

type Row = {
  id: number;
  nama_produk: string | null;
  sn: string | null; // boleh kosong / IMEI di UI
  imei?: string | null; // jika kolom ada, tidak wajib
  storage: string | null;
  warna: string | null;
  garansi: string | null;
  asal_produk: string | null;
  harga_modal: number | null;
  tanggal_masuk: string | null; // ISO date
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

/* =========================
   Main Client
   ========================= */

export default function Client() {
  // filters
  const [status, setStatus] = useState<"ALL" | "READY" | "SOLD">("ALL");
  const [q, setQ] = useState<string>("");
  const [from, setFrom] = useState<string>(""); // dd/mm/yyyy
  const [to, setTo] = useState<string>(""); // dd/mm/yyyy
  const [page, setPage] = useState<number>(1);

  // data
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // modal states
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const pageSize = 10;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  // loader
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
      console.error(e);
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [status, q, from, to, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetFilters() {
    setStatus("ALL");
    setQ("");
    setFrom("");
    setTo("");
    setPage(1);
  }

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
          onChange={(e) => {
            setStatus(e.target.value as "ALL" | "READY" | "SOLD");
            setPage(1);
          }}
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
          className="border rounded px-3 py-2 text-sm w-[140px]"
        />
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="dd/mm/yyyy"
          className="border rounded px-3 py-2 text-sm w-[140px]"
        />

        <button
          onClick={() => setPage(1)}
          className="border rounded px-3 py-2 text-sm"
        >
          Terapkan
        </button>
        <button onClick={resetFilters} className="text-sm underline ml-2">
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="border rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="[&>th]:text-left [&>th]:p-2 border-b bg-gray-50">
              <th>Produk</th>
              <th>SN / IMEI</th>
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
                <td className="p-3 text-center" colSpan={9}>
                  Memuat...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-3 text-center" colSpan={9}>
                  Tidak ada data.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="[&>td]:p-2 border-t">
                  <td>{r.nama_produk || "-"}</td>
                  <td>{r.sn || "-"}</td>
                  <td>{r.storage || "-"}</td>
                  <td>{r.garansi || "-"}</td>
                  <td>{r.asal_produk || "-"}</td>
                  <td className="text-right">{formatMoney(r.harga_modal)}</td>
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
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>

      {/* Modals */}
      {showAdd && (
        <AddModal
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            void load();
          }}
        />
      )}

      {editRow && (
        <EditModal
          row={editRow}
          onClose={() => setEditRow(null)}
          onSaved={() => {
            setEditRow(null);
            void load();
          }}
        />
      )}

      {deleting != null && (
        <DeleteModal
          id={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

/* =========================
   Add Modal
   ========================= */

function AddModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nama, setNama] = useState<string>("");
  const [sn, setSn] = useState<string>(""); // bisa IMEI
  const [storage, setStorage] = useState<string>("");
  const [warna, setWarna] = useState<string>("");
  const [garansi, setGaransi] = useState<string>("");
  const [asal, setAsal] = useState<string>("");
  const [modal, setModal] = useState<string>("");
  const [tgl, setTgl] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nama || !modal) {
      alert("Nama produk & harga modal wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const body = {
        nama_produk: nama,
        sn,
        storage,
        warna,
        garansi,
        asal_produk: asal,
        harga_modal: Number(modal),
        tanggal_masuk: dmyToISO(tgl),
      };
      const resp = await fetchJSON<MutResp>("/api/stok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        throw new Error(resp.error || "Gagal menambahkan stok");
      }
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
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Nama produk *"
            className="w-full rounded border px-3 py-2"
          />
          <input
            value={sn}
            onChange={(e) => setSn(e.target.value)}
            placeholder="Serial number / IMEI"
            className="w-full rounded border px-3 py-2"
          />
          <input
            value={storage}
            onChange={(e) => setStorage(e.target.value)}
            placeholder="Storage"
            className="w-full rounded border px-3 py-2"
          />
          <input
            value={warna}
            onChange={(e) => setWarna(e.target.value)}
            placeholder="Warna"
            className="w-full rounded border px-3 py-2"
          />
          <input
            value={garansi}
            onChange={(e) => setGaransi(e.target.value)}
            placeholder="Garansi"
            className="w-full rounded border px-3 py-2"
          />
          <input
            value={asal}
            onChange={(e) => setAsal(e.target.value)}
            placeholder="Asal produk"
            className="w-full rounded border px-3 py-2"
          />
          <input
            value={modal}
            onChange={(e) => setModal(e.target.value)}
            placeholder="Harga modal *"
            inputMode="numeric"
            className="w-full rounded border px-3 py-2"
          />
          <input
            value={tgl}
            onChange={(e) => setTgl(e.target.value)}
            placeholder="dd/mm/yyyy"
            className="w-full rounded border px-3 py-2"
          />

          <div className="col-span-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border px-4 py-2 rounded"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================
   Edit Modal
   ========================= */

function EditModal({
  row,
  onClose,
  onSaved,
}: {
  row: Row;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nama, setNama] = useState<string>(row.nama_produk ?? "");
  const [sn, setSn] = useState<string>(row.sn ?? "");
  const [storage, setStorage] = useState<string>(row.storage ?? "");
  const [warna, setWarna] = useState<string>(row.warna ?? "");
  const [garansi, setGaransi] = useState<string>(row.garansi ?? "");
  const [asal, setAsal] = useState<string>(row.asal_produk ?? "");
  const [modal, setModal] = useState<string>(
    row.harga_modal != null ? String(row.harga_modal) : ""
  );
  const [tgl, setTgl] = useState<string>(isoToDmy(row.tanggal_masuk));
  const [saving, setSaving] = useState<boolean>(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nama || !modal) {
      alert("Nama produk & harga modal wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const body = {
        nama_produk: nama,
        sn,
        storage,
        warna,
        garansi,
        asal_produk: asal,
        harga_modal: Number(modal),
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
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Nama produk *"
            className="w-full rounded border px-3 py-2"
          />
          <input
            value={sn}
            onChange={(e) => setSn(e.target.value)}
            placeholder="IMEI / SN"
            className="w-full rounded border px-3 py-2"
          />
          <input
            value={storage}
            onChange={(e) => setStorage(e.target.value)}
            placeholder="Storage"
            className="w-full rounded border px-3 py-2"
          />
          <input
            value={warna}
            onChange={(e) => setWarna(e.target.value)}
            placeholder="Warna"
            className="w-full rounded border px-3 py-2"
          />
          <input
            value={garansi}
            onChange={(e) => setGaransi(e.target.value)}
            placeholder="Garansi"
            className="w-full rounded border px-3 py-2"
          />
          <input
            value={asal}
            onChange={(e) => setAsal(e.target.value)}
            placeholder="Asal produk"
            className="w-full rounded border px-3 py-2"
          />
          <input
            value={modal}
            onChange={(e) => setModal(e.target.value)}
            placeholder="Harga modal *"
            inputMode="numeric"
            className="w-full rounded border px-3 py-2"
          />
          <input
            value={tgl}
            onChange={(e) => setTgl(e.target.value)}
            placeholder="dd/mm/yyyy"
            className="w-full rounded border px-3 py-2"
          />

          <div className="col-span-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border px-4 py-2 rounded"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================
   Delete Modal
   ========================= */

function DeleteModal({
  id,
  onClose,
  onDeleted,
}: {
  id: number;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState<boolean>(false);

  async function doDelete() {
    setBusy(true);
    try {
      const resp = await fetchJSON<MutResp>(`/api/stok?id=${id}`, {
        method: "DELETE",
      });
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
        <p className="text-sm mb-4">
          Yakin ingin menghapus item ini? Tindakan ini tidak bisa dibatalkan.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="border px-4 py-2 rounded">
            Batal
          </button>
          <button
            onClick={doDelete}
            disabled={busy}
            className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {busy ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}
