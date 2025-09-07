import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

type Row = {
  id: number;
  sku: string;
  nama_produk: string;
  warna: string | null;
  stok: number;
  harga_modal: number;
  created_at: string;
};

/** GET /api/aksesoris?q=case&page=1&pageSize=20 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));
  const offset = (page - 1) * pageSize;

  const filter = q
    ? sql` where
        lower(nama_produk) like ${"%" + q + "%"} or
        lower(sku)         like ${"%" + q + "%"} or
        lower(coalesce(warna, '')) like ${"%" + q + "%"}`
    : sql``;

  const rows = await sql<Row[]>`
    select id, sku, nama_produk, warna, coalesce(stok,0) as stok, harga_modal, created_at
    from stok_aksesoris
    ${filter}
    order by created_at desc
    limit ${pageSize} offset ${offset}
  `;

  const [{ c: total }] = await sql<{ c: number }[]>`
    select count(*)::int as c
    from stok_aksesoris
    ${filter}
  `;

  return NextResponse.json({ ok: true, data: rows, page, pageSize, total });
}

/** Body: { nama_produk, sku, warna?, stok, harga_modal } (upsert by SKU) */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      nama_produk: string;
      sku: string;
      warna?: string | null;
      stok: number | string;
      harga_modal: number | string;
    };

    const nama_produk = (body.nama_produk || "").trim();
    const sku = (body.sku || "").trim();
    const warna = (body.warna?.toString().trim() || null) as string | null;
    const stok = Number(body.stok);
    const harga_modal = Number(body.harga_modal);

    if (!nama_produk || !sku || !Number.isFinite(stok) || !Number.isFinite(harga_modal)) {
      return NextResponse.json(
        { ok: false, error: "nama_produk, sku, stok, harga_modal wajib & valid" },
        { status: 400 }
      );
    }

    const res = await sql`
      insert into stok_aksesoris (sku, nama_produk, warna, stok, harga_modal)
      values (${sku}, ${nama_produk}, ${warna}, ${stok}, ${harga_modal})
      on conflict (sku) do update set
        nama_produk = excluded.nama_produk,
        warna       = excluded.warna,
        stok        = excluded.stok,
        harga_modal = excluded.harga_modal
      returning id
    `;

    return NextResponse.json({ ok: true, id: res[0].id }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
