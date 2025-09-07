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
    }
  }, [page, pageSize, status, q, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  // ---------- Add Modal ----------
  const [openAdd, setOpenAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  // form state
  const [fNama, setFNama] = useState("");
  const [fSN, setFSN] = useState("");
  const [fIMEI, setFIMEI] = useState("");
  const [fStorage, setFStorage] = useState("");
  const [fWarna, setFWarna] = useState("");
  const [fGaransi, setFGaransi] = useState("");
  const [fAsal, setFAsal] = useState("");
  const [fModal, setFModal] = useState<number | "">("");
  const [fTgl, setFTgl] = useState(() => new Date().toISOString().slice(0, 10)); // yyyy-mm-dd

  const resetForm = () => {
    setFNama("");
    setFSN("");
    setFIMEI("");
    setFStorage("");
    setFWarna("");
    setFGaransi("");
    setFAsal("");
    setFModal("");
    setFTgl(new Date().toISOString().slice(0, 10));
  };

  const submitAdd = async () => {
    if (!fNama || !fModal || !fTgl) {
      alert("Nama produk, harga modal, dan tanggal masuk wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/stok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_produk: fNama,
          serial_number: fSN || null,
          imei: fIMEI || null,
          storage: fStorage || null,
          warna: fWarna || null,
          garansi: fGaransi || null,
          asal_produk: fAsal || null,
          harga_modal: Number(fModal),
          tanggal_masuk: fTgl,
        }),
      });
      const j: { ok: boolean; error?: string } = await res.json();
      if (!j.ok) {
        alert(j.error || "Gagal menyimpan stok.");
        return;
      }
      setOpenAdd(false);
      resetForm();
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
        <h1 className="text-xl font-semibold">Stok Unit</h1>
        <button
          className="bg-black text-white rounded-md px-4 py-2"
          onClick={() => setOpenAdd(true)}
        >
          + Tambah Stok
        </button>
      </div>

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

      {/* Modal Tambah */}
      {openAdd && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Tambah Stok</h2>
              <button onClick={() => setOpenAdd(false)} className="text-sm text-neutral-600">
                ✕ Tutup
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <input className="border rounded-md px-3 py-2" placeholder="Nama produk *" value={fNama} onChange={(e) => setFNama(e.target.value)} />
              <input className="border rounded-md px-3 py-2" placeholder="Serial number" value={fSN} onChange={(e) => setFSN(e.target.value)} />
              <input className="border rounded-md px-3 py-2" placeholder="IMEI" value={fIMEI} onChange={(e) => setFIMEI(e.target.value)} />
              <input className="border rounded-md px-3 py-2" placeholder="Storage" value={fStorage} onChange={(e) => setFStorage(e.target.value)} />
              <input className="border rounded-md px-3 py-2" placeholder="Warna" value={fWarna} onChange={(e) => setFWarna(e.target.value)} />
              <input className="border rounded-md px-3 py-2" placeholder="Garansi" value={fGaransi} onChange={(e) => setFGaransi(e.target.value)} />
              <input className="border rounded-md px-3 py-2" placeholder="Asal produk" value={fAsal} onChange={(e) => setFAsal(e.target.value)} />
              <input className="border rounded-md px-3 py-2" type="number" placeholder="Harga modal *" value={fModal} onChange={(e) => setFModal(e.target.value === "" ? "" : Number(e.target.value))} />
              <input className="border rounded-md px-3 py-2" type="date" value={fTgl} onChange={(e) => setFTgl(e.target.value)} />
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
