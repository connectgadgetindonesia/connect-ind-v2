import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

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
  tanggal_masuk: string | null; // ISO
  status: "READY" | "SOLD";
};

// ---------- LIST ----------
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase().trim();
  const status = searchParams.get("status") || ""; // READY/SOLD
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));
  const offset = (page - 1) * pageSize;

  const rows = await sql<StokRow[]>`
    select id, nama_produk, sn, imei, storage, warna, garansi, asal_produk,
           harga_modal, tanggal_masuk, status
    from stok
    where 1=1
      ${q
        ? sql`and (
            lower(nama_produk) like ${"%" + q + "%"} or
            lower(sn)          like ${"%" + q + "%"} or
            lower(imei)        like ${"%" + q + "%"} or
            lower(storage)     like ${"%" + q + "%"} or
            lower(warna)       like ${"%" + q + "%"}
          )`
        : sql``}
      ${status ? sql`and status = ${status}` : sql``}
      ${from ? sql`and tanggal_masuk >= ${from}` : sql``}
      ${to   ? sql`and tanggal_masuk <= ${to}`   : sql``}
    order by coalesce(tanggal_masuk, '1970-01-01') desc, id desc
    limit ${pageSize} offset ${offset}
  `;

  const [{ c: total }] = await sql<{ c: number }[]>`
    select count(*)::int as c
    from stok
    where 1=1
      ${q
        ? sql`and (
            lower(nama_produk) like ${"%" + q + "%"} or
            lower(sn)          like ${"%" + q + "%"} or
            lower(imei)        like ${"%" + q + "%"} or
            lower(storage)     like ${"%" + q + "%"} or
            lower(warna)       like ${"%" + q + "%"}
          )`
        : sql``}
      ${status ? sql`and status = ${status}` : sql``}
      ${from ? sql`and tanggal_masuk >= ${from}` : sql``}
      ${to   ? sql`and tanggal_masuk <= ${to}`   : sql``}
  `;

  return NextResponse.json({ ok: true, data: rows, page, pageSize, total });
}

// ---------- CREATE ----------
export async function POST(req: Request) {
  const b = await req.json();

  const nama_produk = String(b.nama_produk || "").trim();
  const sn = (b.sn ?? b.serial_number ?? "").toString().trim(); // alias
  const imei = (b.imei ?? "").toString().trim();
  const storage = (b.storage ?? "").toString().trim();
  const warna = (b.warna ?? "").toString().trim();
  const garansi = (b.garansi ?? "").toString().trim();
  const asal_produk = (b.asal_produk ?? "").toString().trim();
  const harga_modal = Number(b.harga_modal ?? 0);
  const tanggal_masuk = (b.tanggal_masuk ?? "").toString().slice(0, 10);

  if (!nama_produk || !harga_modal) {
    return NextResponse.json({ ok: false, error: "nama_produk & harga_modal wajib" }, { status: 400 });
  }

  const [{ id }] = await sql<{ id: number }[]>`
    insert into stok (
      nama_produk, sn, imei, storage, warna, garansi,
      asal_produk, harga_modal, tanggal_masuk, status
    )
    values (
      ${nama_produk || null}, ${sn || null}, ${imei || null}, ${storage || null}, ${warna || null},
      ${garansi || null}, ${asal_produk || null}, ${harga_modal || null},
      ${tanggal_masuk || null}, 'READY'
    )
    returning id
  `;

  return NextResponse.json({ ok: true, id }, { status: 201 });
}

// ---------- UPDATE ----------
export async function PATCH(req: Request) {
  const b = await req.json();
  const id = Number(b.id || 0);
  if (!id) return NextResponse.json({ ok: false, error: "id wajib" }, { status: 400 });

  const nama_produk = b.nama_produk as string | undefined;
  const imei = b.imei as string | undefined;
  const storage = b.storage as string | undefined;
  const warna = b.warna as string | undefined;
  const garansi = b.garansi as string | undefined;
  const asal_produk = b.asal_produk as string | undefined;
  const harga_modal = b.harga_modal !== undefined ? Number(b.harga_modal) : undefined;
  const tanggal_masuk = b.tanggal_masuk as string | undefined;

  const r = await sql<{ id: number }[]>`
    update stok set
      nama_produk   = coalesce(${nama_produk}, nama_produk),
      imei          = coalesce(${imei}, imei),
      storage       = coalesce(${storage}, storage),
      warna         = coalesce(${warna}, warna),
      garansi       = coalesce(${garansi}, garansi),
      asal_produk   = coalesce(${asal_produk}, asal_produk),
      harga_modal   = coalesce(${harga_modal}, harga_modal),
      tanggal_masuk = coalesce(${tanggal_masuk}, tanggal_masuk)
    where id = ${id}
    returning id
  `;
  if (!r.length) return NextResponse.json({ ok: false, error: "data tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

// ---------- DELETE ----------
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id") || 0);
  if (!id) return NextResponse.json({ ok: false, error: "id wajib" }, { status: 400 });

  const r = await sql<{ status: string }[]>`select status from stok where id=${id}`;
  if (!r.length) return NextResponse.json({ ok: false, error: "data tidak ditemukan" }, { status: 404 });
  if (r[0].status !== "READY") {
    return NextResponse.json({ ok: false, error: "Tidak bisa hapus stok yang bukan READY" }, { status: 409 });
  }
  await sql`delete from stok where id=${id}`;
  return NextResponse.json({ ok: true });
}
