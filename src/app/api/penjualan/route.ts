import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

/** GET /api/penjualan?from=YYYY-MM-DD&to=YYYY-MM-DD&q=iphone&page=1&pageSize=20 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));
  const offset = (page - 1) * pageSize;

  const rows = await sql`
    select id, invoice_id, tanggal, jenis, sn_sku, nama_produk, warna, storage,
           harga_modal, harga_jual, laba, dilayani_oleh, referal, created_at
    from penjualan_baru
    where 1=1
      ${from ? sql` and tanggal >= ${from}` : sql``}
      ${to   ? sql` and tanggal <= ${to}`   : sql``}
      ${
        q
          ? sql` and (
              lower(invoice_id)    like ${"%" + q + "%"} or
              lower(nama_produk)   like ${"%" + q + "%"} or
              lower(sn_sku)        like ${"%" + q + "%"} or
              lower(dilayani_oleh) like ${"%" + q + "%"} or
              lower(referal)       like ${"%" + q + "%"}
            )`
          : sql``
      }
    order by tanggal desc, created_at desc
    limit ${pageSize} offset ${offset}
  `;

  const [{ c: total }] = await sql`
    select count(*)::int as c
    from penjualan_baru
    where 1=1
      ${from ? sql` and tanggal >= ${from}` : sql``}
      ${to   ? sql` and tanggal <= ${to}`   : sql``}
      ${
        q
          ? sql` and (
              lower(invoice_id)    like ${"%" + q + "%"} or
              lower(nama_produk)   like ${"%" + q + "%"} or
              lower(sn_sku)        like ${"%" + q + "%"} or
              lower(dilayani_oleh) like ${"%" + q + "%"} or
              lower(referal)       like ${"%" + q + "%"}
            )`
          : sql``
      }
  `;

  return NextResponse.json({ ok: true, data: rows, page, pageSize, total });
}

export async function POST(req: Request) {
  try {
    const b: unknown = await req.json();
    const body = b as {
      invoice_id?: string;
      jenis?: "UNIT" | "AKSESORIS";
      sn_sku?: string;
      tanggal?: string;
      nama_pembeli?: string | null;
      alamat?: string | null;
      no_wa?: string | null;
      nama_produk?: string;
      warna?: string | null;
      storage?: string | null;
      garansi?: string | null;
      harga_jual?: number;
      referal?: string | null;
    };

    const {
      invoice_id,
      jenis,
      sn_sku,
      tanggal,
      nama_pembeli = null,
      alamat = null,
      no_wa = null,
      nama_produk,
      warna = null,
      storage = null,
      garansi = null,
      harga_jual,
      referal = null,
    } = body;

    if (!invoice_id || !jenis || !sn_sku || !tanggal || !nama_produk || !harga_jual) {
      return NextResponse.json(
        { ok: false, error: "invoice_id, jenis, sn_sku, tanggal, nama_produk, harga_jual wajib" },
        { status: 400 }
      );
    }
    if (jenis !== "UNIT" && jenis !== "AKSESORIS") {
      return NextResponse.json({ ok: false, error: "jenis harus UNIT atau AKSESORIS" }, { status: 400 });
    }

    // Ambil harga modal dari master
    let harga_modal: number | null = null;
    if (jenis === "UNIT") {
      const r = await sql`select harga_modal, status from stok where sn = ${sn_sku}`;
      if (!r.length) return NextResponse.json({ ok: false, error: "SN tidak ditemukan" }, { status: 400 });
      harga_modal = r[0].harga_modal;
    } else {
      const r = await sql`select harga_modal from stok_aksesoris where sku = ${sn_sku}`;
      if (!r.length) return NextResponse.json({ ok: false, error: "SKU tidak ditemukan" }, { status: 400 });
      harga_modal = r[0].harga_modal;
    }

    const user = await currentUser();
    const dilayani_oleh = user?.fullName || user?.emailAddresses?.[0]?.emailAddress || "UNKNOWN";

    const res = await sql`
      insert into penjualan_baru (
        invoice_id, sn_sku, jenis, tanggal,
        nama_pembeli, alamat, no_wa,
        nama_produk, warna, storage, garansi,
        harga_modal, harga_jual, referal, dilayani_oleh
      )
      values (
        ${invoice_id}, ${sn_sku}, ${jenis}, ${tanggal},
        ${nama_pembeli}, ${alamat}, ${no_wa},
        ${nama_produk}, ${warna}, ${storage}, ${garansi},
        ${harga_modal}, ${harga_jual}, ${referal}, ${dilayani_oleh}
      )
      returning id, laba
    `;

    return NextResponse.json({ ok: true, id: res[0].id, laba: res[0].laba }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/** PUT untuk edit penjualan */
export async function PUT(req: Request) {
  try {
    const b: unknown = await req.json();
    const body = b as {
      id: number;
      tanggal?: string | null;
      nama_pembeli?: string | null;
      alamat?: string | null;
      no_wa?: string | null;
      harga_jual?: number | null;
      referal?: string | null;
    };

    const { id, tanggal = null, nama_pembeli = null, alamat = null, no_wa = null, harga_jual = null, referal = null } =
      body;
    if (!id) return NextResponse.json({ ok: false, error: "id wajib" }, { status: 400 });

    const r = await sql`
      update penjualan_baru set
        tanggal      = coalesce(${tanggal}, tanggal),
        nama_pembeli = coalesce(${nama_pembeli}, nama_pembeli),
        alamat       = coalesce(${alamat}, alamat),
        no_wa        = coalesce(${no_wa}, no_wa),
        harga_jual   = coalesce(${harga_jual}, harga_jual),
        referal      = coalesce(${referal}, referal)
      where id = ${id}
      returning id, laba
    `;

    if (!r.length) return NextResponse.json({ ok: false, error: "Data tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ ok: true, id: r[0].id, laba: r[0].laba });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/** DELETE untuk hapus penjualan */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id") || 0);
    if (!id) return NextResponse.json({ ok: false, error: "id wajib" }, { status: 400 });

    const r = await sql`delete from penjualan_baru where id = ${id} returning id`;
    if (!r.length) return NextResponse.json({ ok: false, error: "Data tidak ditemukan" }, { status: 404 });

    return NextResponse.json({ ok: true, id: r[0].id });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
