import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

type Row = {
  id: number;
  invoice_id: string;
  tanggal: string; // ISO
  jenis: "UNIT" | "AKSESORIS";
  sn_sku: string;
  nama_produk: string;
  warna: string | null;
  storage: string | null;
  garansi: string | null;
  harga_modal: number | null;
  harga_jual: number;
  laba: number | null;
  dilayani_oleh: string | null;
  referal: string | null;
  nama_pembeli: string | null;
  created_at: string;
};

// ---------- LIST ----------
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));
  const offset = (page - 1) * pageSize;

  const rows = await sql<Row[]>`
    select id, invoice_id, tanggal, jenis, sn_sku, nama_produk, warna, storage,
           harga_modal, harga_jual, laba, dilayani_oleh, referal, nama_pembeli, created_at
    from penjualan_baru
    where 1=1
      ${from ? sql`and tanggal >= ${from}` : sql``}
      ${to   ? sql`and tanggal <= ${to}`   : sql``}
      ${q
        ? sql`and (
            lower(invoice_id)    like ${"%" + q + "%"} or
            lower(nama_produk)   like ${"%" + q + "%"} or
            lower(sn_sku)        like ${"%" + q + "%"} or
            lower(dilayani_oleh) like ${"%" + q + "%"} or
            lower(referal)       like ${"%" + q + "%"}
          )`
        : sql``}
    order by tanggal desc, created_at desc
    limit ${pageSize} offset ${offset}
  `;

  const [{ c: total }] = await sql<{ c: number }[]>`
    select count(*)::int as c
    from penjualan_baru
    where 1=1
      ${from ? sql`and tanggal >= ${from}` : sql``}
      ${to   ? sql`and tanggal <= ${to}`   : sql``}
      ${q
        ? sql`and (
            lower(invoice_id)    like ${"%" + q + "%"} or
            lower(nama_produk)   like ${"%" + q + "%"} or
            lower(sn_sku)        like ${"%" + q + "%"} or
            lower(dilayani_oleh) like ${"%" + q + "%"} or
            lower(referal)       like ${"%" + q + "%"}
          )`
        : sql``}
  `;

  return NextResponse.json({ ok: true, data: rows, page, pageSize, total });
}

// ---------- CREATE ----------
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const {
      invoice_id,
      jenis,
      sn_sku,
      tanggal,
      nama_pembeli = null,
      nama_produk,
      warna = null,
      storage = null,
      garansi = null,
      harga_jual,
      referal = null,
    } = b;

    if (!invoice_id || !jenis || !sn_sku || !tanggal || !nama_produk || !harga_jual) {
      return NextResponse.json(
        { ok: false, error: "invoice_id, jenis, sn_sku, tanggal, nama_produk, harga_jual wajib" },
        { status: 400 },
      );
    }
    if (jenis !== "UNIT" && jenis !== "AKSESORIS") {
      return NextResponse.json({ ok: false, error: "jenis harus UNIT atau AKSESORIS" }, { status: 400 });
    }

    // modal dari master
    let harga_modal: number | null = null;
    if (jenis === "UNIT") {
      const r = await sql<{ harga_modal: number | null; status: string }[]>`
        select harga_modal, status from stok where sn=${sn_sku}
      `;
      if (!r.length) return NextResponse.json({ ok: false, error: "SN tidak ditemukan" }, { status: 400 });
      harga_modal = r[0].harga_modal;
    } else {
      const r = await sql<{ harga_modal: number | null }[]>`
        select harga_modal from stok_aksesoris where sku=${sn_sku}
      `;
      if (!r.length) return NextResponse.json({ ok: false, error: "SKU tidak ditemukan" }, { status: 400 });
      harga_modal = r[0].harga_modal;
    }

    const user = await currentUser();
    const dilayani_oleh =
      user?.fullName || user?.emailAddresses?.[0]?.emailAddress || "UNKNOWN";

    const r = await sql<{ id: number; laba: number | null }[]>`
      insert into penjualan_baru (
        invoice_id, sn_sku, jenis, tanggal,
        nama_pembeli,
        nama_produk, warna, storage, garansi,
        harga_modal, harga_jual, referal, dilayani_oleh
      )
      values (
        ${invoice_id}, ${sn_sku}, ${jenis}, ${tanggal},
        ${nama_pembeli},
        ${nama_produk}, ${warna}, ${storage}, ${garansi},
        ${harga_modal}, ${Number(harga_jual)}, ${referal}, ${dilayani_oleh}
      )
      returning id, laba
    `;

    // optional: update stok (kalau belum ada trigger DB)
    try {
      if (jenis === "UNIT") {
        await sql`update stok set status='SOLD' where sn=${sn_sku}`;
      } else {
        await sql`update stok_aksesoris set stok=stok-1 where sku=${sn_sku}`;
      }
    } catch {}

    return NextResponse.json({ ok: true, id: r[0].id, laba: r[0].laba }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// ---------- UPDATE ----------
export async function PATCH(req: Request) {
  const b = await req.json();
  const id = Number(b.id || 0);
  if (!id) return NextResponse.json({ ok: false, error: "id wajib" }, { status: 400 });

  const tanggal = b.tanggal as string | undefined;
  const nama_pembeli = b.nama_pembeli as string | undefined;
  const harga_jual = b.harga_jual !== undefined ? Number(b.harga_jual) : undefined;
  const referal = b.referal as string | undefined;

  const r = await sql<{ id: number }[]>`
    update penjualan_baru set
      tanggal      = coalesce(${tanggal}, tanggal),
      nama_pembeli = coalesce(${nama_pembeli}, nama_pembeli),
      harga_jual   = coalesce(${harga_jual}, harga_jual),
      referal      = coalesce(${referal}, referal)
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

  const s = await sql<{ jenis: "UNIT" | "AKSESORIS"; sn_sku: string }[]>`
    select jenis, sn_sku from penjualan_baru where id=${id}
  `;
  if (!s.length) return NextResponse.json({ ok: false, error: "data tidak ditemukan" }, { status: 404 });

  await sql`delete from penjualan_baru where id=${id}`;

  try {
    if ( s[0].jenis === "UNIT") {
      await sql`update stok set status='READY' where sn=${s[0].sn_sku} and status='SOLD'`;
    } else {
      await sql`update stok_aksesoris set stok=stok+1 where sku=${s[0].sn_sku}`;
    }
  } catch {}

  return NextResponse.json({ ok: true });
}
