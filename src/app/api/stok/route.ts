import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

/** GET /api/stok?status=READY&q=iphone&from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&pageSize=20 */
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
    select
      id, nama_produk, sn, imei, storage, warna, garansi, asal_produk,
      harga_modal, tanggal_masuk, status
    from stok
    where 1=1
      ${status && status !== "ALL" ? sql` and status = ${status}` : sql``}
      ${
        q
          ? sql` and (
              lower(nama_produk)  like ${"%" + q + "%"} or
              lower(sn)           like ${"%" + q + "%"} or
              lower(imei)         like ${"%" + q + "%"} or
              lower(storage)      like ${"%" + q + "%"} or
              lower(warna)        like ${"%" + q + "%"} or
              lower(asal_produk)  like ${"%" + q + "%"}
            )`
          : sql``
      }
      ${from ? sql` and tanggal_masuk >= ${from}` : sql``}
      ${to   ? sql` and tanggal_masuk <= ${to}`   : sql``}
    order by tanggal_masuk desc, id desc
    limit ${pageSize} offset ${offset}
  `;

  const [{ c: total }] = await sql`
    select count(*)::int as c
    from stok
    where 1=1
      ${status && status !== "ALL" ? sql` and status = ${status}` : sql``}
      ${
        q
          ? sql` and (
              lower(nama_produk)  like ${"%" + q + "%"} or
              lower(sn)           like ${"%" + q + "%"} or
              lower(imei)         like ${"%" + q + "%"} or
              lower(storage)      like ${"%" + q + "%"} or
              lower(warna)        like ${"%" + q + "%"} or
              lower(asal_produk)  like ${"%" + q + "%"}
            )`
          : sql``
      }
      ${from ? sql` and tanggal_masuk >= ${from}` : sql``}
      ${to   ? sql` and tanggal_masuk <= ${to}`   : sql``}
  `;

  return NextResponse.json({ ok: true, data: rows, page, pageSize, total });
}

/** POST: tambah stok unit */
export async function POST(req: Request) {
  try {
    const b: unknown = await req.json();
    const body = b as {
      nama_produk?: string;
      sn?: string | null;
      imei?: string | null;
      storage?: string | null;
      warna?: string | null;
      garansi?: string | null;
      asal_produk?: string | null;
      harga_modal?: number;
      tanggal_masuk?: string;
      status?: "READY" | "SOLD";
    };

    const {
      nama_produk,
      sn = null,
      imei = null,
      storage = null,
      warna = null,
      garansi = null,
      asal_produk = null,
      harga_modal,
      tanggal_masuk,
      status = "READY",
    } = body;

    if (!nama_produk || !harga_modal || !tanggal_masuk) {
      return NextResponse.json(
        { ok: false, error: "nama_produk, harga_modal, tanggal_masuk wajib" },
        { status: 400 }
      );
    }

    const r = await sql`
      insert into stok (
        nama_produk, sn, imei, storage, warna, garansi, asal_produk,
        harga_modal, tanggal_masuk, status
      )
      values (
        ${nama_produk}, ${sn}, ${imei}, ${storage}, ${warna}, ${garansi}, ${asal_produk},
        ${harga_modal}, ${tanggal_masuk}, ${status}
      )
      returning id
    `;

    return NextResponse.json({ ok: true, id: r[0].id }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/** PUT: edit stok unit */
export async function PUT(req: Request) {
  try {
    const b: unknown = await req.json();
    const body = b as {
      id: number;
      nama_produk?: string | null;
      sn?: string | null;
      imei?: string | null;
      storage?: string | null;
      warna?: string | null;
      garansi?: string | null;
      asal_produk?: string | null;
      harga_modal?: number | null;
      tanggal_masuk?: string | null;
      status?: "READY" | "SOLD" | null;
    };

    const {
      id,
      nama_produk = null,
      sn = null,
      imei = null,
      storage = null,
      warna = null,
      garansi = null,
      asal_produk = null,
      harga_modal = null,
      tanggal_masuk = null,
      status = null,
    } = body;

    if (!id) return NextResponse.json({ ok: false, error: "id wajib" }, { status: 400 });

    const r = await sql`
      update stok set
        nama_produk   = coalesce(${nama_produk}, nama_produk),
        sn            = coalesce(${sn}, sn),
        imei          = coalesce(${imei}, imei),
        storage       = coalesce(${storage}, storage),
        warna         = coalesce(${warna}, warna),
        garansi       = coalesce(${garansi}, garansi),
        asal_produk   = coalesce(${asal_produk}, asal_produk),
        harga_modal   = coalesce(${harga_modal}, harga_modal),
        tanggal_masuk = coalesce(${tanggal_masuk}, tanggal_masuk),
        status        = coalesce(${status}, status)
      where id = ${id}
      returning id
    `;

    if (!r.length) return NextResponse.json({ ok: false, error: "Data tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ ok: true, id: r[0].id });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/** DELETE: hapus stok unit */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id") || 0);
    if (!id) return NextResponse.json({ ok: false, error: "id wajib" }, { status: 400 });

    const r = await sql`delete from stok where id = ${id} returning id`;
    if (!r.length) return NextResponse.json({ ok: false, error: "Data tidak ditemukan" }, { status: 404 });

    return NextResponse.json({ ok: true, id: r[0].id });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
