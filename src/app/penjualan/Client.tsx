"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Row = {
  id: number;
  invoice_id: string;
  tanggal: string;
  jenis: "UNIT" | "AKSESORIS";
  sn_sku: string;
  nama_produk: string;
  warna: string | null;
  storage: string | null;
  harga_modal: number | null;
  harga_jual: number;
  laba: number | null;
  dilayani_oleh: string | null;
  referal: string | null;
  nama_pembeli: string | null;
};

export default function PenjualanClient() {
  const sp = useSearchParams();

  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState(sp.get("q") || "");
  const [from, setFrom] = useState(sp.get("from") || "");
  const [to, setTo] = useState(sp.get("to") || "");
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const u = new URL("/api/penjualan", window.location.origin);
    if (q) u.searchParams.set("q", q);
    if (from) u.searchParams.set("from", from);
    if (to) u.searchParams.set("to", to);
    const r = await fetch(u.toString(), { cache: "no-store" });
    const j = await r.json();
    setRows(j.data || []);
    setLoading(false);
  }, [q, from, to]);

  useEffect(() => { reload(); }, [reload]);

  // modal tambah
  const [openAdd, setOpenAdd] = useState(false);
  const [add, setAdd] = useState({
    invoice_id: "",
    jenis: "UNIT" as "UNIT"|"AKSESORIS",
    sn_sku: "",
    tanggal: "",
    nama_pembeli: "",
    nama_produk: "",
    warna: "",
    storage: "",
    garansi: "",
    harga_jual: "",
    referal: "",
  });

  // modal edit
  const [openEdit, setOpenEdit] = useState(false);
  const [edit, setEdit] = useState({
    id: 0,
    tanggal: "",
    nama_pembeli: "",
    harga_jual: "",
    referal: "",
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Penjualan</h1>
        <button className="rounded bg-black px-3 py-2 text-sm text-white" onClick={()=>setOpenAdd(true)}>
          Tambah Penjualan
        </button>
      </div>

      {/* filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        <input className="w-64 rounded border px-3 py-2" placeholder="Cari (produk/SN/IMEI/pelayan)"
          value={q} onChange={e=>setQ(e.target.value)} />
        <input type="date" className="rounded border px-3 py-2" value={from} onChange={e=>setFrom(e.target.value)} />
        <input type="date" className="rounded border px-3 py-2" value={to} onChange={e=>setTo(e.target.value)} />
        <button className="rounded border px-3 py-2" onClick={reload}>Terapkan</button>
      </div>

      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 border">Tanggal</th>
              <th className="p-2 border text-left">Produk</th>
              <th className="p-2 border">SN / IMEI</th>
              <th className="p-2 border">Pembeli</th>
              <th className="p-2 border text-right">Harga Jual</th>
              <th className="p-2 border text-right">Modal</th>
              <th className="p-2 border text-right">Laba</th>
              <th className="p-2 border">Dilayani</th>
              <th className="p-2 border">Referal</th>
              <th className="p-2 border text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-3 text-center" colSpan={10}>Memuat...</td></tr>}
            {!loading && rows.length === 0 && <tr><td className="p-3 text-center" colSpan={10}>Tidak ada data.</td></tr>}
            {rows.map(r=>(
              <tr key={r.id}>
                <td className="p-2 border">{r.tanggal?.slice(0,10)}</td>
                <td className="p-2 border">{r.nama_produk}</td>
                <td className="p-2 border">{r.sn_sku}</td>
                <td className="p-2 border">{r.nama_pembeli || "-"}</td>
                <td className="p-2 border text-right">{r.harga_jual.toLocaleString("id-ID")}</td>
                <td className="p-2 border text-right">{(r.harga_modal ?? 0).toLocaleString("id-ID")}</td>
                <td className="p-2 border text-right">{(r.laba ?? 0).toLocaleString("id-ID")}</td>
                <td className="p-2 border">{r.dilayani_oleh || "-"}</td>
                <td className="p-2 border">{r.referal || "-"}</td>
                <td className="p-2 border text-center">
                  <button
                    className="mr-2 rounded border px-2 py-1 text-xs"
                    onClick={()=>{
                      setEdit({
                        id: r.id,
                        tanggal: r.tanggal.slice(0,10),
                        nama_pembeli: r.nama_pembeli || "",
                        harga_jual: String(r.harga_jual),
                        referal: r.referal || "",
                      });
                      setOpenEdit(true);
                    }}
                  >Edit</button>
                  <button
                    className="rounded border px-2 py-1 text-xs text-red-600"
                    onClick={async ()=>{
                      if (!confirm("Hapus penjualan ini?")) return;
                      const res = await fetch(`/api/penjualan?id=${r.id}`, { method: "DELETE" });
                      const j = await res.json();
                      if (!j.ok) { alert(j.error || "Gagal hapus"); return; }
                      reload();
                    }}
                  >Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL TAMBAH */}
      {openAdd && (
        <Modal title="Tambah Penjualan" onClose={()=>setOpenAdd(false)}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input value={add.invoice_id} placeholder="Invoice ID *" onChange={v=>setAdd({...add, invoice_id:v})}/>
            <select className="rounded border px-3 py-2" value={add.jenis} onChange={e=>setAdd({...add, jenis: e.target.value as "UNIT"|"AKSESORIS"})}>
              <option value="UNIT">UNIT</option>
              <option value="AKSESORIS">AKSESORIS</option>
            </select>
            <Input value={add.sn_sku} placeholder="SN (UNIT) / SKU (AKSESORIS) *" onChange={v=>setAdd({...add, sn_sku:v})}/>
            <Input value={add.tanggal} type="date" onChange={v=>setAdd({...add, tanggal:v})}/>
            <Input value={add.nama_produk} placeholder="Nama produk *" onChange={v=>setAdd({...add, nama_produk:v})}/>
            <Input value={add.harga_jual} placeholder="Harga jual *" onChange={v=>setAdd({...add, harga_jual:v.replace(/[^\d]/g,"")})}/>
            <Input value={add.nama_pembeli} placeholder="Nama pembeli" onChange={v=>setAdd({...add, nama_pembeli:v})}/>
            <Input value={add.referal} placeholder="Referal" onChange={v=>setAdd({...add, referal:v})}/>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="rounded border px-4 py-2" onClick={()=>setOpenAdd(false)}>Batal</button>
            <button
              className="rounded bg-black px-4 py-2 text-white"
              onClick={async ()=>{
                const r = await fetch("/api/penjualan", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({
                  ...add, harga_jual: Number(add.harga_jual||0) || 0,
                })});
                const j = await r.json();
                if (!j.ok) { alert(j.error || "Gagal simpan"); return; }
                setOpenAdd(false);
                setAdd({ invoice_id:"", jenis:"UNIT", sn_sku:"", tanggal:"", nama_pembeli:"", nama_produk:"", warna:"", storage:"", garansi:"", harga_jual:"", referal:"" });
                reload();
              }}
            >Simpan</button>
          </div>
        </Modal>
      )}

      {/* MODAL EDIT */}
      {openEdit && (
        <Modal title="Edit Penjualan" onClose={()=>setOpenEdit(false)}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input value={edit.tanggal} type="date" onChange={v=>setEdit({...edit, tanggal:v})}/>
            <Input value={edit.nama_pembeli} placeholder="Nama pembeli" onChange={v=>setEdit({...edit, nama_pembeli:v})}/>
            <Input value={edit.harga_jual} placeholder="Harga jual" onChange={v=>setEdit({...edit, harga_jual:v.replace(/[^\d]/g,"")})}/>
            <Input value={edit.referal} placeholder="Referal" onChange={v=>setEdit({...edit, referal:v})}/>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="rounded border px-4 py-2" onClick={()=>setOpenEdit(false)}>Batal</button>
            <button
              className="rounded bg-black px-4 py-2 text-white"
              onClick={async ()=>{
                const r = await fetch("/api/penjualan", { method:"PATCH", headers:{ "content-type":"application/json" }, body: JSON.stringify({
                  ...edit, harga_jual: Number(edit.harga_jual||0)
                })});
                const j = await r.json();
                if (!j.ok) { alert(j.error || "Gagal simpan"); return; }
                setOpenEdit(false); reload();
              }}
            >Simpan</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* kecil2 */
function Modal(props: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">{props.title}</h2>
          <button onClick={props.onClose} className="text-sm opacity-70">Tutup</button>
        </div>
        {props.children}
      </div>
    </div>
  );
}
function Input(
  { value, onChange, placeholder, type = "text" }:
  { value: string; onChange: (v: string)=>void; placeholder?: string; type?: string }
) {
  return <input className="w-full rounded border px-3 py-2" type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)} />;
}
