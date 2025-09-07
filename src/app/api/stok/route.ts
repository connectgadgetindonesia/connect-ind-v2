import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

/** List stok dengan filter sederhana */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase().trim();
  const status = searchParams.get("status") as "READY" | "SOLD" | null;
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const rows = await sql<{
    id: number;
    nama_produk: string;
    sn: string | null;
    imei: string | null;
    storage: string | null;
    warna: string | null;
    garansi: string | null;
    asal: string | null;
    harga_modal: number | null;
    tanggal_masuk: string | null;
    status: "READY" | "SOLD";
  }[]>`
    select id, nama_produk, sn, imei, storage, warna, garansi, asal, harga_modal, tanggal_masuk, status
    from stok
    where 1=1
      ${status ? sql`and status = ${status}` : sql``}
      ${
        q
          ? sql`and (
              lower(nama_produk) like ${"%" + q + "%"} or
              lower(sn) like ${"%" + q + "%"} or
              lower(imei) like ${"%" + q + "%"} or
              lower(storage) like ${"%" + q + "%"} or
              lower(warna) like ${"%" + q + "%"}
            )`
          : sql``
      }
      ${from ? sql`and tanggal_masuk >= ${from}` : sql``}
      ${to ? sql`and tanggal_masuk <= ${to}` : sql``}
    order by id desc
  `;
  return NextResponse.json({ ok: true, data: rows });
}

/** Tambah stok */
export async function POST(req: Request) {
  try {
    const b = (await req.json()) as {
      nama_produk?: string;
      sn?: string | null;
      imei?: string | null;
      storage?: string | null;
      warna?: string | null;
      garansi?: string | null;
      asal?: string | null;
      harga_modal?: number | null;
      tanggal_masuk?: string | null;
    };

    if (!b.nama_produk) {
      return NextResponse.json({ ok: false, error: "nama_produk wajib" }, { status: 400 });
    }

    const res = await sql<{ id: number }[]>`
      insert into stok (
        nama_produk, sn, imei, storage, warna, garansi, asal, harga_modal, tanggal_masuk, status
      )
      values (
        ${b.nama_produk}, ${b.sn ?? null}, ${b.imei ?? null}, ${b.storage ?? null},
        ${b.warna ?? null}, ${b.garansi ?? null}, ${b.asal ?? null},
        ${b.harga_modal ?? null}, ${b.tanggal_masuk ?? null}, 'READY'
      )
      returning id
    `;

    return NextResponse.json({ ok: true, id: res[0].id }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/** Edit stok (partial update) – id wajib */
export async function PATCH(req: Request) {
  try {
    const b = (await req.json()) as {
      id?: number;
      nama_produk?: string;
      sn?: string | null;
      imei?: string | null;
      storage?: string | null;
      warna?: string | null;
      garansi?: string | null;
      asal?: string | null;
      harga_modal?: number | null;
      tanggal_masuk?: string | null;
      status?: "READY" | "SOLD";
    };

    if (!b.id) {
      return NextResponse.json({ ok: false, error: "id wajib" }, { status: 400 });
    }

    const updated = await sql<{ id: number }[]>`
      update stok set
        nama_produk   = coalesce(${b.nama_produk}, nama_produk),
        sn            = coalesce(${b.sn}, sn),
        imei          = coalesce(${b.imei}, imei),
        storage       = coalesce(${b.storage}, storage),
        warna         = coalesce(${b.warna}, warna),
        garansi       = coalesce(${b.garansi}, garansi),
        asal          = coalesce(${b.asal}, asal),
        harga_modal   = coalesce(${b.harga_modal}, harga_modal),
        tanggal_masuk = coalesce(${b.tanggal_masuk}, tanggal_masuk),
        status        = coalesce(${b.status}, status)
      where id = ${b.id}
      returning id
    `;

    if (!updated.length) {
      return NextResponse.json({ ok: false, error: "id tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, id: updated[0].id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/** Hapus stok – id wajib */
export async function DELETE(req: Request) {
  try {
    const b = (await req.json()) as { id?: number };
    if (!b.id) {
      return NextResponse.json({ ok: false, error: "id wajib" }, { status: 400 });
    }
    await sql`delete from stok where id = ${b.id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
