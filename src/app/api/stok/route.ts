// src/app/api/stok/route.ts
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

/** GET /api/stok?status=READY&q=iphone&page=1&pageSize=20&from=YYYY-MM-DD&to=YYYY-MM-DD */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") || "").toUpperCase();
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));
  const offset = (page - 1) * pageSize;

  const rows = await sql`
    select id, nama_produk, sn, imei, storage, warna, garansi, asal,
           harga_modal, tanggal_masuk, status, created_at
    from stok
    where 1=1
      ${status ? sql`and status = ${status}` : sql``}
      ${
        q
          ? sql`and (
              lower(nama_produk) like ${"%" + q + "%"} or
              lower(sn)          like ${"%" + q + "%"} or
              lower(imei)        like ${"%" + q + "%"} or
              lower(storage)     like ${"%" + q + "%"} or
              lower(warna)       like ${"%" + q + "%"} or
              lower(asal)        like ${"%" + q + "%"}
            )`
          : sql``
      }
      ${from ? sql`and tanggal_masuk >= ${from}` : sql``}
      ${to   ? sql`and tanggal_masuk <= ${to}`   : sql``}
    order by created_at desc
    limit ${pageSize} offset ${offset}
  `;

  const countRes = await sql`
    select count(*)::int as c
    from stok
    where 1=1
      ${status ? sql`and status = ${status}` : sql``}
      ${
        q
          ? sql`and (
              lower(nama_produk) like ${"%" + q + "%"} or
              lower(sn)          like ${"%" + q + "%"} or
              lower(imei)        like ${"%" + q + "%"} or
              lower(storage)     like ${"%" + q + "%"} or
              lower(warna)       like ${"%" + q + "%"} or
              lower(asal)        like ${"%" + q + "%"}
            )`
          : sql``
      }
      ${from ? sql`and tanggal_masuk >= ${from}` : sql``}
      ${to   ? sql`and tanggal_masuk <= ${to}`   : sql``}
  `;
  const total = (countRes as unknown as Array<{ c: number }>)[0].c;

  return NextResponse.json({ ok: true, data: rows, page, pageSize, total });
}

/** POST /api/stok  (buat data baru) */
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const nama_produk: string = b.nama_produk;
    const sn: string | null = b.sn ?? null;
    const imei: string | null = b.imei ?? null;
    const storage: string | null = b.storage ?? null;
    const warna: string | null = b.warna ?? null;
    const garansi: string | null = b.garansi ?? null;
    const asal: string | null = b.asal ?? null;
    const harga_modal: number = Number(b.harga_modal ?? 0);
    const tanggal_masuk: string | null = b.tanggal_masuk ?? null;

    if (!nama_produk) return NextResponse.json({ ok: false, error: "nama_produk wajib" }, { status: 400 });

    const res = await sql`
      insert into stok
        (nama_produk, sn, imei, storage, warna, garansi, asal, harga_modal, tanggal_masuk, status)
      values
        (${nama_produk}, ${sn}, ${imei}, ${storage}, ${warna}, ${garansi}, ${asal}, ${harga_modal}, ${tanggal_masuk}, 'READY')
      returning id
    `;

    const id = (res as unknown as Array<{ id: number }>)[0].id;
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// --- PATCH /api/stok (partial update; id wajib) ---
export async function PATCH(req: Request) {
  try {
    const b = await req.json() as {
      id?: number;
      nama_produk?: string;
      sn?: string | null;
      imei?: string | null;
      storage?: string | null;
      warna?: string | null;
      garansi?: string | null;
      asal?: string | null;
      harga_modal?: number | string | null;
      tanggal_masuk?: string | null;
      status?: "READY" | "SOLD";
    };

    const id: number = Number(b.id ?? 0);
    if (!id) {
      return NextResponse.json({ ok: false, error: "id wajib" }, { status: 400 });
    }

    // Normalisasi: jangan kirim undefined ke sql`
    const nama_produk: string | null   = b.nama_produk ?? null;
    const sn: string | null            = b.sn ?? null;
    const imei: string | null          = b.imei ?? null;
    const storage: string | null       = b.storage ?? null;
    const warna: string | null         = b.warna ?? null;
    const garansi: string | null       = b.garansi ?? null;
    const asal: string | null          = b.asal ?? null;
    const harga_modal: number | null   =
      typeof b.harga_modal === "number"
        ? b.harga_modal
        : b.harga_modal != null
        ? Number(b.harga_modal)
        : null;
    const tanggal_masuk: string | null = b.tanggal_masuk ?? null;
    const status: string | null        = b.status ?? null; // "READY" | "SOLD" | null

    const result = await sql`
      update stok set
        nama_produk   = coalesce(${nama_produk}, nama_produk),
        sn            = coalesce(${sn}, sn),
        imei          = coalesce(${imei}, imei),
        storage       = coalesce(${storage}, storage),
        warna         = coalesce(${warna}, warna),
        garansi       = coalesce(${garansi}, garansi),
        asal          = coalesce(${asal}, asal),
        harga_modal   = coalesce(${harga_modal}, harga_modal),
        tanggal_masuk = coalesce(${tanggal_masuk}, tanggal_masuk),
        status        = coalesce(${status}, status)
      where id = ${id}
      returning id
    `;

    const rows = result as unknown as Array<{ id: number }>;
    if (!rows.length) {
      return NextResponse.json({ ok: false, error: "id tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/** DELETE /api/stok  body: { id } */
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "id wajib" }, { status: 400 });

    const r = await sql`delete from stok where id = ${id} returning id`;
    const rows = r as unknown as Array<{ id: number }>;
    if (!rows.length) return NextResponse.json({ ok: false, error: "id tidak ditemukan" }, { status: 404 });

    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
