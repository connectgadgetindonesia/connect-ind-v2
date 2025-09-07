import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

/** GET /api/stok?status=READY&q=iphone&page=1&pageSize=20&from=YYYY-MM-DD&to=YYYY-MM-DD */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const status = (searchParams.get("status") || "").trim().toUpperCase(); // e.g. READY / SOLD
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));
  const offset = (page - 1) * pageSize;

  const whereQ = q
    ? sql`and (
        lower(nama_produk)   like ${"%" + q + "%"} or
        lower(coalesce(serial_number,'')) like ${"%" + q + "%"} or
        lower(coalesce(imei,''))          like ${"%" + q + "%"} or
        lower(coalesce(storage,''))       like ${"%" + q + "%"} or
        lower(coalesce(warna,''))         like ${"%" + q + "%"} or
        lower(coalesce(garansi,''))       like ${"%" + q + "%"} or
        lower(coalesce(asal_produk,''))   like ${"%" + q + "%"}
      )`
    : sql``;

  const rows = await sql`
    select
      id, nama_produk, serial_number, imei, storage, warna, garansi, asal_produk,
      harga_modal, tanggal_masuk, status, created_at
    from stok_unit
    where 1=1
      ${status ? sql`and status = ${status}` : sql``}
      ${from   ? sql`and tanggal_masuk >= ${from}` : sql``}
      ${to     ? sql`and tanggal_masuk <= ${to}`   : sql``}
      ${whereQ}
    order by created_at desc
    limit ${pageSize} offset ${offset}
  `;

  const [{ c: total }] = await sql`
    select count(*)::int as c
    from stok_unit
    where 1=1
      ${status ? sql`and status = ${status}` : sql``}
      ${from   ? sql`and tanggal_masuk >= ${from}` : sql``}
      ${to     ? sql`and tanggal_masuk <= ${to}`   : sql``}
      ${whereQ}
  `;

  return NextResponse.json({ ok: true, data: rows, page, pageSize, total });
}

/** POST /api/stok
 * body:
 * {
 *   nama_produk: string,
 *   serial_number?: string | null,
 *   imei?: string | null,
 *   storage?: string | null,
 *   warna?: string | null,
 *   garansi?: string | null,
 *   asal_produk?: string | null,
 *   harga_modal: number,
 *   tanggal_masuk: "YYYY-MM-DD"
 * }
 */
export async function POST(req: Request) {
  try {
    const b = await req.json();

    const nama_produk   = (b.nama_produk || "").trim();
    const serial_number = b.serial_number ? String(b.serial_number).trim() : null;
    const imei          = b.imei ? String(b.imei).trim() : null;
    const storage       = b.storage ? String(b.storage).trim() : null;
    const warna         = b.warna ? String(b.warna).trim() : null;
    const garansi       = b.garansi ? String(b.garansi).trim() : null;
    const asal_produk   = b.asal_produk ? String(b.asal_produk).trim() : null;
    const harga_modal   = Number(b.harga_modal);
    const tanggal_masuk = (b.tanggal_masuk || "").trim();

    if (!nama_produk || !tanggal_masuk || !Number.isFinite(harga_modal)) {
      return NextResponse.json(
        { ok: false, error: "nama_produk, tanggal_masuk, harga_modal wajib" },
        { status: 400 }
      );
    }

    // Cek duplikasi ringan (opsional)
    if (serial_number) {
      const dupSN = await sql`
        select id from stok_unit where serial_number = ${serial_number} limit 1
      `;
      if (dupSN.length) {
        return NextResponse.json(
          { ok: false, error: "Serial number sudah terdaftar" },
          { status: 400 }
        );
      }
    }
    if (imei) {
      const dupIMEI = await sql`
        select id from stok_unit where imei = ${imei} limit 1
      `;
      if (dupIMEI.length) {
        return NextResponse.json(
          { ok: false, error: "IMEI sudah terdaftar" },
          { status: 400 }
        );
      }
    }

    const [row] = await sql`
      insert into stok_unit (
        nama_produk, serial_number, imei, storage, warna, garansi, asal_produk,
        harga_modal, tanggal_masuk, status
      ) values (
        ${nama_produk}, ${serial_number}, ${imei}, ${storage}, ${warna}, ${garansi}, ${asal_produk},
        ${harga_modal}, ${tanggal_masuk}, 'READY'
      )
      returning id
    `;

    return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
