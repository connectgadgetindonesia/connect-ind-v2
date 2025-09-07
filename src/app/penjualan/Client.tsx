"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Row = {
  id: number;
  tanggal: string;
  nama_produk: string;
  sn_sku: string;
  harga_jual: number;
  harga_modal: number | null;
  laba: number | null;
  dilayani_oleh: string | null;
  referal: string | null;
};

export default function Client() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ---- table & filter ----
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    return sp.toString();
  }, [q, from, to]);

  useEffect(() => {
    let abort = false;
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/penjualan${query ? `?${query}` : ""}`);
      const data = await res.json();
      if (!abort) {
        setRows(data?.data ?? []);
        setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, [query]);

  // ---- modal open/close via ?aksi=tambah ----
  const aksi = searchParams.get("aksi");
  const open = aksi === "tambah";

  const openModal = () => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("aksi", "tambah");
    router.push(`/penjualan?${sp.toString()}`, { scroll: false });
  };

  const closeModal = () => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("aksi");
    const qs = sp.toString();
    router.push(qs ? `/penjualan?${qs}` : "/penjualan", { scroll: false });
  };

  const reload = () => setQ((s) => s); // trigger re-fetch

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Penjualan</h1>
        <button
          onClick={openModal}
          className="rounded-md bg-black px-4 py-2 text-white hover:opacity-90"
        >
          Tambah Penjualan
        </button>
      </div>

      {/* Filter */}
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari (produk/SN/IMEI/pelayan)"
          className="h-9 w-72 rounded border px-3"
        />
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="h-9 rounded border px-3"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="h-9 rounded border px-3"
        />
        <button
          onClick={() => reload()}
          className="h-9 rounded border px-3 hover:bg-gray-50"
        >
          Terapkan
        </button>
      </div>

      <div className="overflow-hidden rounded border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Tanggal</th>
              <th className="p-2 text-left">Produk</th>
              <th className="p-2 text-left">SN / IMEI</th>
              <th className="p-2 text-right">Harga Jual</th>
              <th className="p-2 text-right">Modal</th>
              <th className="p-2 text-right">Laba</th>
              <th className="p-2 text-left">Dilayani</th>
              <th className="p-2 text-left">Referal</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3 text-center" colSpan={8}>
                  Memuat...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-3 text-center" colSpan={8}>
                  Tidak ada data.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{new Date(r.tanggal).toLocaleDateString()}</td>
                  <td className="p-2">{r.nama_produk}</td>
                  <td className="p-2">{r.sn_sku}</td>
                  <td className="p-2 text-right">{formatIDR(r.harga_jual)}</td>
                  <td className="p-2 text-right">
                    {r.harga_modal == null ? "-" : formatIDR(r.harga_modal)}
                  </td>
                  <td className="p-2 text-right">
                    {r.laba == null ? "-" : formatIDR(r.laba)}
                  </td>
                  <td className="p-2">{r.dilayani_oleh ?? "-"}</td>
                  <td className="p-2">{r.referal ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open && <TambahPenjualanModal onClose={closeModal} onSaved={reload} />}
    </div>
  );
}

function formatIDR(n: number) {
  try {
    return new Intl.NumberFormat("id-ID").format(n);
  } catch {
    return String(n);
  }
}

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function TambahPenjualanModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [jenis, setJenis] = useState<"UNIT" | "AKSESORIS">("UNIT");
  const [invoice, setInvoice] = useState<string>(
    `INV-${Date.now().toString().slice(-8)}`
  );
  const [tanggal, setTanggal] = useState<string>(todayISO());
  const [snSku, setSnSku] = useState<string>("");
  const [namaProduk, setNamaProduk] = useState<string>("");
  const [warna, setWarna] = useState<string>("");
  const [storage, setStorage] = useState<string>("");
  const [garansi, setGaransi] = useState<string>("");
  const [pembeli, setPembeli] = useState<string>("");
  const [alamat, setAlamat] = useState<string>("");
  const [noWa, setNoWa] = useState<string>("");
  const [hargaJual, setHargaJual] = useState<number>(0);
  const [referal, setReferal] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      invoice_id: invoice,
      jenis,
      sn_sku: snSku.trim(),
      tanggal,
      nama_pembeli: pembeli || null,
      alamat: alamat || null,
      no_wa: noWa || null,
      nama_produk: namaProduk,
      warna: warna || null,
      storage: storage || null,
      garansi: garansi || null,
      harga_jual: Number(hargaJual),
      referal: referal || null,
    };

    const res = await fetch("/api/penjualan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data: { ok?: boolean; error?: string } = await res.json();
    setSubmitting(false);

    if (!res.ok || !data.ok) {
      setError(data.error ?? "Gagal menyimpan penjualan.");
      return;
    }

    onClose();
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl rounded-lg bg-white">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-medium">Tambah Penjualan</h2>
          <button onClick={onClose} className="opacity-70 hover:opacity-100">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 px-4 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Invoice *</label>
              <input value={invoice} onChange={(e) => setInvoice(e.target.value)} className="w-full rounded border px-3 py-2" required />
            </div>
            <div>
              <label className="mb-1 block text-sm">Tanggal *</label>
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full rounded border px-3 py-2" required />
            </div>
            <div>
              <label className="mb-1 block text-sm">Jenis *</label>
              <select value={jenis} onChange={(e) => setJenis(e.target.value as "UNIT" | "AKSESORIS")} className="w-full rounded border px-3 py-2" required>
                <option value="UNIT">UNIT</option>
                <option value="AKSESORIS">AKSESORIS</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm">SN / SKU *</label>
              <input value={snSku} onChange={(e) => setSnSku(e.target.value)} className="w-full rounded border px-3 py-2" placeholder="Contoh: IMEI / SN / SKU" required />
            </div>
            <div>
              <label className="mb-1 block text-sm">Nama produk *</label>
              <input value={namaProduk} onChange={(e) => setNamaProduk(e.target.value)} className="w-full rounded border px-3 py-2" required />
            </div>
            <div>
              <label className="mb-1 block text-sm">Harga jual *</label>
              <input type="number" min={0} value={Number.isNaN(hargaJual) ? 0 : hargaJual} onChange={(e) => setHargaJual(Number(e.target.value))} className="w-full rounded border px-3 py-2" required />
            </div>
            <div>
              <label className="mb-1 block text-sm">Warna</label>
              <input value={warna} onChange={(e) => setWarna(e.target.value)} className="w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-sm">Storage</label>
              <input value={storage} onChange={(e) => setStorage(e.target.value)} className="w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-sm">Garansi</label>
              <input value={garansi} onChange={(e) => setGaransi(e.target.value)} className="w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-sm">Nama pembeli</label>
              <input value={pembeli} onChange={(e) => setPembeli(e.target.value)} className="w-full rounded border px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-sm">No. WA</label>
              <input value={noWa} onChange={(e) => setNoWa(e.target.value)} className="w-full rounded border px-3 py-2" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm">Alamat</label>
              <input value={alamat} onChange={(e) => setAlamat(e.target.value)} className="w-full rounded border px-3 py-2" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm">Referal</label>
              <input value={referal} onChange={(e) => setReferal(e.target.value)} className="w-full rounded border px-3 py-2" placeholder="(opsional)" />
            </div>
          </div>

          {error && (
            <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded border px-4 py-2 hover:bg-gray-50">Batal</button>
            <button type="submit" disabled={submitting} className="rounded bg-black px-4 py-2 text-white hover:opacity-90 disabled:opacity-60">
              {submitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
