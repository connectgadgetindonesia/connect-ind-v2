import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

/** GET /api/aksesoris?status=READY|SOLD|ALL&q=iphone&page=1&pageSize=20&from=YYYY-MM-DD&to=YYYY-MM-DD */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") || "ALL").toUpperCase();
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));
  const offset = (page - 1) * pageSize;

  const whereStatus =
    status === "READY" || status === "SOLD" ? sql` and status = ${status}` : sql``;

  const qFilter = q
    ? sql` and (
        lower(nama_produk) like ${"%" + q + "%"} or
        lower(sku)         like ${"%" + q + "%"} or
        lower(warna)       like ${"%" + q + "%"} or
        lower(storage)     like ${"%" + q + "%"} or
        lower(asal_produk) like ${"%" + q + "%"}
      )`
    : sql``;

  const fromFilter = from ? sql` and tanggal_masuk >= ${from}` : sql``;
  const toFilter   = to   ? sql` and tanggal_masuk <= ${to}`   : sql``;

  const rows = await sql`
    select id, sku, nama_produk, warna, storage, garansi, asal_produk,
           harga_modal, tanggal_masuk, status, created_at
    from stok_aksesoris
    where 1=1
      ${whereStatus}
      ${qFilter}
      ${fromFilter}
      ${toFilter}
    order by tanggal_masuk desc, created_at desc
    limit ${pageSize} offset ${offset}
  `;

  const [{ c: total }] = await sql`
    select count(*)::int as c
    from stok_aksesoris
    where 1=1
      ${whereStatus}
      ${qFilter}
      ${fromFilter}
      ${toFilter}
  `;

  return NextResponse.json({ ok: true, data: rows, page, pageSize, total });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      nama_produk,
      sku,
      warna = null,
      storage = null,
      garansi = null,
      asal_produk = null,
      harga_modal,
      tanggal_masuk, // YYYY-MM-DD
    } = body as {
      nama_produk: string;
      sku: string;
      warna?: string | null;
      storage?: string | null;
      garansi?: string | null;
      asal_produk?: string | null;
      harga_modal: number;
      tanggal_masuk: string;
    };

    if (!nama_produk || !sku || !harga_modal || !tanggal_masuk) {
      return NextResponse.json(
        { ok: false, error: "nama_produk, sku, harga_modal, tanggal_masuk wajib" },
        { status: 400 }
      );
    }

    const res = await sql`
      insert into stok_aksesoris (
        sku, nama_produk, warna, storage, garansi, asal_produk,
        harga_modal, tanggal_masuk, status
      ) values (
        ${sku}, ${nama_produk}, ${warna}, ${storage}, ${garansi}, ${asal_produk},
        ${harga_modal}, ${tanggal_masuk}, 'READY'
      )
      returning id
    `;

    return NextResponse.json({ ok: true, id: res[0].id }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
