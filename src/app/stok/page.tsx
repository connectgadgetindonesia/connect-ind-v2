"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type StokRow = {
  id: number;
  nama_produk: string | null;
  sn: string | null;
  imei: string | null;
  storage: string | null;
  warna: string | null;
  garansi: string | null;
  asal_produk: string | null;
  harga_modal: number | null;
  tanggal_masuk: string | null;
  status: "READY" | "SOLD";
};

export default function StokPage() {
  const [rows, setRows] = useState<StokRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const u = new URL("/api/stok", window.location.origin);
    if (q) u.searchParams.set("q", q);
    if (status) u.searchParams.set("status", status);
    if (from) u.searchParams.set("from", from);
    if (to) u.searchParams.set("to", to);
    const r = await fetch(u.toString(), { cache: "no-store" });
    const j = await r.json();
    setRows(j.data || []);
    setLoading(false);
  }, [q, status, from, to]);

  useEffect(() => { reload(); }, [reload]);

  // --- modal tambah ---
  const [openAdd, setOpenAdd] = useState(false);
  const [add, setAdd] = useState({
    nama_produk: "", sn: "", imei: "", storage: "", warna: "",
    garansi: "", asal_produk: "", harga_modal: "", tanggal_masuk: "",
  });

  // --- modal edit ---
  const [openEdit, setOpenEdit] = useState(false);
  const [edit, setEdit] = useState({
    id: 0,
    nama_produk: "", imei: "", storage: "", warna: "",
    garansi: "", asal_produk: "", harga_modal: "", tanggal_masuk: "",
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Stok Unit</h1>
        <button
          className="rounded bg-black px-3 py-2 text-sm text-white"
          onClick={() => setOpenAdd(true)}
        >
          + Tambah Stok
        </button>
      </div>

      {/* filter ringkas */}
      <div className="mb-4 flex flex-wrap gap-2">
        <select className="rounded border px-3 py-2" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">Semua status</option>
          <option value="READY">READY</option>
          <option value="SOLD">SOLD</option>
        </select>
        <input className="w-64 rounded border px-3 py-2" placeholder="Cari (produk/SN/IMEI/storage/warna)"
          value={q} onChange={e=>setQ(e.target.value)} />
        <input type="date" className="rounded border px-3 py-2" value={from} onChange={e=>setFrom(e.target.value)} />
        <input type="date" className="rounded border px-3 py-2" value={to} onChange={e=>setTo(e.target.value)} />
        <button className="rounded border px-3 py-2" onClick={reload}>Terapkan</button>
      </div>

      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 border text-left">Produk</th>
              <th className="p-2 border">SN / IMEI</th>
              <th className="p-2 border">Varian</th>
              <th className="p-2 border">Garansi</th>
              <th className="p-2 border">Asal</th>
              <th className="p-2 border text-right">Modal</th>
              <th className="p-2 border">Tgl Masuk</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="p-3 text-center" colSpan={9}>Memuat...</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td className="p-3 text-center" colSpan={9}>Tidak ada data.</td></tr>
            )}
            {rows.map(r => (
              <tr key={r.id}>
                <td className="p-2 border">{r.nama_produk}</td>
                <td className="p-2 border">{r.sn || r.imei}</td>
                <td className="p-2 border">{[r.storage, r.warna].filter(Boolean).join(" / ")}</td>
                <td className="p-2 border">{r.garansi || "-"}</td>
                <td className="p-2 border">{r.asal_produk || "-"}</td>
                <td className="p-2 border text-right">{r.harga_modal?.toLocaleString("id-ID")}</td>
                <td className="p-2 border">{r.tanggal_masuk?.slice(0,10) || "-"}</td>
                <td className="p-2 border">{r.status}</td>
                <td className="p-2 border text-center">
                  <button
                    className="mr-2 rounded border px-2 py-1 text-xs"
                    onClick={()=>{
                      setEdit({
                        id: r.id,
                        nama_produk: r.nama_produk || "",
                        imei: r.imei || "",
                        storage: r.storage || "",
                        warna: r.warna || "",
                        garansi: r.garansi || "",
                        asal_produk: r.asal_produk || "",
                        harga_modal: String(r.harga_modal ?? ""),
                        tanggal_masuk: r.tanggal_masuk?.slice(0,10) || "",
                      });
                      setOpenEdit(true);
                    }}
                  >Edit</button>
                  <button
                    className="rounded border px-2 py-1 text-xs text-red-600"
                    onClick={async ()=>{
                      if (!confirm("Hapus stok ini?")) return;
                      const res = await fetch(`/api/stok?id=${r.id}`, { method: "DELETE" });
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
        <Modal title="Tambah Stok" onClose={()=>setOpenAdd(false)}>
          <FormGrid>
            <Input value={add.nama_produk} placeholder="Nama produk *" onChange={v=>setAdd({...add, nama_produk:v})}/>
            <Input value={add.sn} placeholder="Serial number" onChange={v=>setAdd({...add, sn:v})}/>
            <Input value={add.imei} placeholder="IMEI" onChange={v=>setAdd({...add, imei:v})}/>
            <Input value={add.storage} placeholder="Storage" onChange={v=>setAdd({...add, storage:v})}/>
            <Input value={add.warna} placeholder="Warna" onChange={v=>setAdd({...add, warna:v})}/>
            <Input value={add.garansi} placeholder="Garansi" onChange={v=>setAdd({...add, garansi:v})}/>
            <Input value={add.asal_produk} placeholder="Asal produk" onChange={v=>setAdd({...add, asal_produk:v})}/>
            <Input value={add.harga_modal} placeholder="Harga modal *" onChange={v=>setAdd({...add, harga_modal:v.replace(/[^\d]/g,"")})}/>
            <Input value={add.tanggal_masuk} type="date" onChange={v=>setAdd({...add, tanggal_masuk:v})}/>
          </FormGrid>
          <ModalActions
            onCancel={()=>setOpenAdd(false)}
            onSave={async ()=>{
              const r = await fetch("/api/stok", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({
                ...add, harga_modal: Number(add.harga_modal||0),
              })});
              const j = await r.json();
              if (!j.ok) { alert(j.error || "Gagal simpan"); return; }
              setOpenAdd(false);
              setAdd({ nama_produk:"", sn:"", imei:"", storage:"", warna:"", garansi:"", asal_produk:"", harga_modal:"", tanggal_masuk:"" });
              reload();
            }}
          />
        </Modal>
      )}

      {/* MODAL EDIT */}
      {openEdit && (
        <Modal title="Edit Stok" onClose={()=>setOpenEdit(false)}>
          <FormGrid>
            <Input value={edit.nama_produk} placeholder="Nama produk" onChange={v=>setEdit({...edit, nama_produk:v})}/>
            <Input value={edit.imei} placeholder="IMEI" onChange={v=>setEdit({...edit, imei:v})}/>
            <Input value={edit.storage} placeholder="Storage" onChange={v=>setEdit({...edit, storage:v})}/>
            <Input value={edit.warna} placeholder="Warna" onChange={v=>setEdit({...edit, warna:v})}/>
            <Input value={edit.garansi} placeholder="Garansi" onChange={v=>setEdit({...edit, garansi:v})}/>
            <Input value={edit.asal_produk} placeholder="Asal produk" onChange={v=>setEdit({...edit, asal_produk:v})}/>
            <Input value={edit.harga_modal} placeholder="Harga modal" onChange={v=>setEdit({...edit, harga_modal:v.replace(/[^\d]/g,"")})}/>
            <Input value={edit.tanggal_masuk} type="date" onChange={v=>setEdit({...edit, tanggal_masuk:v})}/>
          </FormGrid>
          <ModalActions
            onCancel={()=>setOpenEdit(false)}
            onSave={async ()=>{
              const r = await fetch("/api/stok", { method:"PATCH", headers:{ "content-type":"application/json" }, body: JSON.stringify({
                ...edit, harga_modal: Number(edit.harga_modal||0),
              })});
              const j = await r.json();
              if (!j.ok) { alert(j.error || "Gagal simpan"); return; }
              setOpenEdit(false);
              reload();
            }}
          />
        </Modal>
      )}
    </div>
  );
}

/* ---------- kecil2 pendamping UI ---------- */
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
function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}
function Input(
  { value, onChange, placeholder, type = "text" }:
  { value: string; onChange: (v: string)=>void; placeholder?: string; type?: string }
) {
  return <input className="w-full rounded border px-3 py-2" type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)} />;
}
function ModalActions({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="mt-4 flex justify-end gap-2">
      <button className="rounded border px-4 py-2" onClick={onCancel}>Batal</button>
      <button className="rounded bg-black px-4 py-2 text-white" onClick={onSave}>Simpan</button>
    </div>
  );
}
