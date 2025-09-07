"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Row = {
  id: number;
  sku: string;
  nama_produk: string;
  warna: string | null;
  stok: number;
  harga_modal: number;
  created_at: string;
};

type Resp = {
  ok: boolean;
  data: Row[];
  page: number;
  pageSize: number;
  total: number;
  error?: string;
};

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);

export default function Client() {
  const router = useRouter();
  const sp = useSearchParams();

  const q = sp.get("q") || "";
  const page = Math.max(1, Number(sp.get("page") || 1));
  const pageSize = 10;

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  const buildURL = (next: Record<string, string | number | undefined>) => {
    const u = new URL(window.location.href);
    const p = u.searchParams;
    if (next.q !== undefined) p.set("q", String(next.q));
    if (next.page !== undefined) p.set("page", String(next.page));
    u.search = p.toString();
    return u.pathname + u.search;
  };

  useEffect(() => {
    let stop = false;
    (async () => {
      setLoading(true);
      const qs = new URLSearchParams({
        q,
        page: String(page),
        pageSize: String(pageSize),
      });
      const res = await fetch(`/api/aksesoris?${qs.toString()}`, { cache: "no-store" });
      const json: Resp = await res.json();
      if (!stop) {
        if (json.ok) {
          setRows(json.data);
          setTotal(json.total);
        } else {
          console.error(json.error);
          setRows([]);
          setTotal(0);
        }
        setLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, [q, page]);

  // modal tambah
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nama_produk: "",
    sku: "",
    warna: "",
    stok: "",
    harga_modal: "",
  });

  const submit = async () => {
    if (!form.nama_produk || !form.sku || !form.stok || !form.harga_modal) {
      alert("Nama produk, SKU, stok, dan harga modal wajib diisi");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/aksesoris", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        nama_produk: form.nama_produk,
        sku: form.sku,
        warna: form.warna || null,
        stok: Number(form.stok),
        harga_modal: Number(form.harga_modal),
      }),
    });
    const j: { ok: boolean; error?: string } = await res.json();
    setSaving(false);
    if (!j.ok) {
      alert(j.error || "Gagal menyimpan");
      return;
    }
    setOpen(false);
    setForm({ nama_produk: "", sku: "", warna: "", stok: "", harga_modal: "" });
    router.replace(buildURL({ page: 1 }));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Stok Aksesoris</h1>
        <button
          onClick={() => setOpen(true)}
          className="rounded-md bg-black px-4 py-2 text-white hover:opacity-90"
        >
          + Tambah Aksesoris
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          className="w-72 rounded-md border px-3 py-2"
          placeholder="Cari (produk/SKU/warna)"
          defaultValue={q}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const val = (e.target as HTMLInputElement).value;
              router.replace(buildURL({ q: val, page: 1 }));
            }
          }}
        />
        <button className="rounded-md border px-3 py-2" onClick={() => router.replace(buildURL({ page: 1 }))}>
          Terapkan
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="border p-2 text-left">Produk</th>
              <th className="border p-2 text-left">SKU</th>
              <th className="border p-2 text-left">Warna</th>
              <th className="border p-2 text-right">Stok</th>
              <th className="border p-2 text-right">Modal</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-4 text-center" colSpan={5}>
                  Memuat...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-4 text-center" colSpan={5}>
                  Tidak ada data.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="border p-2">{r.nama_produk}</td>
                  <td className="border p-2">{r.sku}</td>
                  <td className="border p-2">{r.warna || "-"}</td>
                  <td className="border p-2 text-right">{r.stok}</td>
                  <td className="border p-2 text-right">{rupiah(Number(r.harga_modal))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-end gap-2 text-sm">
        <span>
          Total {total} data • Hal {page} / {pages}
        </span>
        <button
          disabled={page <= 1}
          onClick={() => router.replace(buildURL({ page: page - 1 }))}
          className="rounded-md border px-3 py-1 disabled:opacity-50"
        >
          Prev
        </button>
        <button
          disabled={page >= pages}
          onClick={() => router.replace(buildURL({ page: page + 1 }))}
          className="rounded-md border px-3 py-1 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Tambah Aksesoris</h2>
              <button onClick={() => setOpen(false)} className="text-sm opacity-70">
                × Tutup
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                className="rounded-md border px-3 py-2"
                placeholder="Nama produk *"
                value={form.nama_produk}
                onChange={(e) => setForm({ ...form, nama_produk: e.target.value })}
              />
              <input
                className="rounded-md border px-3 py-2"
                placeholder="SKU *"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
              <input
                className="rounded-md border px-3 py-2"
                placeholder="Warna"
                value={form.warna}
                onChange={(e) => setForm({ ...form, warna: e.target.value })}
              />
              <input
                className="rounded-md border px-3 py-2"
                placeholder="Stok *"
                inputMode="numeric"
                value={form.stok}
                onChange={(e) =>
                  setForm({ ...form, stok: e.target.value.replace(/[^\d]/g, "") })
                }
              />
              <input
                className="rounded-md border px-3 py-2"
                placeholder="Harga modal *"
                inputMode="numeric"
                value={form.harga_modal}
                onChange={(e) =>
                  setForm({ ...form, harga_modal: e.target.value.replace(/[^\d]/g, "") })
                }
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-md border px-4 py-2" onClick={() => setOpen(false)}>
                Batal
              </button>
              <button
                className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
                onClick={submit}
                disabled={saving}
              >
                {saving ? "Menyimpan…" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
