import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

/** GET /api/stok?q=iphone&page=1&pageSize=20 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 20)));
  const offset = (page - 1) * pageSize;

  const rows = await sql`
    select id, nama_produk, serial_number, imei, storage, warna, garansi,
           asal_produk, harga_modal, tanggal_masuk, status, created_at
    from stok_unit
    where 1=1
      ${q
        ? sql`and (lower(nama_produk) like ${"%" + q + "%"}
                   or lower(serial_number) like ${"%" + q + "%"}
                   or lower(imei) like ${"%" + q + "%"})`
        : sql``}
    order by created_at desc
    limit ${pageSize} offset ${offset}
  `;

  const [{ c: total }] = await sql`
    select count(*)::int as c
    from stok_unit
    where 1=1
      ${q
        ? sql`and (lower(nama_produk) like ${"%" + q + "%"}
                   or lower(serial_number) like ${"%" + q + "%"}
                   or lower(imei) like ${"%" + q + "%"})`
        : sql``}
  `;

  return NextResponse.json({ ok: true, data: rows, page, pageSize, total });
}

/** POST /api/stok
 * body: {
 *   nama_produk, serial_number?, imei?, storage?, warna?,
 *   garansi?, asal_produk?, harga_modal, tanggal_masuk(YYYY-MM-DD)
 * }
 */
export async function POST(req: Request) {
  try {
    const b = await req.json();

    const nama_produk   = String(b.nama_produk || "").trim();
    const serial_number = b.serial_number ? String(b.serial_number).trim() : null;
    const imei          = b.imei ? String(b.imei).trim() : null;
    const storage       = b.storage ? String(b.storage).trim() : null;
    const warna         = b.warna ? String(b.warna).trim() : null;
    const garansi       = b.garansi ? String(b.garansi).trim() : null;
    const asal_produk   = b.asal_produk ? String(b.asal_produk).trim() : null;
    const harga_modal   = Number(b.harga_modal);
    const tanggal_masuk = b.tanggal_masuk ? String(b.tanggal_masuk) : null; // "YYYY-MM-DD"

    if (!nama_produk) return NextResponse.json({ ok: false, error: "nama_produk wajib" }, { status: 400 });
    if (!Number.isFinite(harga_modal) || harga_modal < 0) {
      return NextResponse.json({ ok: false, error: "harga_modal harus angka >= 0" }, { status: 400 });
    }
    if (!tanggal_masuk) {
      return NextResponse.json({ ok: false, error: "tanggal_masuk wajib" }, { status: 400 });
    }

    const res = await sql`
      insert into stok_unit (
        nama_produk, serial_number, imei, storage, warna, garansi,
        asal_produk, harga_modal, tanggal_masuk
      ) values (
        ${nama_produk}, ${serial_number}, ${imei}, ${storage}, ${warna}, ${garansi},
        ${asal_produk}, ${harga_modal}, ${tanggal_masuk}
      )
      returning id
    `;

    return NextResponse.json({ ok: true, id: res[0].id }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // error unik SN/IMEI akan nyangkut di sini juga
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
